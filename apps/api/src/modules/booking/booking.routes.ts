import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { eq, and, or, desc, ne, inArray, count } from 'drizzle-orm'
import { syncConflictingTeacherSlots } from '../../lib/slot-availability.js'

const MAX_BOOKING_HOURS = 24 * 15
const RESCHEDULE_BUFFER_HOURS = 24
const OTP_VISIBLE_WINDOW_BEFORE_MINS = 15
const OTP_VISIBLE_WINDOW_AFTER_HOURS = 3
const DEVELOPMENT_OTP = '000000'
const APP_MODE = process.env.APP_MODE ?? process.env.NODE_ENV ?? 'development'
const MIN_BOOKING_HOURS = APP_MODE === 'development' ? 0 : 24
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parseSlotDateTime(slot: { date: string; startTime: string }) {
  return new Date(`${slot.date}T${slot.startTime}`)
}

function getHoursUntil(date: Date) {
  return (date.getTime() - Date.now()) / (1000 * 60 * 60)
}

function validateBookingWindow(slotDateTime: Date) {
  const hoursUntil = getHoursUntil(slotDateTime)
  return hoursUntil >= MIN_BOOKING_HOURS && hoursUntil <= MAX_BOOKING_HOURS
}

function canReschedule(scheduledAt: Date | string | null) {
  if (!scheduledAt) return false
  return getHoursUntil(new Date(scheduledAt)) >= RESCHEDULE_BUFFER_HOURS
}

function canRevealOtp(scheduledAt: Date | string | null) {
  if (!scheduledAt) return false
  const sessionStart = new Date(scheduledAt).getTime()
  const now = Date.now()
  return (
    now >= sessionStart - OTP_VISIBLE_WINDOW_BEFORE_MINS * 60 * 1000 &&
    now <= sessionStart + OTP_VISIBLE_WINDOW_AFTER_HOURS * 60 * 60 * 1000
  )
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function buildCaseReference() {
  return `CASE-${randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase()}`
}

function getIssueSlaTarget(now: Date) {
  const target = new Date(now)
  target.setHours(18, 0, 0, 0)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }
  return target
}

function getDesiredOutcomeFromResolution(resolution?: 'none' | 'refund' | 'credit' | 'support_only') {
  if (resolution === 'refund') return 'refund'
  if (resolution === 'credit') return 'credit'
  return 'support'
}

function getDefaultNextAction(issueType: 'no_show' | 'venue_issue' | 'safety_issue' | 'schedule_issue' | 'other') {
  switch (issueType) {
    case 'no_show':
      return 'We are checking with the facilitator and venue team now.'
    case 'safety_issue':
      return 'A Beam lead will review this safety concern as a priority.'
    case 'schedule_issue':
      return 'We are reviewing the timing or cancellation issue and next best option.'
    case 'venue_issue':
      return 'We are reviewing the venue details and support steps for this session.'
    default:
      return 'Beam support will review this case and update you in the app.'
  }
}

function getResolutionOfferLabel(resolution: 'none' | 'refund' | 'credit' | 'support_only' | null | undefined) {
  switch (resolution) {
    case 'refund':
      return 'Refund approved'
    case 'credit':
      return 'Beam credit offered'
    case 'support_only':
      return 'Support follow-up'
    default:
      return null
  }
}

async function createNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}) {
  await db.insert(schema.notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data ?? null,
  })
}

async function sendTeacherWhatsAppNotification(params: {
  teacherId: string
  teacherName: string
  parentName: string
  activityTitle: string
  scheduledAt: Date
  bookingId: string
}) {
  const message = `New Beam booking for ${params.activityTitle} with ${params.parentName} on ${params.scheduledAt.toLocaleString('en-IN')}. Booking ${params.bookingId.slice(0, 8).toUpperCase()}.`
  await createNotification({
    userId: params.teacherId,
    type: 'booking.whatsapp_sent',
    title: 'WhatsApp booking alert',
    body: message,
    data: { bookingId: params.bookingId, channel: 'whatsapp' },
  })
  console.log('[beam-whatsapp][teacher]', { teacherId: params.teacherId, message })
}

