import 'dotenv/config'
import { and, asc, desc, eq, gte, lte } from 'drizzle-orm'
import { buildApp } from '../app.js'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'
import { randomUUID } from 'node:crypto'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function addDaysIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

async function main() {
  const app = buildApp()
  await app.ready()

  const parentChild = await db
    .select({
      parentId: schema.children.parentId,
      childId: schema.children.id,
    })
    .from(schema.children)
    .orderBy(asc(schema.children.createdAt))
    .limit(1)

  if (!parentChild[0]) {
    throw new Error('No parent/child pair available for verification')
  }

  let availableSlots = await db
    .select({
      slotId: schema.slots.id,
      teacherId: schema.slots.teacherId,
      activityId: schema.slots.activityId,
      date: schema.slots.date,
      startTime: schema.slots.startTime,
      pricePerSession: schema.activities.pricePerSession,
    })
    .from(schema.slots)
    .innerJoin(schema.activities, eq(schema.slots.activityId, schema.activities.id))
    .where(and(
      eq(schema.slots.isAvailable, true),
      eq(schema.activities.status, 'published'),
      gte(schema.slots.date, todayIso()),
      lte(schema.slots.date, addDaysIso(15)),
    ))
    .orderBy(asc(schema.slots.date), asc(schema.slots.startTime))
    .limit(20)

  if (availableSlots.length === 0) {
    const fallbackTemplate = await db
      .select({
        teacherId: schema.slots.teacherId,
        activityId: schema.slots.activityId,
        pricePerSession: schema.activities.pricePerSession,
      })
      .from(schema.slots)
      .innerJoin(schema.activities, eq(schema.slots.activityId, schema.activities.id))
      .where(eq(schema.activities.status, 'published'))
      .orderBy(desc(schema.slots.updatedAt))
      .limit(1)

    if (!fallbackTemplate[0]) {
      throw new Error('No slot template found to create a future verification slot')
    }

    const futureDate = addDaysIso(3)
    const [createdSlot] = await db.insert(schema.slots).values({
      id: randomUUID(),
      teacherId: fallbackTemplate[0].teacherId,
      activityId: fallbackTemplate[0].activityId,
      date: futureDate,
      startTime: '10:00:00',
      endTime: '11:00:00',
      isAvailable: true,
    }).returning({
      slotId: schema.slots.id,
      teacherId: schema.slots.teacherId,
      activityId: schema.slots.activityId,
      date: schema.slots.date,
      startTime: schema.slots.startTime,
    })

    if (!createdSlot) {
      throw new Error('Could not create a future verification slot')
    }

    availableSlots = [{
      ...createdSlot,
      pricePerSession: fallbackTemplate[0].pricePerSession,
    }]
  }

  const base = parentChild[0]
  let createdBookingId: string | null = null

  for (const slot of availableSlots) {
    const createRes = await app.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        parentId: base.parentId,
        childId: base.childId,
        activityId: slot.activityId,
        slotId: slot.slotId,
        totalAmount: Number(slot.pricePerSession),
      },
    })

    if (createRes.statusCode === 201) {
      const payload = createRes.json() as { booking: { id: string } }
      createdBookingId = payload.booking.id
      break
    }
  }

  if (!createdBookingId) {
    throw new Error('Could not create a fresh verification booking from available slots')
  }

  const now = new Date()
  await db.update(schema.bookings)
    .set({
      status: 'confirmed',
      scheduledAt: now,
      confirmedAt: now,
      teacherOtp: '000000',
      teacherOtpGeneratedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.bookings.id, createdBookingId))

  const liveVerifyRes = await app.inject({
    method: 'POST',
    url: `/bookings/${createdBookingId}/verify-otp`,
    payload: {
      parentId: base.parentId,
      otp: '000000',
    },
  })

  if (liveVerifyRes.statusCode !== 200) {
    throw new Error(`OTP verification failed: ${liveVerifyRes.statusCode} ${liveVerifyRes.body}`)
  }

  const reportIssueRes = await app.inject({
    method: 'POST',
    url: `/bookings/${createdBookingId}/issues`,
    payload: {
      parentId: base.parentId,
      issueType: 'venue_issue',
      description: 'Verification script: venue guidance missing during live session',
      requestedResolution: 'support_only',
    },
  })

  if (reportIssueRes.statusCode !== 201) {
    throw new Error(`Issue report failed: ${reportIssueRes.statusCode} ${reportIssueRes.body}`)
  }

  const completeRes = await app.inject({
    method: 'POST',
    url: `/bookings/${createdBookingId}/complete`,
    payload: {
      parentId: base.parentId,
    },
  })

  if (completeRes.statusCode !== 200) {
    throw new Error(`Completion failed: ${completeRes.statusCode} ${completeRes.body}`)
  }

  const feedbackRes = await app.inject({
    method: 'POST',
    url: `/bookings/${createdBookingId}/feedback`,
    payload: {
      parentId: base.parentId,
      rating: 5,
      comment: 'Verification script feedback submission',
    },
  })

  if (feedbackRes.statusCode !== 201) {
    throw new Error(`Feedback submission failed: ${feedbackRes.statusCode} ${feedbackRes.body}`)
  }

  const cancelledBooking = await db
    .select({
      id: schema.bookings.id,
      parentId: schema.bookings.parentId,
    })
    .from(schema.bookings)
    .where(eq(schema.bookings.status, 'cancelled'))
    .orderBy(desc(schema.bookings.updatedAt))
    .limit(1)

  if (!cancelledBooking[0]) {
    throw new Error('No cancelled booking found for refund/credit verification')
  }

  const cancelledIssueRes = await app.inject({
    method: 'POST',
    url: `/bookings/${cancelledBooking[0].id}/issues`,
    payload: {
      parentId: cancelledBooking[0].parentId,
      issueType: 'schedule_issue',
      description: 'Verification script refund follow-up',
      requestedResolution: 'refund',
    },
  })

  if (cancelledIssueRes.statusCode !== 201) {
    throw new Error(`Cancelled booking issue report failed: ${cancelledIssueRes.statusCode} ${cancelledIssueRes.body}`)
  }

  const detailRes = await app.inject({
    method: 'GET',
    url: `/bookings/${createdBookingId}?parentId=${base.parentId}`,
  })

  if (detailRes.statusCode !== 200) {
    throw new Error(`Booking detail fetch failed: ${detailRes.statusCode} ${detailRes.body}`)
  }

  const listRes = await app.inject({
    method: 'GET',
    url: `/bookings?parentId=${base.parentId}&status=confirmed,in_progress,completed,cancelled,rescheduled,pending`,
  })

  if (listRes.statusCode !== 200) {
    throw new Error(`Booking list fetch failed: ${listRes.statusCode} ${listRes.body}`)
  }

  const detail = detailRes.json() as {
    status: string
    issueReported?: boolean
    issueStatus?: string | null
    issueResolution?: string | null
  }
  const list = listRes.json() as {
    items: Array<{ id: string; issueReported?: boolean; issueStatus?: string | null; issueResolution?: string | null }>
  }
  const createdListItem = list.items.find((item) => item.id === createdBookingId)

  console.log(JSON.stringify({
    verification: 'ok',
    createdBookingId,
    liveIssueReported: detail.issueReported,
    liveIssueStatus: detail.issueStatus,
    liveIssueResolution: detail.issueResolution,
    finalStatus: detail.status,
    listProjection: createdListItem ?? null,
    cancelledIssueBookingId: cancelledBooking[0].id,
  }, null, 2))

  await app.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
