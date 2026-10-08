import type { ClaimParentAccountResult, CreateGuestBookingInput, GuestBookingSummary, VerifyGuestPaymentInput } from '@beam/schemas'
import { indianPhoneVariants } from '../../lib/phone.js'
import { getVerifiedAuthPhone } from '../../lib/supabase-admin.js'
import { err, ok, type Result } from '../../lib/result.js'
import { createBooking } from '../booking/index.js'
import { createOrder, verifyPayment } from '../payments/index.js'
import * as repo from './guest-booking.repository.js'

export type GuestBookingError = { status: 403 | 404 | 409 | 422 | 502 | 503; message: string }

const fail = (status: GuestBookingError['status'], message: string) => err<GuestBookingError>({ status, message })

function splitName(fullName: string) {
  const [firstName, ...rest] = fullName.trim().split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

// Only the age is collected — approximate date of birth as "age years ago today"
function dateOfBirthFromAge(age: number) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - age)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function findOrCreateParent(input: CreateGuestBookingInput): Promise<Result<string, GuestBookingError>> {
  const existing = await repo.findUserByPhones(indianPhoneVariants(input.phone))
  if (existing) {
    if (existing.role !== 'parent') return fail(409, 'This mobile number belongs to a Beam team account. Please use a different number.')
    return ok(existing.id)
  }

  // users.email is required + unique; guests have none, so derive a stable placeholder
  const email = `guest.${input.phone}@guest.beamkids.in`
  const byEmail = await repo.findUserByEmail(email)
  if (byEmail) return ok(byEmail.id)

  const { firstName, lastName } = splitName(input.parentName)
  const created = await repo.insertProvisionalParent({ email, firstName, lastName, phone: `+91${input.phone}` })
  return ok(created.id)
}

async function findOrCreateChild(parentId: string, input: CreateGuestBookingInput) {
  const { firstName } = splitName(input.childName)
  const existing = await repo.findChildByName(parentId, firstName)
  if (existing) return existing.id
  const created = await repo.insertChild({ parentId, firstName, dateOfBirth: dateOfBirthFromAge(input.childAge) })
  return created.id
}

export async function createGuestBooking(input: CreateGuestBookingInput): Promise<Result<GuestBookingSummary, GuestBookingError>> {
  const activity = await repo.findActivity(input.activityId)
  if (!activity || activity.status !== 'published') return fail(404, 'This class is no longer available')

  const parent = await findOrCreateParent(input)
  if (!parent.ok) return parent
  const childId = await findOrCreateChild(parent.value, input)

  // Price always comes from the server, never from the browser
  const amount = Number(activity.pricePerSession)
  const created = await createBooking({
    parentId: parent.value,
    childId,
    activityId: activity.id,
    slotId: input.slotId,
    totalAmount: amount,
  })
  if (!created.ok) return fail(created.error.status, created.error.message)

  const { booking, payment } = created.value
  return ok({
    bookingId: booking.id,
    activityTitle: activity.title,
    scheduledAt: (booking.scheduledAt ?? new Date()).toISOString(),
    amount,
    paymentStatus: payment.status,
  })
}

const ORDER_ERRORS: Record<string, [GuestBookingError['status'], string]> = {
  RAZORPAY_NOT_CONFIGURED: [503, 'Online payment is not available right now. Please try again later.'],
  PAYMENT_NOT_FOUND: [404, 'Payment not found for this booking'],
  FORBIDDEN: [403, 'Not allowed'],
  ALREADY_PAID: [409, 'This booking is already paid'],
  AMOUNT_TOO_LOW: [422, 'Amount too low for online payment'],
  RAZORPAY_ERROR: [502, 'Payment gateway error. Please try again.'],
  INVALID_SIGNATURE: [422, 'Payment could not be verified. If money was deducted it will be refunded automatically.'],
}

function mapPaymentError(code: string) {
  const [status, message] = ORDER_ERRORS[code] ?? [502, 'Payment failed. Please try again.']
  return fail(status, message)
}

export async function createGuestPaymentOrder(bookingId: string) {
  const booking = await repo.findBookingWithPayment(bookingId)
  if (!booking) return fail(404, 'Booking not found')
  if (booking.status === 'cancelled') return fail(422, 'This booking was cancelled')

  const order = await createOrder(bookingId, booking.parentId)
  if (!order.ok) return mapPaymentError(order.error)
  return ok(order.value)
}

export async function verifyGuestPayment(bookingId: string, input: VerifyGuestPaymentInput) {
  const booking = await repo.findBookingWithPayment(bookingId)
  if (!booking) return fail(404, 'Booking not found')

  const result = await verifyPayment(bookingId, booking.parentId, input.razorpayPaymentId, input.razorpayOrderId, input.razorpaySignature)
  if (!result.ok) return mapPaymentError(result.error)
  return ok({ bookingId, paymentStatus: 'success' as const })
}

// ── Claiming the provisional account from the app ────────────────────────────

/**
 * Called by the parent app after login. Links (or merges) a provisional
 * landing-page account into this Supabase login — but only when Supabase has
 * *verified* that the login owns the same mobile number, so nobody can claim
 * another family's kids and bookings by typing their number.
 */
export async function claimParentAccount(authUserId: string): Promise<Result<ClaimParentAccountResult, GuestBookingError>> {
  const verified = await getVerifiedAuthPhone(authUserId)
  if (!verified) return ok({ status: 'none', parentId: null })

  const provisional = await repo.findProvisionalParentByPhones(indianPhoneVariants(verified.phone))
  const existing = await repo.findUserForAuthId(authUserId)

  if (!provisional) return ok({ status: existing ? 'already_linked' : 'none', parentId: existing?.id ?? null })
  if (existing?.id === provisional.id) return ok({ status: 'already_linked', parentId: existing.id })

  if (!existing) {
    // Keep the placeholder email if the real one already belongs to another row
    const emailTaken = verified.email ? await repo.findUserByEmail(verified.email.toLowerCase()) : null
    await repo.linkProvisionalParent(provisional.id, {
      authUserId,
      email: verified.email && !emailTaken ? verified.email.toLowerCase() : null,
    })
    return ok({ status: 'claimed', parentId: provisional.id })
  }

  if (existing.role !== 'parent') return fail(409, 'This login belongs to a Beam team account')
  await repo.mergeProvisionalParent({
    fromId: provisional.id,
    intoId: existing.id,
    phoneForTarget: existing.phone ? null : provisional.phone,
  })
  return ok({ status: 'merged', parentId: existing.id })
}
