import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { eq, and, or, desc, ne } from 'drizzle-orm'
import { syncConflictingTeacherSlots } from '../../lib/slot-availability.js'

const MAX_BOOKING_HOURS = 24 * 15
const RESCHEDULE_BUFFER_HOURS = 24
const OTP_VISIBLE_WINDOW_BEFORE_MINS = 15
const OTP_VISIBLE_WINDOW_AFTER_HOURS = 3
const DEVELOPMENT_OTP = '000000'
const APP_MODE = process.env.APP_MODE ?? process.env.NODE_ENV ?? 'development'
const MIN_BOOKING_HOURS = APP_MODE === 'development' ? 0 : 24

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

export async function bookingRoutes(fastify: FastifyInstance) {
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
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.users, eq(schema.bookings.teacherId, schema.users.id))
      .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
      .where(and(...conditions))
      .orderBy(desc(schema.bookings.scheduledAt))

    return reply.send({ items: rows })
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
      })
      .from(schema.children)
      .where(eq(schema.children.parentId, parentId))
      .orderBy(schema.children.createdAt)

    return reply.send({ items: rows })
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
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.users, eq(schema.bookings.teacherId, schema.users.id))
      .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
      .leftJoin(schema.payments, eq(schema.bookings.id, schema.payments.bookingId))
      .where(and(eq(schema.bookings.id, id), eq(schema.bookings.parentId, parentId)))
      .limit(1)

    if (!rows[0]) return reply.status(404).send({ error: 'Booking not found' })

    const booking = rows[0]
    return reply.send({
      ...booking,
      teacherOtp: !!booking.teacherOtpVerifiedAt ? booking.teacherOtp : null,
      canReschedule: canReschedule(booking.scheduledAt) && ['pending', 'confirmed'].includes(booking.status),
      canComplete: booking.status === 'in_progress' && !!booking.teacherOtpVerifiedAt,
      otpVisible: canRevealOtp(booking.scheduledAt),
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
    Body: { parentId: string; firstName?: string; lastName?: string; dateOfBirth?: string }
  }>('/children/:id', async (req, reply) => {
    const { id } = req.params
    const { parentId, firstName, lastName, dateOfBirth } = req.body
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const child = await db.query.children.findFirst({ where: eq(schema.children.id, id) })
    if (!child) return reply.status(404).send({ error: 'Child not found' })
    if (child.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })

    const updates: Partial<typeof schema.children.$inferInsert> = { updatedAt: new Date() }
    if (firstName !== undefined) updates.firstName = firstName
    if (lastName !== undefined) updates.lastName = lastName
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth

    const [updated] = await db.update(schema.children)
      .set(updates)
      .where(eq(schema.children.id, id))
      .returning()

    return reply.send(updated)
  })

  fastify.get<{ Params: { id: string } }>('/teachers/:id', async (req, reply) => {
    const { id } = req.params

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
      totalSessions: sessions.length,
      activities,
    })
  })
}
