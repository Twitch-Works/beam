import { aliasedTable, and, asc, count, desc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { syncConflictingTeacherSlots, type SlotIdentity } from '../../lib/slot-availability.js'
import type { BookingChangeRequestStatus } from '@beam/schemas'

// Drizzle queries only — never imported from outside this module.

type SlotRow = typeof schema.slots.$inferSelect
type ChangeRequestRow = typeof schema.bookingChangeRequests.$inferSelect

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed', 'in_progress'] as const

function slotIdentity(slot: Pick<SlotRow, 'teacherId' | 'date' | 'startTime' | 'endTime'>): SlotIdentity {
  return { teacherId: slot.teacherId, date: slot.date, startTime: slot.startTime, endTime: slot.endTime }
}

// ── Teachers / activities ────────────────────────────────────────────────────

export async function findTeacherProfile(userId: string) {
  return db.query.teachers.findFirst({
    where: eq(schema.teachers.userId, userId),
    columns: { verificationStatus: true, specializations: true },
  })
}

export async function listPublishedActivities() {
  return db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      sessionDurationMins: schema.activities.sessionDurationMins,
      pricePerSession: schema.activities.pricePerSession,
      tags: schema.activities.tags,
      categoryName: schema.categories.name,
    })
    .from(schema.activities)
    .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
    .where(eq(schema.activities.status, 'published'))
    .orderBy(asc(schema.activities.title))
}

export async function findActivity(id: string) {
  const [row] = await db
    .select({
      id: schema.activities.id,
      title: schema.activities.title,
      status: schema.activities.status,
      sessionDurationMins: schema.activities.sessionDurationMins,
      tags: schema.activities.tags,
      categoryName: schema.categories.name,
    })
    .from(schema.activities)
    .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
    .where(eq(schema.activities.id, id))
    .limit(1)
  return row ?? null
}

// ── Slots ────────────────────────────────────────────────────────────────────

export async function listTeacherSlots(params: { teacherId: string; from: string; to: string; activityId?: string }) {
  const conditions: SQL[] = [
    eq(schema.slots.teacherId, params.teacherId),
    gte(schema.slots.date, params.from),
    lte(schema.slots.date, params.to),
  ]
  if (params.activityId) conditions.push(eq(schema.slots.activityId, params.activityId))

  return db
    .select({
      id: schema.slots.id,
      activityId: schema.slots.activityId,
      activityTitle: schema.activities.title,
      date: schema.slots.date,
      startTime: schema.slots.startTime,
      endTime: schema.slots.endTime,
      isAvailable: schema.slots.isAvailable,
      bookingId: schema.slots.lockedByBookingId,
      bookingStatus: schema.bookings.status,
      childFirstName: schema.children.firstName,
      childLastName: schema.children.lastName,
    })
    .from(schema.slots)
    .leftJoin(schema.activities, eq(schema.slots.activityId, schema.activities.id))
    .leftJoin(schema.bookings, eq(schema.slots.lockedByBookingId, schema.bookings.id))
    .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
    .where(and(...conditions))
    .orderBy(asc(schema.slots.date), asc(schema.slots.startTime))
}

export async function listTeacherSlotsOnDate(teacherId: string, date: string) {
  return db
    .select()
    .from(schema.slots)
    .where(and(eq(schema.slots.teacherId, teacherId), eq(schema.slots.date, date)))
}

export async function findSlot(id: string) {
  return (await db.query.slots.findFirst({ where: eq(schema.slots.id, id) })) ?? null
}

export async function insertSlot(values: { teacherId: string; activityId: string; date: string; startTime: string; endTime: string }) {
  const [slot] = await db.insert(schema.slots).values({ ...values, isAvailable: true }).returning()
  // Another activity at the identical window may already be booked → lock this one too
  await syncConflictingTeacherSlots(db, slotIdentity(slot))
  return (await findSlot(slot.id)) ?? slot
}

export async function countBookingsForSlot(slotId: string) {
  const [row] = await db.select({ total: count() }).from(schema.bookings).where(eq(schema.bookings.slotId, slotId))
  return row?.total ?? 0
}