async function createMockPayment(params: { bookingId: string; parentId: string; amount: number }) {
  const [payment] = await db.insert(schema.payments).values({
    bookingId: params.bookingId,
    parentId: params.parentId,
    amount: String(params.amount),
    gateway: 'upi',
    gatewayPaymentId: `mock_${params.bookingId.slice(0, 8)}`,
    status: 'success',
  }).returning()

  return payment
}

async function findParentConflictingBooking(params: {
  parentId: string
  scheduledAt: Date
  excludeBookingId?: string
}) {
  const conditions = [
    eq(schema.bookings.parentId, params.parentId),
    eq(schema.bookings.scheduledAt, params.scheduledAt),
    ne(schema.bookings.status, 'cancelled'),
  ]

  if (params.excludeBookingId) {
    conditions.push(ne(schema.bookings.id, params.excludeBookingId))
  }

  return db.query.bookings.findFirst({
    where: and(...conditions),
  })
}

async function getLatestSessionIssuesMap(bookingIds: string[]) {
  if (bookingIds.length === 0) return new Map<string, typeof schema.sessionIssues.$inferSelect>()

  const rows = await db
    .select()
    .from(schema.sessionIssues)
    .where(inArray(schema.sessionIssues.bookingId, bookingIds))
    .orderBy(desc(schema.sessionIssues.reportedAt), desc(schema.sessionIssues.createdAt))

  const map = new Map<string, typeof schema.sessionIssues.$inferSelect>()
  for (const row of rows) {
    if (!map.has(row.bookingId)) {
      map.set(row.bookingId, row)
    }
  }
  return map
}

