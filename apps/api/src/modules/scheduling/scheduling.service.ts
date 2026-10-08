import type {
  BookingChangeRequestStatus,
  CreateBookingChangeRequestInput,
  ReviewBookingChangeRequestInput,
  TeacherSlotFilters,
  TeacherSlotInput,
} from '@beam/schemas'
import { err, ok, type Result } from '../../lib/result.js'
import { teacherMatchesActivitySpecialization } from '../../lib/teacher-skills.js'
import * as repo from './scheduling.repository.js'

export type SchedulingError = { status: 400 | 403 | 404 | 409 | 422; message: string }

const fail = (status: SchedulingError['status'], message: string) => err<SchedulingError>({ status, message })

const SLOT_DURATION_OPTIONS = [30, 45, 60, 90, 120, 180, 240]
const DEFAULT_SLOT_WINDOW_DAYS = 30
const CHANGEABLE_BOOKING_STATUSES = ['pending', 'confirmed']

// ── Time helpers (server-local, matching booking.routes parseSlotDateTime) ──

function hhmm(time: string) {
  return time.slice(0, 5)
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function slotStart(slot: { date: string; startTime: string }) {
  return new Date(`${slot.date}T${slot.startTime}`)
}

function overlaps(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }) {
  return toMinutes(a.startTime) < toMinutes(b.endTime) && toMinutes(b.startTime) < toMinutes(a.endTime)
}

function sameWindow(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }) {
  return hhmm(a.startTime) === hhmm(b.startTime) && hhmm(a.endTime) === hhmm(b.endTime)
}

