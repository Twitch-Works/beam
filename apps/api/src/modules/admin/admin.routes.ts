import type { FastifyInstance } from 'fastify'
import { and, count, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'

export async function adminRoutes(fastify: FastifyInstance) {

  // ─── Analytics Overview ────────────────────────────────────────────────────

  fastify.get('/admin/analytics/overview', async (_req, reply) => {
    const [
      totalUsersResult,
      activeBookingsResult,
      revenueResult,
      completedResult,
      verifiedTeachersResult,
      recentBookings,
    ] = await Promise.all([
      db.select({ count: count() }).from(schema.users)
        .where(or(eq(schema.users.role, 'parent'), eq(schema.users.role, 'teacher'))),

      db.select({ count: count() }).from(schema.bookings)
        .where(or(eq(schema.bookings.status, 'pending'), eq(schema.bookings.status, 'confirmed'))),

      db.select({ total: sql<string>`coalesce(sum(amount), 0)` }).from(schema.payments)
        .where(eq(schema.payments.status, 'success')),

      db.select({ count: count() }).from(schema.bookings)
        .where(eq(schema.bookings.status, 'completed')),

      db.select({ count: count() }).from(schema.teachers)
        .where(eq(schema.teachers.verificationStatus, 'verified')),

      db.select({
        id: schema.bookings.id,
        status: schema.bookings.status,
        totalAmount: schema.bookings.totalAmount,
        createdAt: schema.bookings.createdAt,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        activityTitle: schema.activities.title,
      })
        .from(schema.bookings)
        .leftJoin(schema.users, eq(schema.bookings.parentId, schema.users.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .orderBy(desc(schema.bookings.createdAt))
        .limit(8),
    ])

    return reply.send({
      kpis: {
        totalUsers: totalUsersResult[0].count,
        activeBookings: activeBookingsResult[0].count,
        totalRevenue: Number(revenueResult[0].total),
        sessionsCompleted: completedResult[0].count,
        verifiedTeachers: verifiedTeachersResult[0].count,
      },
      recentBookings,
    })
  })

  // ─── Bookings List ─────────────────────────────────────────────────────────

  fastify.get<{
    Querystring: {
      status?: string; city?: string; search?: string; page?: string; limit?: string
    }
  }>('/admin/bookings', async (req, reply) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Number(req.query.limit ?? 20))
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (req.query.status) conditions.push(eq(schema.bookings.status, req.query.status as any))
    if (req.query.search) {
      const q = `%${req.query.search}%`
      conditions.push(
        or(
          ilike(schema.users.firstName, q),
          ilike(schema.users.lastName, q),
          ilike(schema.activities.title, q),
        )!
      )
    }

    const where = conditions.length ? and(...conditions) : undefined

    const [items, totalResult] = await Promise.all([
      db.select({
        id: schema.bookings.id,
        status: schema.bookings.status,
        sessionType: schema.bookings.sessionType,
        totalAmount: schema.bookings.totalAmount,
        discountAmount: schema.bookings.discountAmount,
        scheduledAt: schema.bookings.scheduledAt,
        createdAt: schema.bookings.createdAt,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        parentCity: schema.users.city,
        activityTitle: schema.activities.title,
        childFirstName: schema.children.firstName,
      })
        .from(schema.bookings)
        .leftJoin(schema.users, eq(schema.bookings.parentId, schema.users.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
        .where(where)
        .orderBy(desc(schema.bookings.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(schema.bookings)
        .leftJoin(schema.users, eq(schema.bookings.parentId, schema.users.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .where(where),
    ])

    return reply.send({ items, total: totalResult[0].count, page, limit })
  })

  // ─── Booking Detail ────────────────────────────────────────────────────────

  fastify.get<{ Params: { id: string } }>('/admin/bookings/:id', async (req, reply) => {
    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, req.params.id),
      with: {
        parent: true,
        child: true,
        activity: { with: { category: true } },
        slot: true,
        payment: true,
        review: true,
      },
    })
    if (!booking) return reply.status(404).send({ error: 'NOT_FOUND' })

    let teacher: Record<string, unknown> | null = null
    if (booking.teacherId) {
      teacher = await db.query.users.findFirst({
        where: eq(schema.users.id, booking.teacherId),
        with: { teacher: true },
      }) ?? null
    }

    return reply.send({ ...booking, teacher })
  })

  // ─── Teachers List ─────────────────────────────────────────────────────────

  fastify.get<{
    Querystring: { status?: string; city?: string; search?: string }
  }>('/admin/teachers', async (req, reply) => {
    const conditions: SQL<unknown>[] = []
    if (req.query.status) {
      conditions.push(eq(schema.teachers.verificationStatus, req.query.status as any))
    }
    if (req.query.city) {
      conditions.push(ilike(schema.users.city, `%${req.query.city}%`))
    }
    if (req.query.search) {
      const q = `%${req.query.search}%`
      conditions.push(or(ilike(schema.users.firstName, q), ilike(schema.users.lastName, q))!)
    }

    const items = await db
      .select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
        city: schema.users.city,
        createdAt: schema.users.createdAt,
        verificationStatus: schema.teachers.verificationStatus,
        specializations: schema.teachers.specializations,
        rating: schema.teachers.rating,
        reviewCount: schema.teachers.reviewCount,
        teacherId: schema.teachers.id,
      })
      .from(schema.users)
      .innerJoin(schema.teachers, eq(schema.teachers.userId, schema.users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.users.createdAt))

    const [totalResult, verifiedResult, pendingResult] = await Promise.all([
      db.select({ count: count() }).from(schema.teachers),
      db.select({ count: count() }).from(schema.teachers).where(eq(schema.teachers.verificationStatus, 'verified')),
      db.select({ count: count() }).from(schema.teachers).where(eq(schema.teachers.verificationStatus, 'pending')),
    ])

    return reply.send({
      items,
      total: totalResult[0].count,
      verified: verifiedResult[0].count,
      pending: pendingResult[0].count,
    })
  })

  // ─── Teacher Detail ────────────────────────────────────────────────────────

  fastify.get<{ Params: { id: string } }>('/admin/teachers/:id', async (req, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, req.params.id),
      with: { teacher: true },
    })
    if (!user) return reply.status(404).send({ error: 'NOT_FOUND' })

    const [sessions, earningsSummary] = await Promise.all([
      db.select({
        id: schema.bookings.id,
        status: schema.bookings.status,
        totalAmount: schema.bookings.totalAmount,
        scheduledAt: schema.bookings.scheduledAt,
        activityTitle: schema.activities.title,
        childFirstName: schema.children.firstName,
      })
        .from(schema.bookings)
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
        .where(eq(schema.bookings.teacherId, req.params.id))
        .orderBy(desc(schema.bookings.scheduledAt))
        .limit(20),

      db.select({ total: sql<string>`coalesce(sum(${schema.payments.amount}), 0)` })
        .from(schema.payments)
        .innerJoin(schema.bookings, eq(schema.bookings.id, schema.payments.bookingId))
        .where(and(eq(schema.bookings.teacherId, req.params.id), eq(schema.payments.status, 'success'))),
    ])

    return reply.send({ ...user, sessions, totalEarnings: Number(earningsSummary[0]?.total ?? 0) })
  })

  // ─── Activities List ───────────────────────────────────────────────────────

  fastify.get<{
    Querystring: { status?: string; categoryId?: string; search?: string; page?: string; limit?: string }
  }>('/admin/activities', async (req, reply) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Number(req.query.limit ?? 20))
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (req.query.status) conditions.push(eq(schema.activities.status, req.query.status as any))
    if (req.query.categoryId) conditions.push(eq(schema.activities.categoryId, req.query.categoryId))
    if (req.query.search) conditions.push(ilike(schema.activities.title, `%${req.query.search}%`))

    const where = conditions.length ? and(...conditions) : undefined

    const [items, totalResult] = await Promise.all([
      db.select({
        id: schema.activities.id,
        title: schema.activities.title,
        description: schema.activities.description,
        status: schema.activities.status,
        ageGroup: schema.activities.ageGroup,
        sessionType: schema.activities.sessionType,
        sessionDurationMins: schema.activities.sessionDurationMins,
        pricePerSession: schema.activities.pricePerSession,
        imageUrl: schema.activities.imageUrl,
        tags: schema.activities.tags,
        createdAt: schema.activities.createdAt,
        categoryName: schema.categories.name,
        categoryColor: schema.categories.color,
        totalBookings: sql<number>`(select count(*) from bookings where activity_id = ${schema.activities.id})`,
        avgRating: sql<number>`(select coalesce(avg(rating), 0) from reviews where activity_id = ${schema.activities.id})`,
      })
        .from(schema.activities)
        .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
        .where(where)
        .orderBy(desc(schema.activities.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() }).from(schema.activities).where(where),
    ])

    return reply.send({ items, total: totalResult[0].count, page, limit })
  })

  // ─── Users List ────────────────────────────────────────────────────────────

  fastify.get<{
    Querystring: { role?: string; search?: string; page?: string; limit?: string }
  }>('/admin/users', async (req, reply) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Number(req.query.limit ?? 20))
    const offset = (page - 1) * limit

    const conditions = [
      or(eq(schema.users.role, 'parent'), eq(schema.users.role, 'teacher'))!,
    ]
    if (req.query.role) conditions.push(eq(schema.users.role, req.query.role as any))
    if (req.query.search) {
      const q = `%${req.query.search}%`
      conditions.push(
        or(ilike(schema.users.firstName, q), ilike(schema.users.lastName, q), ilike(schema.users.email, q))!
      )
    }

    const where = and(...conditions)

    const [items, totalResult] = await Promise.all([
      db.select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
        role: schema.users.role,
        city: schema.users.city,
        phone: schema.users.phone,
        createdAt: schema.users.createdAt,
        childCount: sql<number>`(select count(*) from children where parent_id = ${schema.users.id})`,
        bookingCount: sql<number>`(select count(*) from bookings where parent_id = ${schema.users.id})`,
      })
        .from(schema.users)
        .where(where)
        .orderBy(desc(schema.users.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() }).from(schema.users).where(where),
    ])

    return reply.send({ items, total: totalResult[0].count, page, limit })
  })

  // ─── User Detail ───────────────────────────────────────────────────────────

  fastify.get<{ Params: { id: string } }>('/admin/users/:id', async (req, reply) => {
    const { id } = req.params

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const [childRows, bookingRows, spendResult] = await Promise.all([
      db.select({
        id: schema.children.id,
        firstName: schema.children.firstName,
        lastName: schema.children.lastName,
        dateOfBirth: schema.children.dateOfBirth,
      }).from(schema.children).where(eq(schema.children.parentId, id)),

      db.select({
        id: schema.bookings.id,
        status: schema.bookings.status,
        totalAmount: schema.bookings.totalAmount,
        scheduledAt: schema.bookings.scheduledAt,
        createdAt: schema.bookings.createdAt,
        activityTitle: schema.activities.title,
        teacherFirstName: schema.users.firstName,
        teacherLastName: schema.users.lastName,
      })
        .from(schema.bookings)
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .leftJoin(schema.users, eq(schema.bookings.teacherId, schema.users.id))
        .where(eq(schema.bookings.parentId, id))
        .orderBy(desc(schema.bookings.createdAt))
        .limit(10),

      db.select({ total: sql<string>`coalesce(sum(total_amount), 0)` })
        .from(schema.bookings)
        .where(eq(schema.bookings.parentId, id)),
    ])

    return reply.send({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      city: user.city,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      children: childRows.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        dateOfBirth: c.dateOfBirth,
      })),
      recentBookings: bookingRows.map(b => ({
        id: b.id,
        status: b.status,
        totalAmount: Number(b.totalAmount),
        scheduledAt: b.scheduledAt,
        createdAt: b.createdAt,
        activityTitle: b.activityTitle ?? '—',
        teacherName: b.teacherFirstName ? `${b.teacherFirstName} ${b.teacherLastName ?? ''}`.trim() : null,
      })),
      totalBookings: bookingRows.length,
      totalSpend: Number(spendResult[0].total),
    })
  })

  // ─── Payments / Payouts ────────────────────────────────────────────────────

  fastify.get<{
    Querystring: { status?: string; search?: string; page?: string; limit?: string }
  }>('/admin/payments', async (req, reply) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Number(req.query.limit ?? 20))
    const offset = (page - 1) * limit

    const conditions: SQL<unknown>[] = []
    if (req.query.status) conditions.push(eq(schema.payments.status, req.query.status as any))

    const where = conditions.length ? and(...conditions) : undefined

    const [payments, payouts, totals] = await Promise.all([
      db.select({
        id: schema.payments.id,
        bookingId: schema.payments.bookingId,
        amount: schema.payments.amount,
        gateway: schema.payments.gateway,
        gatewayPaymentId: schema.payments.gatewayPaymentId,
        status: schema.payments.status,
        refundedAt: schema.payments.refundedAt,
        createdAt: schema.payments.createdAt,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        activityTitle: schema.activities.title,
      })
        .from(schema.payments)
        .leftJoin(schema.users, eq(schema.payments.parentId, schema.users.id))
        .leftJoin(schema.bookings, eq(schema.payments.bookingId, schema.bookings.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .where(where)
        .orderBy(desc(schema.payments.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({
        id: schema.payouts.id,
        amount: schema.payouts.amount,
        sessionCount: schema.payouts.sessionCount,
        status: schema.payouts.status,
        bankAccount: schema.payouts.bankAccount,
        scheduledAt: schema.payouts.scheduledAt,
        settledAt: schema.payouts.settledAt,
        createdAt: schema.payouts.createdAt,
        teacherFirstName: schema.users.firstName,
        teacherLastName: schema.users.lastName,
      })
        .from(schema.payouts)
        .leftJoin(schema.users, eq(schema.payouts.teacherId, schema.users.id))
        .orderBy(desc(schema.payouts.createdAt))
        .limit(20),

      db.select({
        totalRevenue: sql<string>`coalesce(sum(case when status = 'success' then amount else 0 end), 0)`,
        pendingPayouts: sql<string>`coalesce(sum(case when status = 'queued' then amount else 0 end), 0)`,
        refundsIssued: sql<string>`coalesce(sum(case when status = 'refunded' then amount else 0 end), 0)`,
        failed: count(sql`case when status = 'failed' then 1 end`),
      }).from(schema.payments),
    ])

    return reply.send({ payments, payouts, totals: totals[0] })
  })

  // ─── Reviews List ──────────────────────────────────────────────────────────

  fastify.get<{
    Querystring: { minRating?: string; flagged?: string; search?: string }
  }>('/admin/reviews', async (req, reply) => {
    const conditions: SQL<unknown>[] = []
    if (req.query.minRating) {
      conditions.push(gte(schema.reviews.rating, Number(req.query.minRating)))
    }
    if (req.query.flagged === 'true') {
      conditions.push(eq(schema.reviews.isFlagged, true))
    }

    const items = await db.select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      comment: schema.reviews.comment,
      isFlagged: schema.reviews.isFlagged,
      createdAt: schema.reviews.createdAt,
      parentFirstName: schema.users.firstName,
      parentLastName: schema.users.lastName,
      activityTitle: schema.activities.title,
      bookingId: schema.reviews.bookingId,
    })
      .from(schema.reviews)
      .leftJoin(schema.users, eq(schema.reviews.parentId, schema.users.id))
      .leftJoin(schema.activities, eq(schema.reviews.activityId, schema.activities.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.reviews.createdAt))
      .limit(50)

    const [avgResult, totalResult, flaggedResult] = await Promise.all([
      db.select({ avg: sql<string>`coalesce(avg(rating), 0)` }).from(schema.reviews),
      db.select({ count: count() }).from(schema.reviews),
      db.select({ count: count() }).from(schema.reviews).where(eq(schema.reviews.isFlagged, true)),
    ])

    return reply.send({
      items,
      total: totalResult[0].count,
      avgRating: Number(avgResult[0].avg).toFixed(1),
      flagged: flaggedResult[0].count,
    })
  })

  // ─── Verification Queue ────────────────────────────────────────────────────

  fastify.get('/admin/teachers/verification/pending', async (_req, reply) => {
    const items = await db
      .select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email,
        city: schema.users.city,
        createdAt: schema.users.createdAt,
        verificationStatus: schema.teachers.verificationStatus,
        specializations: schema.teachers.specializations,
        documents: schema.teachers.documents,
        teacherId: schema.teachers.id,
      })
      .from(schema.users)
      .innerJoin(schema.teachers, eq(schema.teachers.userId, schema.users.id))
      .where(eq(schema.teachers.verificationStatus, 'pending'))
      .orderBy(schema.users.createdAt)

    return reply.send({ items, total: items.length })
  })

  // ─── Categories ────────────────────────────────────────────────────────────

  fastify.get('/admin/categories', async (_req, reply) => {
    const items = await db.select().from(schema.categories).orderBy(schema.categories.name)
    return reply.send({ items })
  })

  // ─── Coupons ───────────────────────────────────────────────────────────────

  fastify.get('/admin/coupons', async (_req, reply) => {
    const items = await db.select().from(schema.discountCodes).orderBy(desc(schema.discountCodes.createdAt))
    return reply.send({ items })
  })

  // ─── Audit Logs ────────────────────────────────────────────────────────────

  fastify.get('/admin/audit-logs', async (_req, reply) => {
    const items = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        entityType: schema.auditLogs.entityType,
        entityId: schema.auditLogs.entityId,
        before: schema.auditLogs.before,
        after: schema.auditLogs.after,
        createdAt: schema.auditLogs.createdAt,
        actorFirstName: schema.users.firstName,
        actorLastName: schema.users.lastName,
        actorRole: schema.auditLogs.actorRole,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.actorId, schema.users.id))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(100)

    return reply.send({ items, total: items.length })
  })

  // ─── Activity Detail ───────────────────────────────────────────────────────

  fastify.get<{ Params: { id: string } }>('/admin/activities/:id', async (req, reply) => {
    const { id } = req.params
    const [activity] = await db
      .select({
        id: schema.activities.id,
        title: schema.activities.title,
        description: schema.activities.description,
        categoryId: schema.activities.categoryId,
        status: schema.activities.status,
        ageGroup: schema.activities.ageGroup,
        sessionType: schema.activities.sessionType,
        sessionDurationMins: schema.activities.sessionDurationMins,
        minChildren: schema.activities.minChildren,
        maxChildren: schema.activities.maxChildren,
        pricePerSession: schema.activities.pricePerSession,
        imageUrl: schema.activities.imageUrl,
        tags: schema.activities.tags,
        materialsNeeded: schema.activities.materialsNeeded,
        preparationNotes: schema.activities.preparationNotes,
        createdAt: schema.activities.createdAt,
        categoryName: schema.categories.name,
        totalBookings: sql<number>`(select count(*) from bookings where activity_id = ${schema.activities.id})`,
        avgRating: sql<number>`(select coalesce(avg(rating), 0) from reviews where activity_id = ${schema.activities.id})`,
      })
      .from(schema.activities)
      .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
      .where(eq(schema.activities.id, id))

    if (!activity) return reply.status(404).send({ error: 'Activity not found' })
    return reply.send(activity)
  })

  // ─── Update Activity ───────────────────────────────────────────────────────

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>('/admin/activities/:id', async (req, reply) => {
    const { id } = req.params
    const {
      title, description, ageGroup, pricePerSession, categoryId, sessionType,
      sessionDurationMins, minChildren, maxChildren, imageUrl, tags,
      materialsNeeded, preparationNotes, status,
    } = req.body as any

    const [updated] = await db
      .update(schema.activities)
      .set({
        ...(title !== undefined && { title: String(title) }),
        ...(description !== undefined && { description: String(description) }),
        ...(ageGroup !== undefined && { ageGroup: String(ageGroup) }),
        ...(pricePerSession !== undefined && { pricePerSession: String(pricePerSession) }),
        ...(categoryId !== undefined && { categoryId: String(categoryId) }),
        ...(sessionType !== undefined && { sessionType: sessionType as '1:1' | 'group' }),
        ...(sessionDurationMins !== undefined && { sessionDurationMins: Number(sessionDurationMins) }),
        ...(minChildren !== undefined && { minChildren: Number(minChildren) }),
        ...(maxChildren !== undefined && { maxChildren: Number(maxChildren) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl) : null }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags as string[] : (typeof tags === 'string' && tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []) }),
        ...(materialsNeeded !== undefined && { materialsNeeded: materialsNeeded ? String(materialsNeeded) : null }),
        ...(preparationNotes !== undefined && { preparationNotes: preparationNotes ? String(preparationNotes) : null }),
        ...(status !== undefined && { status: status as 'draft' | 'published' | 'archived' }),
        updatedAt: new Date(),
      })
      .where(eq(schema.activities.id, id))
      .returning()

    if (!updated) return reply.status(404).send({ error: 'Activity not found' })
    return reply.send(updated)
  })

  // ─── Create Activity ───────────────────────────────────────────────────────

  fastify.post('/admin/activities', async (request, reply) => {
    const body = request.body as Record<string, unknown>
    const {
      title, categoryId, description, ageGroup, sessionType, minChildren, maxChildren,
      sessionDurationMins, pricePerSession, imageUrl, tags, materialsNeeded, preparationNotes, status,
    } = body

    if (!title || !description || !ageGroup || !pricePerSession || !categoryId) {
      return reply.status(400).send({ error: 'title, description, ageGroup, pricePerSession, and categoryId are required' })
    }

    const [activity] = await db.insert(schema.activities).values({
      title: String(title),
      categoryId: String(categoryId),
      description: String(description),
      ageGroup: String(ageGroup),
      sessionType: (sessionType as '1:1' | 'group') ?? '1:1',
      minChildren: minChildren ? Number(minChildren) : 1,
      maxChildren: maxChildren ? Number(maxChildren) : 1,
      sessionDurationMins: sessionDurationMins ? Number(sessionDurationMins) : 60,
      pricePerSession: String(pricePerSession),
      imageUrl: imageUrl ? String(imageUrl) : null,
      tags: Array.isArray(tags) ? tags as string[] : (typeof tags === 'string' && tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      materialsNeeded: materialsNeeded ? String(materialsNeeded) : null,
      preparationNotes: preparationNotes ? String(preparationNotes) : null,
      status: (status as 'draft' | 'published' | 'archived') ?? 'draft',
    }).returning()

    return reply.status(201).send(activity)
  })

  // ─── Invite Teacher ────────────────────────────────────────────────────────

  fastify.post('/admin/teachers', async (request, reply) => {
    const body = request.body as Record<string, unknown>
    const { firstName, lastName, email, phone, city, bio, specializations } = body

    if (!firstName || !lastName || !email) {
      return reply.status(400).send({ error: 'firstName, lastName, and email are required' })
    }

    const existing = await db.select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, String(email)))
      .limit(1)

    if (existing.length > 0) {
      return reply.status(409).send({ error: 'A user with this email already exists' })
    }

    const [user] = await db.insert(schema.users).values({
      email: String(email),
      role: 'teacher',
      firstName: String(firstName),
      lastName: String(lastName),
      phone: phone ? String(phone) : null,
      city: city ? String(city) : null,
    }).returning()

    const specs = Array.isArray(specializations)
      ? specializations as string[]
      : (typeof specializations === 'string' && specializations
          ? specializations.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [])

    const [teacher] = await db.insert(schema.teachers).values({
      userId: user.id,
      bio: bio ? String(bio) : null,
      specializations: specs,
      verificationStatus: 'pending',
    }).returning()

    return reply.status(201).send({ id: teacher.id, userId: user.id })
  })

  // ─── Slots for an activity ────────────────────────────────────────────────

  fastify.get('/admin/activities/:id/slots', async (request, reply) => {
    const { id } = request.params as { id: string }
    const rows = await db.select({
      id: schema.slots.id,
      date: schema.slots.date,
      startTime: schema.slots.startTime,
      endTime: schema.slots.endTime,
      isAvailable: schema.slots.isAvailable,
      lockedByBookingId: schema.slots.lockedByBookingId,
      teacherFirstName: schema.users.firstName,
      teacherLastName: schema.users.lastName,
    })
      .from(schema.slots)
      .leftJoin(schema.users, eq(schema.slots.teacherId, schema.users.id))
      .where(eq(schema.slots.activityId, id))
      .orderBy(schema.slots.date, schema.slots.startTime)
    return reply.send({ items: rows })
  })

  fastify.post('/admin/slots', async (request, reply) => {
    const { activityId, teacherId, date, startTime, endTime } = request.body as Record<string, string>
    if (!activityId || !teacherId || !date || !startTime || !endTime) {
      return reply.status(400).send({ error: 'activityId, teacherId, date, startTime, endTime required' })
    }
    const [slot] = await db.insert(schema.slots).values({
      activityId,
      teacherId,
      date,
      startTime,
      endTime,
      isAvailable: true,
    }).returning()
    return reply.status(201).send(slot)
  })

  // ─── Verify / Reject Teacher ───────────────────────────────────────────────

  fastify.patch<{ Params: { id: string }; Body: { action: string; notes?: string } }>(
    '/admin/teachers/:id/verify',
    async (req, reply) => {
      const { id } = req.params
      const { action } = req.body as { action: string; notes?: string }

      if (!action || !['verify', 'reject'].includes(action)) {
        return reply.status(400).send({ error: 'action must be "verify" or "reject"' })
      }

      const [updated] = await db
        .update(schema.teachers)
        .set({
          verificationStatus: action === 'verify' ? 'verified' : 'rejected',
          updatedAt: new Date(),
        })
        .where(eq(schema.teachers.userId, id))
        .returning()

      if (!updated) return reply.status(404).send({ error: 'Teacher not found' })
      return reply.send(updated)
    }
  )

  // ─── Publish / Archive Activity ───────────────────────────────────────────

  fastify.patch<{ Params: { id: string } }>('/admin/activities/:id/publish', async (req, reply) => {
    const { id } = req.params
    const [updated] = await db
      .update(schema.activities)
      .set({ status: 'published', updatedAt: new Date() })
      .where(eq(schema.activities.id, id))
      .returning()
    if (!updated) return reply.status(404).send({ error: 'Activity not found' })
    return reply.send(updated)
  })

  fastify.patch<{ Params: { id: string } }>('/admin/activities/:id/archive', async (req, reply) => {
    const { id } = req.params
    const [updated] = await db
      .update(schema.activities)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(schema.activities.id, id))
      .returning()
    if (!updated) return reply.status(404).send({ error: 'Activity not found' })
    return reply.send(updated)
  })

  // ─── Refund Payment (standalone) ──────────────────────────────────────────

  fastify.post<{ Params: { bookingId: string } }>('/admin/payments/:bookingId/refund', async (req, reply) => {
    const { bookingId } = req.params

    const payment = await db.query.payments.findFirst({
      where: eq(schema.payments.bookingId, bookingId),
    })
    if (!payment) return reply.status(404).send({ error: 'Payment not found' })
    if (payment.status === 'refunded') return reply.status(422).send({ error: 'Payment already refunded' })

    const [updated] = await db
      .update(schema.payments)
      .set({ status: 'refunded', refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.payments.bookingId, bookingId))
      .returning()

    return reply.send({ ok: true, payment: updated })
  })

  // ─── Assign Teacher to Booking ─────────────────────────────────────────────

  fastify.patch<{ Params: { id: string }; Body: { teacherId: string } }>(
    '/admin/bookings/:id/assign',
    async (req, reply) => {
      const { id } = req.params
      const { teacherId } = req.body as { teacherId: string }

      if (!teacherId) return reply.status(400).send({ error: 'teacherId is required' })

      const [updated] = await db
        .update(schema.bookings)
        .set({ teacherId, updatedAt: new Date() })
        .where(eq(schema.bookings.id, id))
        .returning()

      if (!updated) return reply.status(404).send({ error: 'Booking not found' })
      return reply.send(updated)
    }
  )

  // ─── Cancel Booking ────────────────────────────────────────────────────────

  fastify.post<{ Params: { id: string } }>(
    '/admin/bookings/:id/cancel',
    async (req, reply) => {
      const { id } = req.params

      const [booking] = await db
        .update(schema.bookings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(schema.bookings.id, id))
        .returning()

      if (!booking) return reply.status(404).send({ error: 'Booking not found' })

      const payment = await db.query.payments.findFirst({
        where: eq(schema.payments.bookingId, id),
      })

      if (payment && payment.status === 'success') {
        await db
          .update(schema.payments)
          .set({ status: 'refunded', refundedAt: new Date(), updatedAt: new Date() })
          .where(eq(schema.payments.bookingId, id))
      }

      return reply.send({ booking, refunded: payment?.status === 'success' })
    }
  )

  // ─── Disputes (synthesized) ────────────────────────────────────────────────

  fastify.get<{
    Querystring: { status?: string; type?: string; search?: string; page?: string; limit?: string }
  }>('/admin/disputes', async (req, reply) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Number(req.query.limit ?? 20))
    const filterType = req.query.type
    const filterStatus = req.query.status
    const search = req.query.search ? req.query.search.toLowerCase() : ''

    const [refundRows, qualityRows, billingRows] = await Promise.all([
      // Refund disputes — cancelled bookings with refunded payments
      filterType && filterType !== 'refund' ? [] : db.select({
        sourceId: schema.bookings.id,
        amount: schema.payments.amount,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        activityTitle: schema.activities.title,
        createdAt: schema.bookings.updatedAt,
      })
        .from(schema.bookings)
        .innerJoin(schema.payments, eq(schema.payments.bookingId, schema.bookings.id))
        .leftJoin(schema.users, eq(schema.bookings.parentId, schema.users.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .where(and(eq(schema.bookings.status, 'cancelled'), eq(schema.payments.status, 'refunded'))),

      // Quality disputes — flagged reviews
      filterType && filterType !== 'quality' ? [] : db.select({
        sourceId: schema.reviews.id,
        amount: sql<string>`'0'`,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        activityTitle: schema.activities.title,
        createdAt: schema.reviews.createdAt,
      })
        .from(schema.reviews)
        .leftJoin(schema.users, eq(schema.reviews.parentId, schema.users.id))
        .leftJoin(schema.activities, eq(schema.reviews.activityId, schema.activities.id))
        .where(eq(schema.reviews.isFlagged, true)),

      // Billing disputes — failed payments
      filterType && filterType !== 'billing' ? [] : db.select({
        sourceId: schema.payments.id,
        amount: schema.payments.amount,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        activityTitle: schema.activities.title,
        createdAt: schema.payments.createdAt,
      })
        .from(schema.payments)
        .leftJoin(schema.users, eq(schema.payments.parentId, schema.users.id))
        .leftJoin(schema.bookings, eq(schema.payments.bookingId, schema.bookings.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .where(eq(schema.payments.status, 'failed')),
    ])

    type DisputeRow = {
      id: string; type: string; status: string; priority: string;
      amount: number; parentName: string; activityTitle: string; createdAt: Date | string | null
    }

    const toDispute = (row: typeof refundRows[0], type: string): DisputeRow => {
      const amount = Number(row.amount ?? 0)
      return {
        id: `${type[0].toUpperCase()}-${row.sourceId.slice(0, 8).toUpperCase()}`,
        type,
        status: 'open',
        priority: amount > 500 ? 'high' : amount > 200 ? 'medium' : 'low',
        amount,
        parentName: `${row.parentFirstName ?? ''} ${row.parentLastName ?? ''}`.trim(),
        activityTitle: row.activityTitle ?? '',
        createdAt: row.createdAt,
      }
    }

    let all: DisputeRow[] = [
      ...refundRows.map(r => toDispute(r as any, 'refund')),
      ...qualityRows.map(r => toDispute(r as any, 'quality')),
      ...billingRows.map(r => toDispute(r as any, 'billing')),
    ]

    if (search) {
      all = all.filter(d =>
        d.parentName.toLowerCase().includes(search) ||
        d.activityTitle.toLowerCase().includes(search)
      )
    }
    if (filterStatus) {
      all = all.filter(d => d.status === filterStatus)
    }

    all.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())

    const total = all.length
    const items = all.slice((page - 1) * limit, page * limit)

    const open = all.filter(d => d.status === 'open').length
    const highPriority = all.filter(d => d.priority === 'high').length
    const refundAtRisk = refundRows.reduce((s, r) => s + Number((r as any).amount ?? 0), 0)

    return reply.send({
      items,
      total,
      page,
      limit,
      kpis: { open, underReview: 0, highPriority, refundAtRisk },
    })
  })

  // ─── Notifications ─────────────────────────────────────────────────────────

  fastify.get<{
    Querystring: { page?: string; limit?: string; type?: string }
  }>('/admin/notifications', async (req, reply) => {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Number(req.query.limit ?? 20))
    const offset = (page - 1) * limit

    const TEMPLATES = [
      { key: 'booking.confirmed', name: 'Booking Confirmed', channels: ['push', 'whatsapp'], isActive: true },
      { key: 'session.reminder', name: 'Session Reminder (24h)', channels: ['push', 'whatsapp'], isActive: true },
      { key: 'session.reminder_1h', name: 'Session Reminder (1h)', channels: ['push'], isActive: true },
      { key: 'payment.failed', name: 'Payment Failed', channels: ['push', 'email'], isActive: true },
      { key: 'payment.refunded', name: 'Refund Processed', channels: ['push', 'email'], isActive: true },
      { key: 'teacher.assigned', name: 'Teacher Assigned', channels: ['push', 'whatsapp'], isActive: true },
      { key: 'booking.cancelled', name: 'Booking Cancelled', channels: ['push', 'email'], isActive: true },
      { key: 'review.request', name: 'Leave a Review', channels: ['push'], isActive: true },
      { key: 'session.started', name: 'Session Started', channels: ['push'], isActive: false },
      { key: 'payout.settled', name: 'Payout Settled', channels: ['push', 'whatsapp'], isActive: true },
    ]

    const logConditions: SQL<unknown>[] = []
    if (req.query.type) logConditions.push(eq(schema.notifications.type, req.query.type))

    const where = logConditions.length ? and(...logConditions) : undefined

    const [logItems, totalResult, todayResult] = await Promise.all([
      db.select({
        id: schema.notifications.id,
        type: schema.notifications.type,
        title: schema.notifications.title,
        body: schema.notifications.body,
        isRead: schema.notifications.isRead,
        createdAt: schema.notifications.createdAt,
        userId: schema.notifications.userId,
        userFirstName: schema.users.firstName,
        userLastName: schema.users.lastName,
      })
        .from(schema.notifications)
        .leftJoin(schema.users, eq(schema.notifications.userId, schema.users.id))
        .where(where)
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() }).from(schema.notifications).where(where),

      db.select({ count: count() }).from(schema.notifications)
        .where(gte(schema.notifications.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))),
    ])

    return reply.send({
      templates: TEMPLATES,
      logs: { items: logItems, total: totalResult[0].count, page, limit },
      kpis: {
        deliveredToday: todayResult[0].count,
        failedToday: 0,
        queued: 0,
      },
    })
  })
}
