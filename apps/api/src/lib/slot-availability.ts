import { and, desc, eq, ne } from 'drizzle-orm'
import { db } from '../db/index.js'
import * as schema from '../db/schema.js'

export type SlotIdentity = {
  teacherId: string
  date: string
  startTime: string
  endTime: string
}

type SlotExecutor = Pick<typeof db, 'select' | 'update'>

export async function syncConflictingTeacherSlots(
  executor: SlotExecutor,
  slot: SlotIdentity,
) {
  const activeBookings = await executor
    .select({ bookingId: schema.bookings.id })
    .from(schema.slots)
    .innerJoin(schema.bookings, eq(schema.bookings.slotId, schema.slots.id))
    .where(and(
      eq(schema.slots.teacherId, slot.teacherId),
      eq(schema.slots.date, slot.date),
      eq(schema.slots.startTime, slot.startTime),
      eq(schema.slots.endTime, slot.endTime),
      ne(schema.bookings.status, 'cancelled'),
    ))
    .orderBy(desc(schema.bookings.updatedAt))
    .limit(1)

  const activeBookingId = activeBookings[0]?.bookingId ?? null

  await executor
    .update(schema.slots)
    .set({
      isAvailable: activeBookingId === null,
      lockedByBookingId: activeBookingId,
      updatedAt: new Date(),
    })
    .where(and(
      eq(schema.slots.teacherId, slot.teacherId),
      eq(schema.slots.date, slot.date),
      eq(schema.slots.startTime, slot.startTime),
      eq(schema.slots.endTime, slot.endTime),
    ))

  return activeBookingId
}