function formatSlot(slot: { date: string; startTime: string }) {
  return slotStart(slot).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

// ── Activities & slots ───────────────────────────────────────────────────────

/** Published activities whose title/category/tags match the teacher's specializations. */
export async function listTeachableActivities(teacherId: string) {
  const teacher = await repo.findTeacherProfile(teacherId)
  if (!teacher) return fail(404, 'Teacher profile not found')

  const activities = await repo.listPublishedActivities()
  const items = activities
    .filter((a) => teacherMatchesActivitySpecialization(teacher.specializations ?? [], [a.title, a.categoryName ?? '', ...(a.tags ?? [])]))
    .map(({ tags: _tags, ...a }) => a)

  return ok({ items })
}

export async function listSlots(teacherId: string, filters: TeacherSlotFilters) {
  const today = new Date()
  const from = filters.from ?? toDateString(today)
  const defaultTo = new Date(today)
  defaultTo.setDate(defaultTo.getDate() + DEFAULT_SLOT_WINDOW_DAYS)
  const to = filters.to ?? toDateString(defaultTo)

  const rows = await repo.listTeacherSlots({ teacherId, from, to, activityId: filters.activityId })
  return ok({ from, to, items: rows })
}

export async function createSlot(teacherId: string, input: TeacherSlotInput) {
  const teacher = await repo.findTeacherProfile(teacherId)
  if (!teacher) return fail(404, 'Teacher profile not found')
  if (teacher.verificationStatus !== 'verified') {
    return fail(403, 'Your profile must be verified by Beam before you can publish class times')
  }

  const activity = await repo.findActivity(input.activityId)
  if (!activity) return fail(404, 'Activity not found')
  if (activity.status !== 'published') return fail(422, 'You can only add class times for published activities')
  if (!teacherMatchesActivitySpecialization(teacher.specializations ?? [], [activity.title, activity.categoryName ?? '', ...(activity.tags ?? [])])) {
    return fail(422, 'This activity does not match your specializations')
  }

  if (slotStart(input).getTime() <= Date.now()) return fail(422, 'Class time must be in the future')

  const duration = toMinutes(input.endTime) - toMinutes(input.startTime)
  const min = activity.sessionDurationMins
  const allowed = SLOT_DURATION_OPTIONS.filter((d) => d >= min && d <= min * 2)
  if (!allowed.includes(duration)) {
    return fail(422, `Class length must be one of: ${allowed.join(', ')} minutes`)
  }

  // Identical windows across different activities are allowed (booking one locks
  // the others); partial overlaps would let two classes be booked at once.
  const sameDay = await repo.listTeacherSlotsOnDate(teacherId, input.date)
  for (const existing of sameDay) {
    if (sameWindow(existing, input)) {
      if (existing.activityId === input.activityId) return fail(409, 'You already have this class time')
      continue
    }
    if (overlaps(existing, input)) {
      return fail(409, `Overlaps your ${hhmm(existing.startTime)}–${hhmm(existing.endTime)} class on this day`)
    }
  }

  const slot = await repo.insertSlot({ teacherId, ...input })
  return ok(slot)
}

export async function removeSlot(teacherId: string, slotId: string) {
  const slot = await repo.findSlot(slotId)
  if (!slot || slot.teacherId !== teacherId) return fail(404, 'Class time not found')
  if (slot.lockedByBookingId) return fail(409, 'This class time is booked — request a reschedule or cancellation instead')
  if ((await repo.countBookingsForSlot(slotId)) > 0) {
    return fail(409, 'This class time has booking history and cannot be removed')
  }

  await repo.deleteSlot(slotId)
  return ok({ ok: true })
}

// ── Change requests (teacher) ────────────────────────────────────────────────

export async function listChangeRequests(params: { teacherId?: string; status?: BookingChangeRequestStatus }) {
  const items = await repo.listChangeRequests(params)
  return ok({ items })
}

async function validateProposedSlot(
  booking: NonNullable<Awaited<ReturnType<typeof repo.findBooking>>>,
  teacherId: string,
  proposedSlotId: string,
): Promise<Result<NonNullable<Awaited<ReturnType<typeof repo.findSlot>>>, SchedulingError>> {
  const slot = await repo.findSlot(proposedSlotId)
  if (!slot || slot.teacherId !== teacherId) return fail(404, 'Proposed class time not found')
  if (slot.id === booking.slotId) return fail(422, 'Pick a different class time from the current one')
  if (slot.activityId !== booking.activityId) return fail(422, 'Proposed class time must be for the same activity')
  if (!slot.isAvailable || slot.lockedByBookingId) return fail(409, 'Proposed class time is no longer available')
  if (slotStart(slot).getTime() <= Date.now()) return fail(422, 'Proposed class time must be in the future')

  const busy = await repo.listTeacherActiveBookingsOnDate(teacherId, slot.date)
  if (busy.some((b) => b.bookingId !== booking.id && overlaps(b, slot))) {
    return fail(409, 'You already have another booking at the proposed time')
  }
  return ok(slot)
}

export async function createChangeRequest(teacherId: string, bookingId: string, input: CreateBookingChangeRequestInput) {
  const booking = await repo.findBooking(bookingId)
  if (!booking || booking.teacherId !== teacherId) return fail(404, 'Booking not found')
  if (!CHANGEABLE_BOOKING_STATUSES.includes(booking.status)) {
    return fail(422, 'Only pending or confirmed bookings can be changed')
  }
  if (booking.scheduledAt && booking.scheduledAt.getTime() <= Date.now()) {
    return fail(422, 'This session has already started')
  }
  if (await repo.findPendingChangeRequest(bookingId)) {
    return fail(409, 'There is already a pending request for this booking')
  }

  let proposedSlotId: string | null = null
  if (input.type === 'reschedule') {
    const slot = await validateProposedSlot(booking, teacherId, input.proposedSlotId)
    if (!slot.ok) return slot
    proposedSlotId = slot.value.id
  }

  const request = await repo.insertChangeRequest({ bookingId, teacherId, type: input.type, reason: input.reason, proposedSlotId })
  return ok(request)
}

export async function withdrawChangeRequest(teacherId: string, requestId: string) {
  const request = await repo.findChangeRequest(requestId)
  if (!request || request.teacherId !== teacherId) return fail(404, 'Request not found')
  if (request.status !== 'pending') return fail(422, `Request is already ${request.status}`)

  const updated = await repo.closePendingChangeRequest(requestId, { status: 'withdrawn' })
  if (!updated) return fail(409, 'Request was already reviewed')
  return ok(updated)
}

// ── Change requests (admin review) ───────────────────────────────────────────

const ALREADY_DECIDED = 'Another admin already reviewed this request — refresh the list'

async function guardDecided<T>(apply: () => Promise<T>): Promise<Result<T, SchedulingError>> {
  try {
    return ok(await apply())
  } catch (e) {
    if (e instanceof repo.RequestAlreadyDecidedError) return fail(409, ALREADY_DECIDED)
    throw e
  }
}

export async function reviewChangeRequest(
  admin: { id: string; role: 'admin' | 'super_admin' },
  requestId: string,
  input: ReviewBookingChangeRequestInput,
) {
  const request = await repo.findChangeRequest(requestId)
  if (!request) return fail(404, 'Request not found')
  if (request.status !== 'pending') return fail(422, `Request is already ${request.status}`)

  const booking = await repo.findBooking(request.bookingId)
  if (!booking) return fail(404, 'Booking not found')

  const adminNote = input.adminNote?.trim() || null
  const stamp = { requestId, reviewedBy: admin.id, adminNote }
  const label = request.type === 'cancel' ? 'cancellation' : 'reschedule'

  if (input.action === 'reject') {
    const updated = await repo.closePendingChangeRequest(requestId, { status: 'rejected', adminNote, reviewedBy: admin.id, reviewedAt: new Date() })
    if (!updated) return fail(409, ALREADY_DECIDED)
    await repo.insertNotification({
      userId: request.teacherId,
      type: 'booking.change_request.rejected',
      title: `Your ${label} request was declined`,
      body: adminNote ?? 'Beam ops declined your request. The booking stays as scheduled.',
      data: { bookingId: booking.id, requestId },
    })
    await repo.insertAuditLog({ actorId: admin.id, actorRole: admin.role, action: `booking_change_request.rejected`, entityId: requestId, before: request, after: updated })
    return ok({ request: updated })
  }

  // Approve — re-check everything, the booking may have moved on since the request
  if (!CHANGEABLE_BOOKING_STATUSES.includes(booking.status)) {
    return fail(422, `Booking is now ${booking.status} — reject this request instead`)
  }

  const currentSlot = booking.slotId ? await repo.findSlot(booking.slotId) : null

  if (request.type === 'cancel') {
    const applied = await guardDecided(() => repo.applyApprovedCancellation({ bookingId: booking.id, slot: currentSlot, ...stamp }))
    if (!applied.ok) return applied
    const { refunded } = applied.value
    await repo.insertNotification({
      userId: booking.parentId,
      type: 'booking.cancelled',
      title: 'Your class has been cancelled',
      body: refunded
        ? 'Your teacher is unable to take this class. A full refund has been initiated.'
        : 'Your teacher is unable to take this class. Our team will help you rebook.',
      data: { bookingId: booking.id },
    })
    await repo.insertNotification({
      userId: request.teacherId,
      type: 'booking.change_request.approved',
      title: 'Cancellation approved',
      body: adminNote ?? 'The booking has been cancelled and the parent informed.',
      data: { bookingId: booking.id, requestId },
    })
    await repo.insertAuditLog({ actorId: admin.id, actorRole: admin.role, action: 'booking_change_request.approved', entityId: requestId, before: { request, booking }, after: { bookingStatus: 'cancelled', refunded } })
    return ok({ request: { ...request, status: 'approved' as const, adminNote }, refunded })
  }

  if (!request.proposedSlotId) return fail(422, 'Proposed class time no longer exists — reject this request')
  const toSlot = await validateProposedSlot(booking, request.teacherId, request.proposedSlotId)
  if (!toSlot.ok) return fail(toSlot.error.status, `${toSlot.error.message} — reject this request instead`)

  const scheduledAt = slotStart(toSlot.value)
  const applied = await guardDecided(() => repo.applyApprovedReschedule({ bookingId: booking.id, fromSlot: currentSlot, toSlot: toSlot.value, scheduledAt, ...stamp }))
  if (!applied.ok) return applied
  await repo.insertNotification({
    userId: booking.parentId,
    type: 'booking.rescheduled',
    title: 'Your class has been rescheduled',
    body: `New time: ${formatSlot(toSlot.value)}.`,
    data: { bookingId: booking.id },
  })
  await repo.insertNotification({
    userId: request.teacherId,
    type: 'booking.change_request.approved',
    title: 'Reschedule approved',
    body: `Booking moved to ${formatSlot(toSlot.value)}.`,
    data: { bookingId: booking.id, requestId },
  })
  await repo.insertAuditLog({
    actorId: admin.id,
    actorRole: admin.role,
    action: 'booking_change_request.approved',
    entityId: requestId,
    before: { request, scheduledAt: booking.scheduledAt, slotId: booking.slotId },
    after: { scheduledAt, slotId: toSlot.value.id },
  })
  return ok({ request: { ...request, status: 'approved' as const, adminNote } })
}
