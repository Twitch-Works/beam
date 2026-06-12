import { eq } from 'drizzle-orm'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'

export async function findPaymentByBookingId(bookingId: string) {
  return db.query.payments.findFirst({ where: eq(schema.payments.bookingId, bookingId) }) ?? null
}

export async function findPaymentByRazorpayOrderId(orderId: string) {
  return db.query.payments.findFirst({ where: eq(schema.payments.razorpayOrderId, orderId) }) ?? null
}

export async function updatePaymentWithOrder(id: string, razorpayOrderId: string) {
  await db.update(schema.payments)
    .set({ razorpayOrderId, updatedAt: new Date() })
    .where(eq(schema.payments.id, id))
}

export async function confirmPayment(id: string, gatewayPaymentId: string, status: 'success' | 'failed') {
  await db.update(schema.payments)
    .set({ gatewayPaymentId, status, updatedAt: new Date() })
    .where(eq(schema.payments.id, id))
}

export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled') {
  await db.update(schema.bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.bookings.id, bookingId))
}

export async function releaseSlot(bookingId: string) {
  await db.update(schema.slots)
    .set({ isAvailable: true, lockedByBookingId: null, updatedAt: new Date() })
    .where(eq(schema.slots.lockedByBookingId, bookingId))
}
