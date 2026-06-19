import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { ok, err } from '../../lib/result.js'
import * as repo from './payments.repository.js'

const KEY_ID         = process.env.RAZORPAY_KEY_ID         ?? ''
const KEY_SECRET     = process.env.RAZORPAY_KEY_SECRET     ?? ''
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''

// Lazy so the server starts without Razorpay keys (fails at call time, not boot time)
let _razorpay: Razorpay | null = null
function getRazorpay() {
  if (!_razorpay) _razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })
  return _razorpay
}

export async function createOrder(bookingId: string) {
  const payment = await repo.findPaymentByBookingId(bookingId)
  if (!payment) return err('PAYMENT_NOT_FOUND' as const)

  const amountPaise = Math.round(parseFloat(payment.amount) * 100)
  const order = await getRazorpay().orders.create({
    amount:   amountPaise,
    currency: 'INR',
    receipt:  bookingId,
  })

  await repo.updatePaymentWithOrder(payment.id, order.id)

  return ok({
    orderId:  order.id,
    amount:   amountPaise,
    currency: 'INR',
    keyId:    KEY_ID,
  })
}

export async function verifyPayment(
  bookingId: string,
  razorpayPaymentId: string,
  razorpayOrderId: string,
  razorpaySignature: string,
) {
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expected !== razorpaySignature) return err('INVALID_SIGNATURE' as const)

  const payment = await repo.findPaymentByBookingId(bookingId)
  if (!payment) return err('PAYMENT_NOT_FOUND' as const)

  await repo.confirmPayment(payment.id, razorpayPaymentId, 'success')
  await repo.updateBookingStatus(bookingId, 'confirmed')

  return ok({ bookingId })
}

export async function processWebhook(rawBody: Buffer, signature: string) {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  if (expected !== signature) return err('INVALID_SIGNATURE' as const)

  const payload = JSON.parse(rawBody.toString()) as {
    event: string
    payload: { payment?: { entity?: { id?: string; order_id?: string } } }
  }

  const entity = payload.payload?.payment?.entity
  const orderId     = entity?.order_id
  const paymentId   = entity?.id

  if (!orderId) return ok(true)

  if (payload.event === 'payment.captured' && paymentId) {
    const existing = await repo.findPaymentByRazorpayOrderId(orderId)
    if (!existing || existing.status === 'success') return ok(true) // idempotent

    await repo.confirmPayment(existing.id, paymentId, 'success')
    await repo.updateBookingStatus(existing.bookingId, 'confirmed')
  }

  if (payload.event === 'payment.failed') {
    const existing = await repo.findPaymentByRazorpayOrderId(orderId)
    if (!existing || existing.status !== 'pending') return ok(true)

    await repo.confirmPayment(existing.id, paymentId ?? '', 'failed')
    await repo.updateBookingStatus(existing.bookingId, 'cancelled')
    await repo.releaseSlot(existing.bookingId)
    await repo.syncSlotsForBooking(existing.bookingId)
  }

  return ok(true)
}