export async function deleteSlot(id: string) {
  await db.delete(schema.slots).where(eq(schema.slots.id, id))
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export async function findBooking(id: string) {
  return (await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })) ?? null
}

/** The teacher's active bookings on a date, with the slot window each occupies. */
export async function listTeacherActiveBookingsOnDate(teacherId: string, date: string) {
  return db
    .select({
      bookingId: schema.bookings.id,
      startTime: schema.slots.startTime,
      endTime: schema.slots.endTime,
    })
    .from(schema.bookings)
    .innerJoin(schema.slots, eq(schema.bookings.slotId, schema.slots.id))
    .where(and(
      eq(schema.bookings.teacherId, teacherId),
      eq(schema.slots.date, date),
      inArray(schema.bookings.status, [...ACTIVE_BOOKING_STATUSES]),
    ))
}

// ── Change requests ──────────────────────────────────────────────────────────

export async function findPendingChangeRequest(bookingId: string) {
  return (await db.query.bookingChangeRequests.findFirst({
    where: and(eq(schema.bookingChangeRequests.bookingId, bookingId), eq(schema.bookingChangeRequests.status, 'pending')),
  })) ?? null
}

export async function findChangeRequest(id: string) {
  return (await db.query.bookingChangeRequests.findFirst({ where: eq(schema.bookingChangeRequests.id, id) })) ?? null
}

export async function insertChangeRequest(values: {
  bookingId: string
  teacherId: string
  type: ChangeRequestRow['type']
  reason: string
  proposedSlotId: string | null
}) {
  const [row] = await db.insert(schema.bookingChangeRequests).values(values).returning()
  return row
}

/** Moves a still-pending request to a final state; returns null if it was already decided. */
export async function closePendingChangeRequest(
  id: string,
  values: Partial<Pick<ChangeRequestRow, 'status' | 'adminNote' | 'reviewedBy' | 'reviewedAt'>>,
) {
  const [row] = await db
    .update(schema.bookingChangeRequests)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(schema.bookingChangeRequests.id, id), eq(schema.bookingChangeRequests.status, 'pending')))
    .returning()
  return row ?? null
}

const parentUsers = aliasedTable(schema.users, 'cr_parent_users')
const teacherUsers = aliasedTable(schema.users, 'cr_teacher_users')
const currentSlots = aliasedTable(schema.slots, 'cr_current_slots')
const proposedSlots = aliasedTable(schema.slots, 'cr_proposed_slots')

