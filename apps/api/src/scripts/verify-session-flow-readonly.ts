import 'dotenv/config'
import { buildApp } from '../app.js'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'
import { asc, eq } from 'drizzle-orm'

async function main() {
  const app = buildApp()
  await app.ready()

  const sampleBookings = await db
    .select({
      id: schema.bookings.id,
      parentId: schema.bookings.parentId,
      status: schema.bookings.status,
    })
    .from(schema.bookings)
    .orderBy(asc(schema.bookings.createdAt))
    .limit(20)

  const byStatus = new Map<string, { id: string; parentId: string }>()
  for (const booking of sampleBookings) {
    if (!byStatus.has(booking.status)) {
      byStatus.set(booking.status, { id: booking.id, parentId: booking.parentId })
    }
  }

  const statusesToVerify = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'] as const
  const detailChecks: Array<Record<string, unknown>> = []

  for (const status of statusesToVerify) {
    const sample = byStatus.get(status)
    if (!sample) continue

    const detailRes = await app.inject({
      method: 'GET',
      url: `/bookings/${sample.id}?parentId=${sample.parentId}`,
    })

    if (detailRes.statusCode !== 200) {
      throw new Error(`Detail route failed for ${status}: ${detailRes.statusCode} ${detailRes.body}`)
    }

    const detail = detailRes.json() as Record<string, unknown>
    detailChecks.push({
      status,
      bookingId: sample.id,
      hasIssueProjection: Object.prototype.hasOwnProperty.call(detail, 'issueReported'),
      hasRefundProjection: Object.prototype.hasOwnProperty.call(detail, 'paymentStatus'),
      hasOtpProjection: Object.prototype.hasOwnProperty.call(detail, 'otpVisible'),
    })
  }

  const firstParent = sampleBookings[0]?.parentId
  if (!firstParent) {
    throw new Error('No bookings found for readonly verification')
  }

  const listRes = await app.inject({
    method: 'GET',
    url: `/bookings?parentId=${firstParent}&status=pending,confirmed,in_progress,completed,cancelled,rescheduled`,
  })

  if (listRes.statusCode !== 200) {
    throw new Error(`List route failed: ${listRes.statusCode} ${listRes.body}`)
  }

  const listPayload = listRes.json() as { items: Array<Record<string, unknown>> }
  const firstListItem = listPayload.items[0] ?? null

  console.log(JSON.stringify({
    verification: 'readonly-ok',
    checkedStatuses: detailChecks,
    listProjection: firstListItem
      ? {
          id: firstListItem.id,
          status: firstListItem.status,
          hasIssueProjection: Object.prototype.hasOwnProperty.call(firstListItem, 'issueReported'),
          hasIssueStatus: Object.prototype.hasOwnProperty.call(firstListItem, 'issueStatus'),
          hasIssueResolution: Object.prototype.hasOwnProperty.call(firstListItem, 'issueResolution'),
        }
      : null,
  }, null, 2))

  await app.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
