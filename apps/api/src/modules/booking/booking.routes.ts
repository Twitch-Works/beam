import type { FastifyInstance } from 'fastify'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { eq, and, or, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function bookingRoutes(fastify: FastifyInstance) {
  // GET /bookings?parentId= — parent's own bookings
  // TODO: replace parentId query param with JWT auth (authenticate middleware)
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
        id:           schema.bookings.id,
        status:       schema.bookings.status,
        sessionType:  schema.bookings.sessionType,
        totalAmount:  schema.bookings.totalAmount,
        scheduledAt:  schema.bookings.scheduledAt,
        createdAt:    schema.bookings.createdAt,
        activityId:       schema.bookings.activityId,
        activityTitle: schema.activities.title,
        activityImage: schema.activities.imageUrl,
        activityDuration: schema.activities.sessionDurationMins,
        teacherFirstName: schema.users.firstName,
        teacherLastName:  schema.users.lastName,
        childFirstName:   schema.children.firstName,
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.users,      eq(schema.bookings.teacherId, schema.users.id))
      .leftJoin(schema.children,   eq(schema.bookings.childId, schema.children.id))
      .where(and(...conditions))
      .orderBy(desc(schema.bookings.scheduledAt))

    return reply.send({ items: rows })
  })

  // GET /children?parentId= — parent's children list
  fastify.get<{ Querystring: { parentId: string } }>('/children', async (req, reply) => {
    const { parentId } = req.query
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const rows = await db
      .select({ id: schema.children.id, firstName: schema.children.firstName, lastName: schema.children.lastName, dateOfBirth: schema.children.dateOfBirth })
      .from(schema.children)
      .where(eq(schema.children.parentId, parentId))
      .orderBy(schema.children.createdAt)

    return reply.send({ items: rows })
  })

  // POST /bookings — create a booking + pending payment
  // TODO: add authenticate middleware when JWT verification is wired to Supabase
  fastify.post<{
    Body: { parentId: string; childId: string; activityId: string; slotId: string; totalAmount: number; discountCode?: string; discountAmount?: number }
  }>('/bookings', async (req, reply) => {
    const { parentId, childId, activityId, slotId, totalAmount, discountCode, discountAmount = 0 } = req.body
    if (!parentId || !childId || !activityId || !slotId || !totalAmount) {
      return reply.status(400).send({ error: 'parentId, childId, activityId, slotId, totalAmount are required' })
    }

    // Verify slot is still available
    const slot = await db.query.slots.findFirst({ where: eq(schema.slots.id, slotId) })
    if (!slot) return reply.status(404).send({ error: 'Slot not found' })
    if (!slot.isAvailable) return reply.status(409).send({ error: 'Slot no longer available' })

    const bookingId = randomUUID()

    // Create booking
    const [booking] = await db.insert(schema.bookings).values({
      id: bookingId,
      parentId,
      childId,
      activityId,
      slotId,
      teacherId: slot.teacherId,
      status: 'pending',
      sessionType: '1:1',
      totalAmount: String(totalAmount),
      discountAmount: String(discountAmount),
      discountCode: discountCode ?? null,
      scheduledAt: slot.date && slot.startTime
        ? new Date(`${slot.date}T${slot.startTime}`)
        : null,
    }).returning()

    // Create pending payment record
    const [payment] = await db.insert(schema.payments).values({
      bookingId,
      parentId,
      amount: String(totalAmount),
      gateway: 'razorpay',
      status: 'pending',
    }).returning()

    // Lock the slot
    await db.update(schema.slots)
      .set({ isAvailable: false, lockedByBookingId: bookingId, updatedAt: new Date() })
      .where(eq(schema.slots.id, slotId))

    return reply.status(201).send({ booking, payment })
  })

  // GET /bookings/:id — single booking detail for parent
  fastify.get<{ Params: { id: string }; Querystring: { parentId: string } }>('/bookings/:id', async (req, reply) => {
    const { id } = req.params
    const { parentId } = req.query
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const rows = await db
      .select({
        id:              schema.bookings.id,
        status:          schema.bookings.status,
        sessionType:     schema.bookings.sessionType,
        totalAmount:     schema.bookings.totalAmount,
        scheduledAt:     schema.bookings.scheduledAt,
        createdAt:       schema.bookings.createdAt,
        activityId:      schema.bookings.activityId,
        activityTitle:   schema.activities.title,
        activityImage:   schema.activities.imageUrl,
        activityDuration: schema.activities.sessionDurationMins,
        teacherId:       schema.bookings.teacherId,
        teacherFirstName: schema.users.firstName,
        teacherLastName:  schema.users.lastName,
        childFirstName:  schema.children.firstName,
        childLastName:   schema.children.lastName,
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.users,      eq(schema.bookings.teacherId, schema.users.id))
      .leftJoin(schema.children,   eq(schema.bookings.childId, schema.children.id))
      .where(and(eq(schema.bookings.id, id), eq(schema.bookings.parentId, parentId)))
      .limit(1)

    if (!rows[0]) return reply.status(404).send({ error: 'Booking not found' })
    return reply.send(rows[0])
  })

  // POST /bookings/:id/cancel — parent cancels their own booking
  fastify.post<{ Params: { id: string }; Body: { parentId: string } }>('/bookings/:id/cancel', async (req, reply) => {
    const { id } = req.params
    const { parentId } = req.body
    if (!parentId) return reply.status(400).send({ error: 'parentId is required' })

    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) })
    if (!booking) return reply.status(404).send({ error: 'Booking not found' })
    if (booking.parentId !== parentId) return reply.status(403).send({ error: 'Forbidden' })
    if (booking.status === 'cancelled') return reply.status(422).send({ error: 'Booking already cancelled' })
    if (booking.status === 'completed') return reply.status(422).send({ error: 'Cannot cancel a completed booking' })

    const [updated] = await db.update(schema.bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.bookings.id, id))
      .returning()

    // Release the slot
    if (booking.slotId) {
      await db.update(schema.slots)
        .set({ isAvailable: true, lockedByBookingId: null, updatedAt: new Date() })
        .where(eq(schema.slots.id, booking.slotId))
    }

    return reply.send({ ok: true, booking: updated })
  })

  // POST /bookings/:id/feedback — parent submits post-session rating
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

    // Check for duplicate review
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

  // PATCH /children/:id — parent updates a child's profile
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

  // GET /teachers/:id — public teacher profile for parent-facing screens
  fastify.get<{ Params: { id: string } }>('/teachers/:id', async (req, reply) => {
    const { id } = req.params

    const teacher = await db.query.teachers.findFirst({
      where: eq(schema.teachers.userId, id),
    })
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' })

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    })
    if (!user) return reply.status(404).send({ error: 'Teacher not found' })

    const activities = await db
      .selectDistinctOn([schema.activities.id], {
        id:                  schema.activities.id,
        title:               schema.activities.title,
        pricePerSession:     schema.activities.pricePerSession,
        sessionDurationMins: schema.activities.sessionDurationMins,
        ageGroup:            schema.activities.ageGroup,
        imageUrl:            schema.activities.imageUrl,
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
      id:             user.id,
      firstName:      user.firstName,
      lastName:       user.lastName,
      bio:            teacher.bio,
      city:           user.city,
      verificationStatus: teacher.verificationStatus,
      specializations:    teacher.specializations,
      totalSessions:  sessions.length,
      activities,
    })
  })

}