export async function listChangeRequests(params: { teacherId?: string; status?: BookingChangeRequestStatus }) {
  const conditions: SQL[] = []
  if (params.teacherId) conditions.push(eq(schema.bookingChangeRequests.teacherId, params.teacherId))
  if (params.status) conditions.push(eq(schema.bookingChangeRequests.status, params.status))

  return db
    .select({
      id: schema.bookingChangeRequests.id,
      type: schema.bookingChangeRequests.type,
      status: schema.bookingChangeRequests.status,
      reason: schema.bookingChangeRequests.reason,
      adminNote: schema.bookingChangeRequests.adminNote,
      createdAt: schema.bookingChangeRequests.createdAt,
      reviewedAt: schema.bookingChangeRequests.reviewedAt,
      bookingId: schema.bookings.id,
      bookingStatus: schema.bookings.status,
      scheduledAt: schema.bookings.scheduledAt,
      totalAmount: schema.bookings.totalAmount,
      activityTitle: schema.activities.title,
      childFirstName: schema.children.firstName,
      childLastName: schema.children.lastName,
      parentFirstName: parentUsers.firstName,
      parentLastName: parentUsers.lastName,
      parentPhone: parentUsers.phone,
      teacherId: schema.bookingChangeRequests.teacherId,
      teacherFirstName: teacherUsers.firstName,
      teacherLastName: teacherUsers.lastName,
      currentSlotDate: currentSlots.date,
      currentSlotStart: currentSlots.startTime,
      currentSlotEnd: currentSlots.endTime,
      proposedSlotId: schema.bookingChangeRequests.proposedSlotId,
      proposedSlotDate: proposedSlots.date,
      proposedSlotStart: proposedSlots.startTime,
      proposedSlotEnd: proposedSlots.endTime,
      proposedSlotAvailable: proposedSlots.isAvailable,
    })
    .from(schema.bookingChangeRequests)
    .innerJoin(schema.bookings, eq(schema.bookingChangeRequests.bookingId, schema.bookings.id))
    .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
    .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
    .leftJoin(parentUsers, eq(schema.bookings.parentId, parentUsers.id))
    .leftJoin(teacherUsers, eq(schema.bookingChangeRequests.teacherId, teacherUsers.id))
    .leftJoin(currentSlots, eq(schema.bookings.slotId, currentSlots.id))
    .leftJoin(proposedSlots, eq(schema.bookingChangeRequests.proposedSlotId, proposedSlots.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(schema.bookingChangeRequests.createdAt))
    .limit(200)
}

// ── Applying an approved request (atomic) ────────────────────────────────────

type ReviewStamp = { requestId: string; reviewedBy: string; adminNote: string | null }

export class RequestAlreadyDecidedError extends Error {}

// Runs first inside each transaction: guards against two admins approving the same request
async function approveRequest(tx: Pick<typeof db, 'update'>, stamp: ReviewStamp, now: Date) {
  const rows = await tx
    .update(schema.bookingChangeRequests)
    .set({ status: 'approved', reviewedBy: stamp.reviewedBy, reviewedAt: now, adminNote: stamp.adminNote, updatedAt: now })
    .where(and(eq(schema.bookingChangeRequests.id, stamp.requestId), eq(schema.bookingChangeRequests.status, 'pending')))
    .returning({ id: schema.bookingChangeRequests.id })
  if (rows.length === 0) throw new RequestAlreadyDecidedError()
}

/** Cancel the booking, refund a captured payment, free its slot, mark the request approved. */
export async function applyApprovedCancellation(params: { bookingId: string; slot: SlotRow | null } & ReviewStamp) {
  const now = new Date()
  return db.transaction(async (tx) => {
    await approveRequest(tx, params, now)
    await tx
      .update(schema.bookings)
      .set({
        status: 'cancelled',
        teacherOtp: null,
        teacherOtpGeneratedAt: null,
        teacherOtpVerifiedAt: null,
        updatedAt: now,
      })
      .where(eq(schema.bookings.id, params.bookingId))

    const refunded = await tx
      .update(schema.payments)
      .set({ status: 'refunded', refundedAt: now, updatedAt: now })
      .where(and(eq(schema.payments.bookingId, params.bookingId), eq(schema.payments.status, 'success')))
      .returning({ id: schema.payments.id })

    if (params.slot) await syncConflictingTeacherSlots(tx, slotIdentity(params.slot))

    return { refunded: refunded.length > 0 }
  })
}

/** Move the booking onto the proposed slot, re-sync both slot locks, mark the request approved. */
export async function applyApprovedReschedule(params: {
  bookingId: string
  fromSlot: SlotRow | null
  toSlot: SlotRow
  scheduledAt: Date
} & ReviewStamp) {
  const now = new Date()
  await db.transaction(async (tx) => {
    await approveRequest(tx, params, now)
    await tx
      .update(schema.bookings)
      .set({ slotId: params.toSlot.id, scheduledAt: params.scheduledAt, updatedAt: now })
      .where(eq(schema.bookings.id, params.bookingId))

    if (params.fromSlot) await syncConflictingTeacherSlots(tx, slotIdentity(params.fromSlot))
    await syncConflictingTeacherSlots(tx, slotIdentity(params.toSlot))
  })
}

// ── Side records ─────────────────────────────────────────────────────────────

export async function insertNotification(values: { userId: string; type: string; title: string; body: string; data?: Record<string, unknown> }) {
  await db.insert(schema.notifications).values({ ...values, data: values.data ?? null })
}

export async function insertAuditLog(values: {
  actorId: string
  actorRole: 'admin' | 'super_admin'
  action: string
  entityId: string
  before: unknown
  after: unknown
}) {
  await db.insert(schema.auditLogs).values({ ...values, entityType: 'booking_change_request' })
}
