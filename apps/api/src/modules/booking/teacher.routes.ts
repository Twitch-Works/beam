import type { FastifyInstance } from 'fastify'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { eq, and, or, desc, sum, count } from 'drizzle-orm'
import { syncConflictingTeacherSlots } from '../../lib/slot-availability.js'

const DEVELOPMENT_OTP = '000000'
const APP_MODE = process.env.APP_MODE ?? process.env.NODE_ENV ?? 'development'

export async function teacherRoutes(fastify: FastifyInstance) {

  // ── GET /teacher/sessions?teacherId= ──────────────────────────────────────
  // Teacher's own bookings list with optional status filter
  fastify.get<{
    Querystring: { teacherId: string; status?: string }
  }>('/teacher/sessions', async (req, reply) => {
    const { teacherId, status } = req.query
    if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })

    const conditions = [eq(schema.bookings.teacherId, teacherId)]
    if (status) {
      const statuses = status.split(',')
      conditions.push(or(...statuses.map(s => eq(schema.bookings.status, s as any)))!)
    }

    const rows = await db
      .select({
        id:               schema.bookings.id,
        status:           schema.bookings.status,
        sessionType:      schema.bookings.sessionType,
        totalAmount:      schema.bookings.totalAmount,
        scheduledAt:      schema.bookings.scheduledAt,
        confirmedAt:      schema.bookings.confirmedAt,
        teacherOtp:       schema.bookings.teacherOtp,
        teacherOtpVerifiedAt: schema.bookings.teacherOtpVerifiedAt,
        completedAt:      schema.bookings.completedAt,
        notes:            schema.bookings.notes,
        activityId:       schema.bookings.activityId,
        activityTitle:    schema.activities.title,
        activityImage:    schema.activities.imageUrl,
        activityDuration: schema.activities.sessionDurationMins,
        childFirstName:   schema.children.firstName,
        childLastName:    schema.children.lastName,
        childDob:         schema.children.dateOfBirth,
        parentId:         schema.bookings.parentId,
        parentFirstName:  schema.users.firstName,
        parentPhone:      schema.users.phone,
        parentCity:       schema.users.city,
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.children,   eq(schema.bookings.childId, schema.children.id))
      .leftJoin(schema.users,      eq(schema.bookings.parentId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.bookings.scheduledAt))

    return reply.send({ items: rows })
  })

  // ── PATCH /bookings/:id/status ─────────────────────────────────────────────
  // Teacher updates booking status: confirmed | cancelled
  fastify.patch<{
    Params: { id: string }
    Body: { status: 'confirmed' | 'cancelled'; teacherId: string }
  }>('/bookings/:id/status', async (req, reply) => {
    const { id } = req.params
    const { status, teacherId } = req.body
    if (!status || !teacherId) return reply.status(400).send({ error: 'status and teacherId are required' })

    const allowed = ['confirmed', 'cancelled'] as const
    if (!allowed.includes(status)) return reply.status(400).send({ error: 'Invalid status' })

    const booking = await db.query.bookings.findFirst({
      where: and(eq(schema.bookings.id, id), eq(schema.bookings.teacherId, teacherId)),
    })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })

    const now = new Date()
    const nextOtp = status === 'confirmed'
      ? (APP_MODE === 'development' ? DEVELOPMENT_OTP : String(Math.floor(100000 + Math.random() * 900000)))
      : null
    const [updated] = await db
      .update(schema.bookings)
      .set({
        status,
        confirmedAt: status === 'confirmed' ? now : booking.confirmedAt,
        teacherOtp: status === 'confirmed' ? nextOtp : null,
        teacherOtpGeneratedAt: status === 'confirmed' ? now : null,
        teacherOtpVerifiedAt: status === 'cancelled' ? null : booking.teacherOtpVerifiedAt,
        updatedAt: now,
      })
      .where(eq(schema.bookings.id, id))
      .returning()

    if (status === 'confirmed') {
      await db.insert(schema.notifications).values({
        userId: booking.parentId,
        type: 'booking.confirmed',
        title: 'Teacher confirmed your class',
        body: 'Your teacher has confirmed the booking. OTP will be available at class time.',
        data: { bookingId: id },
      })
      console.log('[beam-whatsapp][teacher-otp]', { bookingId: id, teacherId, otp: nextOtp })
    }

    if (status === 'cancelled' && booking.slotId) {
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

    return reply.send(updated)
  })

  // ── GET /teacher/profile?userId= ──────────────────────────────────────────
  // Teacher's own profile (user + teacher row joined)
  fastify.get<{ Querystring: { userId: string } }>('/teacher/profile', async (req, reply) => {
    const { userId } = req.query
    if (!userId) return reply.status(400).send({ error: 'userId is required' })

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const teacher = await db.query.teachers.findFirst({ where: eq(schema.teachers.userId, userId) })

    const [sessionsRow] = await db
      .select({ total: count() })
      .from(schema.bookings)
      .where(and(eq(schema.bookings.teacherId, userId), eq(schema.bookings.status, 'completed')))

    return reply.send({
      id:                 user.id,
      firstName:          user.firstName,
      lastName:           user.lastName,
      email:              user.email,
      phone:              user.phone,
      city:               user.city,
      avatarUrl:          user.avatarUrl,
      bio:                teacher?.bio ?? null,
      specializations:    teacher?.specializations ?? [],
      verificationStatus: teacher?.verificationStatus ?? 'pending',
      rating:             teacher?.rating ?? '0',
      reviewCount:        teacher?.reviewCount ?? 0,
      totalSessions:      sessionsRow?.total ?? 0,
    })
  })

  // ── PATCH /teacher/profile ─────────────────────────────────────────────────
  // Update teacher's own profile fields
  fastify.patch<{
    Body: { userId: string; firstName?: string; lastName?: string; city?: string; bio?: string; phone?: string; specializations?: string[] }
  }>('/teacher/profile', async (req, reply) => {
    const { userId, firstName, lastName, city, bio, phone, specializations } = req.body
    if (!userId) return reply.status(400).send({ error: 'userId is required' })

    const userUpdate: Record<string, any> = { updatedAt: new Date() }
    if (firstName !== undefined) userUpdate.firstName = firstName.trim()
    if (lastName  !== undefined) userUpdate.lastName  = lastName.trim()
    if (city      !== undefined) userUpdate.city      = city.trim()
    if (phone     !== undefined) userUpdate.phone     = phone.trim()

    if (Object.keys(userUpdate).length > 1) {
      await db.update(schema.users).set(userUpdate).where(eq(schema.users.id, userId))
    }

    const teacherUpdate: Record<string, any> = {}
    if (bio !== undefined) teacherUpdate.bio = bio.trim()
    if (specializations !== undefined) teacherUpdate.specializations = specializations

    if (Object.keys(teacherUpdate).length > 0) {
      await db.update(schema.teachers)
        .set({ ...teacherUpdate, updatedAt: new Date() })
        .where(eq(schema.teachers.userId, userId))
    }

    return reply.send({ ok: true })
  })

  // ── GET /teacher/availability?userId= ─────────────────────────────────────
  // Teacher's weekly availability preferences
  fastify.get<{ Querystring: { userId: string } }>('/teacher/availability', async (req, reply) => {
    const { userId } = req.query
    if (!userId) return reply.status(400).send({ error: 'userId is required' })

    const teacher = await db.query.teachers.findFirst({
      where: eq(schema.teachers.userId, userId),
      columns: { availabilityJson: true },
    })

    return reply.send({ availability: teacher?.availabilityJson ?? null })
  })

  // ── PATCH /teacher/availability ────────────────────────────────────────────
  // Save teacher's weekly availability preferences
  fastify.patch<{
    Body: { userId: string; availability: Record<string, string[]> }
  }>('/teacher/availability', async (req, reply) => {
    const { userId, availability } = req.body
    if (!userId || !availability) return reply.status(400).send({ error: 'userId and availability are required' })

    await db.update(schema.teachers)
      .set({ availabilityJson: availability, updatedAt: new Date() })
      .where(eq(schema.teachers.userId, userId))

    return reply.send({ ok: true })
  })

  // ── GET /teacher/earnings?teacherId= ──────────────────────────────────────
  // Earnings summary + payout history
  fastify.get<{ Querystring: { teacherId: string } }>('/teacher/earnings', async (req, reply) => {
    const { teacherId } = req.query
    if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })

    // Total earned from completed bookings
    const [earningsRow] = await db
      .select({ total: sum(schema.bookings.totalAmount), sessions: count() })
      .from(schema.bookings)
      .where(and(eq(schema.bookings.teacherId, teacherId), eq(schema.bookings.status, 'completed')))

    // Payout history
    const payoutRows = await db
      .select({
        id:          schema.payouts.id,
        amount:      schema.payouts.amount,
        status:      schema.payouts.status,
        sessionCount: schema.payouts.sessionCount,
        scheduledAt: schema.payouts.scheduledAt,
        settledAt:   schema.payouts.settledAt,
        createdAt:   schema.payouts.createdAt,
      })
      .from(schema.payouts)
      .where(eq(schema.payouts.teacherId, teacherId))
      .orderBy(desc(schema.payouts.createdAt))
      .limit(20)

    // Pending payout estimate: completed bookings not yet in any payout
    const [pendingRow] = await db
      .select({ pending: sum(schema.bookings.totalAmount), pendingCount: count() })
      .from(schema.bookings)
      .where(and(
        eq(schema.bookings.teacherId, teacherId),
        eq(schema.bookings.status, 'completed'),
      ))

    return reply.send({
      totalEarned:        earningsRow?.total ?? '0',
      totalSessions:      earningsRow?.sessions ?? 0,
      pendingPayout:      pendingRow?.pending ?? '0',
      awaitingPayoutCount: pendingRow?.pendingCount ?? 0,
      payouts:            payoutRows,
    })
  })

  // ── GET /notifications?userId= ────────────────────────────────────────────
  // User's notification list (most recent first)
  fastify.get<{ Querystring: { userId: string; limit?: string } }>('/notifications', async (req, reply) => {
    const { userId, limit = '30' } = req.query
    if (!userId) return reply.status(400).send({ error: 'userId is required' })

    const rows = await db
      .select({
        id:        schema.notifications.id,
        type:      schema.notifications.type,
        title:     schema.notifications.title,
        body:      schema.notifications.body,
        data:      schema.notifications.data,
        isRead:    schema.notifications.isRead,
        createdAt: schema.notifications.createdAt,
        readAt:    schema.notifications.readAt,
      })
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(Math.min(parseInt(limit, 10), 100))

    const unreadCount = rows.filter(r => !r.isRead).length
    return reply.send({ items: rows, unreadCount })
  })

  // ── PATCH /notifications/:id/read ─────────────────────────────────────────
  // Mark a notification as read
  fastify.patch<{ Params: { id: string }; Body: { userId: string } }>(
    '/notifications/:id/read',
    async (req, reply) => {
      const { id } = req.params
      const { userId } = req.body
      if (!userId) return reply.status(400).send({ error: 'userId is required' })

      await db
        .update(schema.notifications)
        .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
        .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)))

      return reply.send({ ok: true })
    }
  )

  // ── PATCH /notifications/read-all ─────────────────────────────────────────
  // Mark all notifications as read for a user
  fastify.patch<{ Body: { userId: string } }>('/notifications/read-all', async (req, reply) => {
    const { userId } = req.body
    if (!userId) return reply.status(400).send({ error: 'userId is required' })

    await db
      .update(schema.notifications)
      .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
      .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false)))

    return reply.send({ ok: true })
  })
}