export async function bookingRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { status?: 'pending' | 'verified' | 'rejected'; limit?: string } }>('/teachers', async (req, reply) => {
    const status = req.query.status ?? 'verified'
    const parsedLimit = Number.parseInt(req.query.limit ?? '4', 10)
    const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 12) : 4

    const rows = await db
      .select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        city: schema.users.city,
        bio: schema.teachers.bio,
        specializations: schema.teachers.specializations,
        languages: schema.teachers.languages,
        verificationStatus: schema.teachers.verificationStatus,
        rating: schema.teachers.rating,
        reviewCount: schema.teachers.reviewCount,
        totalSessions: count(schema.bookings.id),
      })
      .from(schema.teachers)
      .innerJoin(schema.users, eq(schema.teachers.userId, schema.users.id))
      .leftJoin(
        schema.bookings,
        and(
          eq(schema.bookings.teacherId, schema.users.id),
          eq(schema.bookings.status, 'completed'),
        ),
      )
      .where(eq(schema.teachers.verificationStatus, status))
      .groupBy(
        schema.users.id,
        schema.users.firstName,
        schema.users.lastName,
        schema.users.city,
        schema.teachers.bio,
        schema.teachers.specializations,
        schema.teachers.languages,
        schema.teachers.verificationStatus,
        schema.teachers.rating,
        schema.teachers.reviewCount,
      )
      .orderBy(desc(schema.teachers.rating), desc(schema.teachers.reviewCount), schema.users.firstName, schema.users.lastName)
      .limit(limit)

    return reply.send({
      items: rows.map((row) => ({
        ...row,
        specializations: row.specializations ?? [],
        languages: row.languages ?? [],
        totalSessions: Number(row.totalSessions ?? 0),
        reviewCount: Number(row.reviewCount ?? 0),
      })),
    })
  })

  fastify.get<{
    Querystring: { parentId: string; status?: string }
  }>('/bookings', async (req, reply) => {
    const { parentId, status } = req.query
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const conditions = [eq(schema.bookings.parentId, parentId)]
    if (status) {
      const statuses = status.split(',')
      conditions.push(or(...statuses.map(s => eq(schema.bookings.status, s as any)))!)
    }

    const rows = await db
      .select({
        id: schema.bookings.id,
        status: schema.bookings.status,
        sessionType: schema.bookings.sessionType,
        deliveryMode: schema.activities.deliveryMode,
        locality: schema.activities.locality,
        city: schema.activities.city,
        totalAmount: schema.bookings.totalAmount,
        scheduledAt: schema.bookings.scheduledAt,
        createdAt: schema.bookings.createdAt,
        confirmedAt: schema.bookings.confirmedAt,
        teacherOtpVerifiedAt: schema.bookings.teacherOtpVerifiedAt,
        completedAt: schema.bookings.completedAt,
        payoutReleasedAt: schema.bookings.payoutReleasedAt,
        activityId: schema.bookings.activityId,
        activityTitle: schema.activities.title,
        activityImage: schema.activities.imageUrl,
        activityDuration: schema.activities.sessionDurationMins,
        teacherId: schema.bookings.teacherId,
        teacherFirstName: schema.users.firstName,
        teacherLastName: schema.users.lastName,
        childFirstName: schema.children.firstName,
        feedbackId: schema.reviews.id,
        feedbackRating: schema.reviews.rating,
        feedbackComment: schema.reviews.comment,
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.users, eq(schema.bookings.teacherId, schema.users.id))
      .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
      .leftJoin(schema.reviews, eq(schema.bookings.id, schema.reviews.bookingId))
      .where(and(...conditions))
      .orderBy(desc(schema.bookings.scheduledAt))

    const latestIssues = await getLatestSessionIssuesMap(rows.map((row) => row.id))

    return reply.send({
      items: rows.map((row) => {
        const latestIssue = latestIssues.get(row.id)
        return {
          ...row,
          issueReported: !!latestIssue,
          issueId: latestIssue?.id ?? null,
          issueCaseReference: latestIssue?.caseReference ?? null,
          issueStatus: latestIssue?.status ?? null,
          issueResolution: latestIssue?.resolution ?? null,
          issueResolutionLabel: getResolutionOfferLabel(latestIssue?.resolution),
          issueType: latestIssue?.issueType ?? null,
          issueDesiredOutcome: latestIssue?.desiredOutcome ?? null,
          issueNextAction: latestIssue?.nextAction ?? null,
          issueSlaTargetAt: latestIssue?.slaTargetAt ?? null,
          issueAttachmentUrls: latestIssue?.attachmentUrls ?? [],
          issueIntakeAnswers: latestIssue?.intakeAnswers ?? [],
          issueResolvedAt: latestIssue?.resolvedAt ?? null,
          feedbackSubmitted: !!row.feedbackId,
          feedbackRating: row.feedbackRating ?? null,
          feedbackComment: row.feedbackComment ?? null,
        }
      }),
    })
  })

  fastify.get<{ Querystring: { parentId: string } }>('/children', async (req, reply) => {
    const { parentId } = req.query
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const rows = await db
      .select({
        id: schema.children.id,
        firstName: schema.children.firstName,
        lastName: schema.children.lastName,
        dateOfBirth: schema.children.dateOfBirth,
        gender: schema.children.gender,
        interests: schema.children.interests,
        notes: schema.children.notes,
      })
      .from(schema.children)
      .where(eq(schema.children.parentId, parentId))
      .orderBy(schema.children.createdAt)

    return reply.send({ items: rows })
  })

  fastify.post<{
    Body: {
      parentId: string
      firstName: string
      lastName?: string
      dateOfBirth: string
      gender?: string
      interests?: string[]
      notes?: string
    }
  }>('/children', async (req, reply) => {
    const { parentId, firstName, lastName, dateOfBirth, gender, interests, notes } = req.body
    if (!parentId || !firstName || !dateOfBirth) {
      return reply.status(400).send({ error: 'parentId, firstName, and dateOfBirth are required' })
    }

    const [child] = await db.insert(schema.children).values({
      parentId,
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      dateOfBirth,
      gender: gender?.trim() || null,
      interests: interests ?? [],
      notes: notes?.trim() || null,
    }).returning()

    return reply.status(201).send(child)
  })

  fastify.post<{
    Body: { parentId: string; childId: string; activityId: string; slotId: string; totalAmount: number; discountCode?: string; discountAmount?: number }
  }>('/bookings', async (req, reply) => {
    const { parentId, childId, activityId, slotId, totalAmount, discountCode, discountAmount = 0 } = req.body
    if (!parentId || !childId || !activityId || !slotId || !totalAmount) {
      return reply.status(400).send({ error: 'parentId, childId, activityId, slotId, totalAmount are required' })
    }

    const [slot, parent, activity] = await Promise.all([
      db.query.slots.findFirst({ where: eq(schema.slots.id, slotId) }),
      db.query.users.findFirst({ where: eq(schema.users.id, parentId) }),
      db.query.activities.findFirst({ where: eq(schema.activities.id, activityId) }),
    ])

    if (!slot) return reply.status(404).send({ error: 'Slot not found' })
    if (!slot.isAvailable) return reply.status(409).send({ error: 'Slot no longer available' })
    if (slot.activityId !== activityId) return reply.status(422).send({ error: 'Selected slot does not belong to this activity' })
    if (!activity) return reply.status(404).send({ error: 'Activity not found' })

    const scheduledAt = parseSlotDateTime({ date: slot.date, startTime: slot.startTime })
    if (!validateBookingWindow(scheduledAt)) {
      return reply.status(422).send({ error: 'Bookings can only be made between 1 and 15 days before the class time' })
    }

    const conflictingBooking = await findParentConflictingBooking({ parentId, scheduledAt })
    if (conflictingBooking) {
      return reply.status(409).send({ error: 'You already have another booking scheduled at this date and time' })
    }

    const bookingId = randomUUID()
    const now = new Date()
    const isDevelopmentMode = APP_MODE === 'development'
    const [booking] = await db.insert(schema.bookings).values({
      id: bookingId,
      parentId,
      childId,
      activityId,
      slotId,
      teacherId: slot.teacherId,
      status: isDevelopmentMode ? 'confirmed' : 'pending',
      sessionType: activity.sessionType,
      totalAmount: String(totalAmount),
      discountAmount: String(discountAmount),
      discountCode: discountCode ?? null,
      scheduledAt,
      confirmedAt: isDevelopmentMode ? now : null,
      teacherOtp: isDevelopmentMode ? DEVELOPMENT_OTP : null,
      teacherOtpGeneratedAt: isDevelopmentMode ? now : null,
      lastWhatsAppSentAt: now,
    }).returning()

    const payment = await createMockPayment({ bookingId, parentId, amount: totalAmount })

    await syncConflictingTeacherSlots(db, {
      teacherId: slot.teacherId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
    })

    const teacher = await db.query.users.findFirst({ where: eq(schema.users.id, slot.teacherId) })
    if (teacher) {
      await sendTeacherWhatsAppNotification({
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`.trim(),
        parentName: parent ? `${parent.firstName} ${parent.lastName}`.trim() : 'A parent',
        activityTitle: activity.title,
        scheduledAt,
        bookingId,
      })
    }

    return reply.status(201).send({ booking, payment })
  })

  fastify.get<{ Params: { id: string }; Querystring: { parentId: string } }>('/bookings/:id', async (req, reply) => {
    const { id } = req.params
    const { parentId } = req.query
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const rows = await db
      .select({
        id: schema.bookings.id,
        status: schema.bookings.status,
        sessionType: schema.bookings.sessionType,
        deliveryMode: schema.activities.deliveryMode,
        locality: schema.activities.locality,
        city: schema.activities.city,
        totalAmount: schema.bookings.totalAmount,
        scheduledAt: schema.bookings.scheduledAt,
        createdAt: schema.bookings.createdAt,
        confirmedAt: schema.bookings.confirmedAt,
        teacherOtp: schema.bookings.teacherOtp,
        teacherOtpVerifiedAt: schema.bookings.teacherOtpVerifiedAt,
        completedAt: schema.bookings.completedAt,
        parentCompletedAt: schema.bookings.parentCompletedAt,
        payoutQueuedAt: schema.bookings.payoutQueuedAt,
        payoutReleasedAt: schema.bookings.payoutReleasedAt,
        activityId: schema.bookings.activityId,
        activityTitle: schema.activities.title,
        activityImage: schema.activities.imageUrl,
        activityDuration: schema.activities.sessionDurationMins,
        teacherId: schema.bookings.teacherId,
        teacherFirstName: schema.users.firstName,
        teacherLastName: schema.users.lastName,
        childFirstName: schema.children.firstName,
        childLastName: schema.children.lastName,
        paymentStatus: schema.payments.status,
        feedbackId: schema.reviews.id,
        feedbackRating: schema.reviews.rating,
        feedbackComment: schema.reviews.comment,
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.users, eq(schema.bookings.teacherId, schema.users.id))
      .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
      .leftJoin(schema.payments, eq(schema.bookings.id, schema.payments.bookingId))
      .leftJoin(schema.reviews, eq(schema.bookings.id, schema.reviews.bookingId))
      .where(and(eq(schema.bookings.id, id), eq(schema.bookings.parentId, parentId)))
      .limit(1)

    if (!rows[0]) return reply.status(404).send({ error: 'Booking not found' })

    const booking = rows[0]
    const latestIssue = await db.query.sessionIssues.findFirst({
      where: eq(schema.sessionIssues.bookingId, booking.id),
      orderBy: [desc(schema.sessionIssues.reportedAt), desc(schema.sessionIssues.createdAt)],
    })
    return reply.send({
      ...booking,
      teacherOtp: !!booking.teacherOtpVerifiedAt ? booking.teacherOtp : null,
      canReschedule: canReschedule(booking.scheduledAt) && ['pending', 'confirmed'].includes(booking.status),
      canComplete: booking.status === 'in_progress' && !!booking.teacherOtpVerifiedAt,
      otpVisible: canRevealOtp(booking.scheduledAt),
      issueReported: !!latestIssue,
      issueId: latestIssue?.id ?? null,
      issueCaseReference: latestIssue?.caseReference ?? null,
      issueStatus: latestIssue?.status ?? null,
      issueResolution: latestIssue?.resolution ?? null,
      issueResolutionLabel: getResolutionOfferLabel(latestIssue?.resolution),
      issueType: latestIssue?.issueType ?? null,
      issueDescription: latestIssue?.description ?? null,
      issueReportedAt: latestIssue?.reportedAt ?? null,
      issueDesiredOutcome: latestIssue?.desiredOutcome ?? null,
      issueNextAction: latestIssue?.nextAction ?? null,
      issueSlaTargetAt: latestIssue?.slaTargetAt ?? null,
      issueAttachmentUrls: latestIssue?.attachmentUrls ?? [],
      issueIntakeAnswers: latestIssue?.intakeAnswers ?? [],
      issueResolvedAt: latestIssue?.resolvedAt ?? null,
      feedbackSubmitted: !!booking.feedbackId,
      feedbackRating: booking.feedbackRating ?? null,
      feedbackComment: booking.feedbackComment ?? null,
    })
  })

  fastify.patch<{ Params: { id: string }; Body: { parentId: string; newSlotId: string } }>(
    '/bookings/:id/reschedule',
    async (req, reply) => {
      const { id } = req.params
      const { parentId, newSlotId } = req.body
      if (!parentId || !newSlotId) return reply.status(400).send({ error: 'parentId and newSlotId are required' })

      const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
      if (!booking) return reply.status(404).send({ error: 'Booking not found' })
      if (booking.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return reply.status(422).send({ error: 'Only pending or confirmed bookings can be rescheduled' })
      }
      if (!canReschedule(booking.scheduledAt)) {
        return reply.status(422).send({ error: 'Bookings can only be edited at least 24 hours before the allotted slot' })
      }

      const newSlot = await db.query.slots.findFirst({ where: eq(schema.slots.id, newSlotId) })
      if (!newSlot) return reply.status(404).send({ error: 'New slot not found' })
      if (!newSlot.isAvailable) return reply.status(409).send({ error: 'New slot is no longer available' })
      if (newSlot.activityId !== booking.activityId) return reply.status(422).send({ error: 'New slot must belong to the same activity' })

      const previousSlot = booking.slotId
        ? await db.query.slots.findFirst({ where: eq(schema.slots.id, booking.slotId) })
        : null

      const newScheduledAt = parseSlotDateTime({ date: newSlot.date, startTime: newSlot.startTime })
      if (!validateBookingWindow(newScheduledAt)) {
        return reply.status(422).send({ error: 'Rescheduled bookings must still be between 1 and 15 days before the class time' })
      }

      const conflictingBooking = await findParentConflictingBooking({
        parentId,
        scheduledAt: newScheduledAt,
        excludeBookingId: booking.id,
      })
      if (conflictingBooking) {
        return reply.status(409).send({ error: 'You already have another booking scheduled at this date and time' })
      }

      const now = new Date()
      await db.transaction(async (tx) => {
        await tx.update(schema.bookings)
          .set({
            slotId: newSlotId,
            teacherId: newSlot.teacherId,
            scheduledAt: newScheduledAt,
            status: 'pending',
            confirmedAt: null,
            teacherOtp: null,
            teacherOtpGeneratedAt: null,
            teacherOtpVerifiedAt: null,
            completedAt: null,
            parentCompletedAt: null,
            payoutQueuedAt: null,
            payoutReleasedAt: null,
            lastWhatsAppSentAt: now,
            updatedAt: now,
          })
          .where(eq(schema.bookings.id, id))

        if (previousSlot) {
          await syncConflictingTeacherSlots(tx, {
            teacherId: previousSlot.teacherId,
            date: previousSlot.date,
            startTime: previousSlot.startTime,
            endTime: previousSlot.endTime,
          })
        }

        await syncConflictingTeacherSlots(tx, {
          teacherId: newSlot.teacherId,
          date: newSlot.date,
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
        })
      })

      const parent = await db.query.users.findFirst({ where: eq(schema.users.id, parentId) })
      const activity = await db.query.activities.findFirst({ where: eq(schema.activities.id, booking.activityId) })
      const teacher = await db.query.users.findFirst({ where: eq(schema.users.id, newSlot.teacherId) })
      if (teacher && activity) {
        await sendTeacherWhatsAppNotification({
          teacherId: teacher.id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`.trim(),
          parentName: parent ? `${parent.firstName} ${parent.lastName}`.trim() : 'A parent',
          activityTitle: activity.title,
          scheduledAt: newScheduledAt,
          bookingId: booking.id,
        })
      }

      const updated = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
      return reply.send({ ok: true, booking: updated })
    },
  )

  fastify.post<{ Params: { id: string }; Body: { parentId: string } }>('/bookings/:id/cancel', async (req, reply) => {
    const { id } = req.params
    const { parentId } = req.body
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })
    if (booking.status === 'cancelled') return reply.status(422).send({ error: 'Booking already cancelled' })
    if (booking.status === 'completed') return reply.status(422).send({ error: 'Cannot cancel a completed booking' })

    const now = new Date()
    const [updated] = await db.update(schema.bookings)
      .set({ status: 'cancelled', updatedAt: now })
      .where(eq(schema.bookings.id, id))
      .returning()

    if (booking.slotId) {
      const slot = await db.query.slots.findFirst({ where: eq(schema.slots.id, booking.slotId) })
      if (slot) {
        await syncConflictingTeacherSlots(db, {
          teacherId: slot.teacherId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
        })
      }
    }

    await db.update(schema.payments)
      .set({ status: 'refunded', refundedAt: now, updatedAt: now })
      .where(eq(schema.payments.bookingId, id))

    return reply.send({ ok: true, booking: updated })
  })

  fastify.post<{ Params: { id: string }; Body: { parentId: string; otp: string } }>(
    '/bookings/:id/verify-otp',
    async (req, reply) => {
      const { id } = req.params
      const { parentId, otp } = req.body
      if (!parentId || !otp) return reply.status(400).send({ error: 'parentId and otp are required' })

      const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
      if (!booking) return reply.status(404).send({ error: 'Booking not found' })
      if (booking.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })
      if (!['confirmed', 'in_progress'].includes(booking.status)) return reply.status(422).send({ error: 'Booking is not ready for OTP verification' })
      if (!canRevealOtp(booking.scheduledAt)) return reply.status(422).send({ error: 'OTP can only be verified near the class start time' })
      const validOtp = booking.teacherOtp === otp || (APP_MODE === 'development' && otp === DEVELOPMENT_OTP)
      if (!booking.teacherOtp || !validOtp) return reply.status(422).send({ error: 'Invalid OTP' })

      const now = new Date()
      const [updated] = await db.update(schema.bookings)
        .set({
          status: 'in_progress',
          teacherOtpVerifiedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.bookings.id, id))
        .returning()

      return reply.send({ ok: true, booking: updated })
    },
  )

  fastify.post<{ Params: { id: string }; Body: { parentId: string } }>(
    '/bookings/:id/complete',
    async (req, reply) => {
      const { id } = req.params
      const { parentId } = req.body
      if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

      const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
      if (!booking) return reply.status(404).send({ error: 'Booking not found' })
      if (booking.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })
      if (booking.status === 'completed') return reply.status(422).send({ error: 'Booking already completed' })
      if (!booking.teacherOtpVerifiedAt) return reply.status(422).send({ error: 'Class start OTP must be verified before completion' })
      if (!booking.teacherId) return reply.status(422).send({ error: 'Booking is missing teacher information' })

      const now = new Date()
      const [updated] = await db.update(schema.bookings)
        .set({
          status: 'completed',
          completedAt: now,
          parentCompletedAt: now,
          payoutQueuedAt: now,
          payoutReleasedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.bookings.id, id))
        .returning()

      await db.insert(schema.payouts).values({
        teacherId: booking.teacherId,
        amount: booking.totalAmount,
        sessionCount: 1,
        bookingIds: [booking.id],
        status: 'settled',
        scheduledAt: now,
        settledAt: now,
      })

      return reply.send({ ok: true, booking: updated })
    },
  )

  fastify.post<{
    Params: { id: string }
    Body: {
      parentId: string
      issueType: 'no_show' | 'venue_issue' | 'safety_issue' | 'schedule_issue' | 'other'
      description?: string
      desiredOutcome?: 'refund' | 'credit' | 'rebooking' | 'support'
      requestedResolution?: 'none' | 'refund' | 'credit' | 'support_only'
      attachmentUrls?: string[]
      intakeAnswers?: Array<{ questionId: string; label: string; answer: string }>
    }
  }>('/bookings/:id/issues', async (req, reply) => {
    const { id } = req.params
    const { parentId, issueType, description, desiredOutcome, requestedResolution, attachmentUrls, intakeAnswers } = req.body

    if (!parentId || !issueType) {
      return reply.status(400).send({ error: 'parentId and issueType are required' })
    }

    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })
    if (!['confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled'].includes(booking.status)) {
      return reply.status(422).send({ error: 'Issue reporting is not available for this booking state' })
    }

    const now = new Date()
    const nextSlaTarget = getIssueSlaTarget(now)
    const nextDesiredOutcome = desiredOutcome ?? getDesiredOutcomeFromResolution(requestedResolution)
    const nextDescription = description?.trim() || null
    const nextAttachments = (attachmentUrls ?? []).slice(0, 5)
    const nextIntakeAnswers = (intakeAnswers ?? []).filter((answer) => answer.answer?.trim())
    const nextAction = getDefaultNextAction(issueType)
    const existing = await db.query.sessionIssues.findFirst({
      where: eq(schema.sessionIssues.bookingId, booking.id),
      orderBy: [desc(schema.sessionIssues.reportedAt), desc(schema.sessionIssues.createdAt)],
    })

    let issue: typeof schema.sessionIssues.$inferSelect

    if (existing && existing.status !== 'resolved') {
      const [updated] = await db.update(schema.sessionIssues)
        .set({
          issueType,
          description: nextDescription ?? existing.description,
          desiredOutcome: nextDesiredOutcome,
          resolution: requestedResolution ?? existing.resolution,
          nextAction,
          slaTargetAt: existing.slaTargetAt ?? nextSlaTarget,
          attachmentUrls: nextAttachments.length > 0 ? nextAttachments : existing.attachmentUrls,
          intakeAnswers: nextIntakeAnswers.length > 0 ? nextIntakeAnswers : existing.intakeAnswers,
          status: existing.status === 'reported' ? 'reported' : existing.status,
          updatedAt: now,
        })
        .where(eq(schema.sessionIssues.id, existing.id))
        .returning()
      issue = updated
    } else {
      const [created] = await db.insert(schema.sessionIssues).values({
        bookingId: booking.id,
        parentId,
        teacherId: booking.teacherId ?? null,
        caseReference: buildCaseReference(),
        issueType,
        description: nextDescription,
        status: 'reported',
        resolution: requestedResolution ?? 'none',
        desiredOutcome: nextDesiredOutcome,
        nextAction,
        slaTargetAt: nextSlaTarget,
        attachmentUrls: nextAttachments,
        intakeAnswers: nextIntakeAnswers,
        reportedAt: now,
        updatedAt: now,
      }).returning()
      issue = created
    }

    await createNotification({
      userId: parentId,
      type: 'booking.issue_reported',
      title: 'Issue reported',
      body: `We recorded your ${issueType.replaceAll('_', ' ')} case ${issue.caseReference}. Expected update by ${nextSlaTarget.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}.`,
      data: {
        bookingId: booking.id,
        issueId: issue.id,
        caseReference: issue.caseReference,
        issueType: issue.issueType,
        resolution: issue.resolution,
        desiredOutcome: issue.desiredOutcome,
        slaTargetAt: issue.slaTargetAt,
      },
    })

    return reply.status(201).send({ ok: true, issue })
  })

  fastify.post<{
    Params: { id: string }
    Body: { parentId: string; rating: number; comment?: string }
  }>('/bookings/:id/feedback', async (req, reply) => {
    const { id } = req.params
    const { parentId, rating, comment } = req.body
    if (!parentId || !rating) return reply.status(400).send({ error: 'parentId and rating are required' })
    if (rating < 1 || rating > 5) return reply.status(400).send({ error: 'rating must be 1–5' })

    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })
    if (booking.status !== 'completed') return reply.status(422).send({ error: 'Can only rate completed bookings' })
    if (!booking.teacherId || !booking.activityId) return reply.status(422).send({ error: 'Booking is missing teacher or activity' })

    const existing = await db.query.reviews.findFirst({ where: eq(schema.reviews.bookingId, id) })
    if (existing) return reply.status(422).send({ error: 'Feedback already submitted for this booking' })

    const [review] = await db.insert(schema.reviews).values({
      bookingId: id,
      parentId,
      teacherId: booking.teacherId,
      activityId: booking.activityId,
      rating,
      comment: comment ?? null,
    }).returning()

    return reply.status(201).send({ ok: true, review })
  })

  fastify.patch<{
    Params: { id: string }
    Body: { parentId: string; firstName?: string; lastName?: string; dateOfBirth?: string; gender?: string; interests?: string[]; notes?: string }
  }>('/children/:id', async (req, reply) => {
    const { id } = req.params
    const { parentId, firstName, lastName, dateOfBirth, gender, interests, notes } = req.body
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const child = await db.query.children.findFirst({ where: eq(schema.children.id, id) })
    if (!child) return reply.status(404).send({ error: 'Child not found' })
    if (child.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })

    const updates: Partial<typeof schema.children.$inferInsert> = { updatedAt: new Date() }
    if (firstName !== undefined) updates.firstName = firstName
    if (lastName !== undefined) updates.lastName = lastName
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth
    if (gender !== undefined) updates.gender = gender
    if (interests !== undefined) updates.interests = interests
    if (notes !== undefined) updates.notes = notes

    const [updated] = await db.update(schema.children)
      .set(updates)
      .where(eq(schema.children.id, id))
      .returning()

    return reply.send(updated)
  })

  fastify.get<{ Params: { id: string } }>('/teachers/:id', async (req, reply) => {
    const { id } = req.params
    if (!UUID_REGEX.test(id)) return reply.status(404).send({ error: 'Teacher not found' })

    const teacher = await db.query.teachers.findFirst({ where: eq(schema.teachers.userId, id) })
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' })

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, id) })
    if (!user) return reply.status(404).send({ error: 'Teacher not found' })

    const activities = await db
      .selectDistinctOn([schema.activities.id], {
        id: schema.activities.id,
        title: schema.activities.title,
        pricePerSession: schema.activities.pricePerSession,
        sessionDurationMins: schema.activities.sessionDurationMins,
        ageGroup: schema.activities.ageGroup,
        imageUrl: schema.activities.imageUrl,
      })
      .from(schema.activities)
      .innerJoin(schema.slots, and(
        eq(schema.slots.activityId, schema.activities.id),
        eq(schema.slots.teacherId, id),
      ))
      .where(eq(schema.activities.status, 'published'))

    const sessions = await db
      .select({ id: schema.bookings.id })
      .from(schema.bookings)
      .where(and(eq(schema.bookings.teacherId, id), eq(schema.bookings.status, 'completed')))

    return reply.send({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: teacher.bio,
      city: user.city,
      verificationStatus: teacher.verificationStatus,
      specializations: teacher.specializations,
      languages: teacher.languages,
      totalSessions: sessions.length,
      activities,
    })
  })
}
