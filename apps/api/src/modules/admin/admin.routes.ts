import type { FastifyInstance } from 'fastify'
import { and, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL, aliasedTable } from 'drizzle-orm'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { syncConflictingTeacherSlots } from '../../lib/slot-availability.js'

const SLOT_DURATION_OPTIONS = [30, 45, 60, 90, 120, 180, 240]

function normalizeSkillTerm(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function getTodayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildSkillIndex(values: string[]) {
  const phrases = new Set<string>()
  const tokens = new Set<string>()

  for (const value of values) {
    const normalized = normalizeSkillTerm(value)
    if (!normalized) continue
    phrases.add(normalized)
    for (const token of normalized.split(' ')) {
      if (token) tokens.add(token)
    }
  }

  return { phrases, tokens }
}

function teacherMatchesActivitySpecialization(
  teacherSpecializations: string[],
  activityKeywords: string[],
) {
  const teacherIndex = buildSkillIndex(teacherSpecializations)
  const activityIndex = buildSkillIndex(activityKeywords)

  if (teacherIndex.phrases.size === 0) return false

  for (const phrase of teacherIndex.phrases) {
    if (activityIndex.phrases.has(phrase)) return true
  }

  for (const token of teacherIndex.tokens) {
    if (activityIndex.tokens.has(token)) return true
  }

  return false
}

async function getLatestSessionIssuesMap(bookingIds: string[]) {
  if (bookingIds.length === 0) return new Map<string, typeof schema.sessionIssues.$inferSelect>()

  const rows = await db
    .select()
    .from(schema.sessionIssues)
    .where(inArray(schema.sessionIssues.bookingId, bookingIds))
    .orderBy(desc(schema.sessionIssues.reportedAt), desc(schema.sessionIssues.createdAt))

  const map = new Map<string, typeof schema.sessionIssues.$inferSelect>()
  for (const row of rows) {
    if (!map.has(row.bookingId)) {
      map.set(row.bookingId, row)
    }
  }

  return map
}

async function createAdminAuditLog(input: {
  action: string
  entityType: string
  entityId?: string | null
  before?: unknown
  after?: unknown
}) {
  await db.insert(schema.auditLogs).values({
    actorRole: 'admin',
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    before: input.before ?? null,
    after: input.after ?? null,
  })
}

async function createUserNotification(input: {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
}) {
  await db.insert(schema.notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data ?? null,
  })
}

function getIssueNextAction(status: 'reported' | 'reviewing' | 'resolved', resolution: 'none' | 'refund' | 'credit' | 'support_only') {
  if (status === 'resolved') {
    if (resolution === 'refund') return 'Refund approved and being processed.'
    if (resolution === 'credit') return 'Beam credit has been applied to your account.'
    if (resolution === 'support_only') return 'Support has shared the final resolution for this case.'
    return 'This case has been resolved.'
  }

  if (status === 'reviewing') {
    return 'Beam ops is reviewing the details and will update you in the app.'
  }

  return 'Your case has been submitted and is waiting for Beam review.'
}

function buildAdminCaseReference() {
  const stamp = Date.now().toString(36).slice(-6).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CASE-${stamp}${random}`
}

export async function adminRoutes(fastify: FastifyInstance) {
  const teacherUsers = aliasedTable(schema.users, 'teacher_users')

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
        .where(or(eq(schema.bookings.status, 'pending'), eq(schema.bookings.status, 'confirmed'), eq(schema.bookings.status, 'in_progress'))),

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
    if (req.query.city) {
      conditions.push(ilike(schema.users.city, `%${req.query.city}%`))
    }
    if (req.query.search) {
      const q = `%${req.query.search}%`
      conditions.push(
        or(
          ilike(schema.users.firstName, q),
          ilike(schema.users.lastName, q),
          ilike(schema.activities.title, q),
          ilike(schema.children.firstName, q),
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
        confirmedAt: schema.bookings.confirmedAt,
        completedAt: schema.bookings.completedAt,
        teacherOtpVerifiedAt: schema.bookings.teacherOtpVerifiedAt,
        payoutReleasedAt: schema.bookings.payoutReleasedAt,
        createdAt: schema.bookings.createdAt,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        parentCity: schema.users.city,
        activityTitle: schema.activities.title,
        childFirstName: schema.children.firstName,
        reviewId: schema.reviews.id,
        feedbackRating: schema.reviews.rating,
        feedbackComment: schema.reviews.comment,
        teacher: sql<string | null>`nullif(trim(coalesce(${teacherUsers.firstName}, '') || ' ' || coalesce(${teacherUsers.lastName}, '')), '')`,
        paymentStatus: schema.payments.status,
      })
        .from(schema.bookings)
        .leftJoin(schema.users, eq(schema.bookings.parentId, schema.users.id))
        .leftJoin(teacherUsers, eq(schema.bookings.teacherId, teacherUsers.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
        .leftJoin(schema.payments, eq(schema.bookings.id, schema.payments.bookingId))
        .leftJoin(schema.reviews, eq(schema.bookings.id, schema.reviews.bookingId))
        .where(where)
        .orderBy(desc(schema.bookings.createdAt))
        .limit(limit)
        .offset(offset),

      db.select({ count: count() })
        .from(schema.bookings)
        .leftJoin(schema.users, eq(schema.bookings.parentId, schema.users.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
        .leftJoin(schema.children, eq(schema.bookings.childId, schema.children.id))
        .where(where),
    ])

    const latestIssues = await getLatestSessionIssuesMap(items.map((item) => item.id))

    return reply.send({
      items: items.map((item) => {
        const latestIssue = latestIssues.get(item.id)
        return {
          ...item,
          issueReported: !!latestIssue,
          issueStatus: latestIssue?.status ?? null,
          issueResolution: latestIssue?.resolution ?? null,
          issueType: latestIssue?.issueType ?? null,
          feedbackSubmitted: !!item.reviewId,
          feedbackRating: item.feedbackRating ?? null,
          feedbackComment: item.feedbackComment ?? null,
        }
      }),
      total: totalResult[0].count,
      page,
      limit,
    })
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

    const latestIssue = await db.query.sessionIssues.findFirst({
      where: eq(schema.sessionIssues.bookingId, req.params.id),
      orderBy: [desc(schema.sessionIssues.reportedAt), desc(schema.sessionIssues.createdAt)],
    })

    const payout = await db.query.payouts.findFirst({
      where: sql`${schema.payouts.bookingIds} @> ARRAY[${req.params.id}]::uuid[]`,
    })

    return reply.send({ ...booking, teacher, payout, latestIssue })
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
        deliveryMode: schema.activities.deliveryMode,
        venueType: schema.activities.venueType,
        activityFormat: schema.activities.activityFormat,
        trialAvailable: schema.activities.trialAvailable,
        sessionDurationMins: schema.activities.sessionDurationMins,
        pricePerSession: schema.activities.pricePerSession,
        imageUrl: schema.activities.imageUrl,
        tags: schema.activities.tags,
        locality: schema.activities.locality,
        city: schema.activities.city,
        parentValue: schema.activities.parentValue,
        sessionFlow: schema.activities.sessionFlow,
        parentWaitingPolicy: schema.activities.parentWaitingPolicy,
        accessibilityNotes: schema.activities.accessibilityNotes,
        whatToBring: schema.activities.whatToBring,
        cancellationPolicy: schema.activities.cancellationPolicy,
        createdAt: schema.activities.createdAt,
        categoryName: schema.categories.name,
        categoryColor: schema.categories.color,
        totalBookings: sql<number>`(select count(*) from bookings where activity_id = ${schema.activities.id})`,
        avgRating: sql<number>`(select coalesce(avg(rating), 0) from reviews where activity_id = ${schema.activities.id})`,
        teacherCount: sql<number>`(select count(distinct teacher_id) from slots where activity_id = ${schema.activities.id})`,
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

    const [childRows, bookingRows, spendResult, totalBookingsResult] = await Promise.all([
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

      db.select({ count: count() })
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
      role: user.role,
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
      totalBookings: totalBookingsResult[0]?.count ?? 0,
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
    if (req.query.search) {
      const q = `%${req.query.search}%`
      conditions.push(or(
        ilike(schema.users.firstName, q),
        ilike(schema.users.lastName, q),
        ilike(schema.activities.title, q),
        ilike(schema.payments.gatewayPaymentId, q),
      )!)
    }

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
        bookingStatus: schema.bookings.status,
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
    Querystring: { minRating?: string; maxRating?: string; flagged?: string; search?: string }
  }>('/admin/reviews', async (req, reply) => {
    const conditions: SQL<unknown>[] = []
    if (req.query.minRating) {
      conditions.push(gte(schema.reviews.rating, Number(req.query.minRating)))
    }
    if (req.query.maxRating) {
      conditions.push(lte(schema.reviews.rating, Number(req.query.maxRating)))
    }
    if (req.query.flagged === 'true') {
      conditions.push(eq(schema.reviews.isFlagged, true))
    }
    if (req.query.search) {
      const q = `%${req.query.search}%`
      conditions.push(or(
        ilike(schema.users.firstName, q),
        ilike(schema.users.lastName, q),
        ilike(schema.activities.title, q),
        ilike(schema.reviews.comment, q),
      )!)
    }

    const reviewTeachers = aliasedTable(schema.users, 'review_teachers')

    const items = await db.select({
      id: schema.reviews.id,
      rating: schema.reviews.rating,
      comment: schema.reviews.comment,
      isFlagged: schema.reviews.isFlagged,
      createdAt: schema.reviews.createdAt,
      teacherFirstName: reviewTeachers.firstName,
      teacherLastName: reviewTeachers.lastName,
      parentFirstName: schema.users.firstName,
      parentLastName: schema.users.lastName,
      activityTitle: schema.activities.title,
      bookingId: schema.reviews.bookingId,
    })
      .from(schema.reviews)
      .leftJoin(schema.users, eq(schema.reviews.parentId, schema.users.id))
      .leftJoin(reviewTeachers, eq(schema.reviews.teacherId, reviewTeachers.id))
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

  fastify.patch<{ Params: { id: string }; Body: { flagged: boolean } }>(
    '/admin/reviews/:id/flag',
    async (req, reply) => {
      const review = await db.query.reviews.findFirst({
        where: eq(schema.reviews.id, req.params.id),
      })
      if (!review) return reply.status(404).send({ error: 'Review not found' })

      const [updated] = await db
        .update(schema.reviews)
        .set({ isFlagged: req.body.flagged, updatedAt: new Date() })
        .where(eq(schema.reviews.id, req.params.id))
        .returning()

      await createAdminAuditLog({
        action: req.body.flagged ? 'review.flagged' : 'review.unflagged',
        entityType: 'review',
        entityId: updated.id,
        before: review,
        after: updated,
      })

      return reply.send({ ok: true, review: updated })
    }
  )

  fastify.post<{
    Params: { id: string }
    Body: {
      issueType?: 'no_show' | 'venue_issue' | 'safety_issue' | 'schedule_issue' | 'other'
      resolution?: 'none' | 'refund' | 'credit' | 'support_only'
      description?: string
    }
  }>('/admin/reviews/:id/escalate', async (req, reply) => {
    const review = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, req.params.id),
    })
    if (!review) return reply.status(404).send({ error: 'Review not found' })

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, review.bookingId),
    })
    if (!booking) return reply.status(404).send({ error: 'Booking not found for review' })

    const existingIssue = await db.query.sessionIssues.findFirst({
      where: eq(schema.sessionIssues.bookingId, review.bookingId),
      orderBy: [desc(schema.sessionIssues.reportedAt), desc(schema.sessionIssues.createdAt)],
    })

    let issue: typeof schema.sessionIssues.$inferSelect

    if (existingIssue && existingIssue.status !== 'resolved') {
      const [updatedIssue] = await db
        .update(schema.sessionIssues)
        .set({
          status: 'reviewing',
          resolution: req.body.resolution ?? existingIssue.resolution,
          description: req.body.description ?? existingIssue.description,
          desiredOutcome:
            req.body.resolution === 'refund'
              ? 'refund'
              : req.body.resolution === 'credit'
                ? 'credit'
                : existingIssue.desiredOutcome,
          nextAction: getIssueNextAction('reviewing', req.body.resolution ?? existingIssue.resolution),
          updatedAt: new Date(),
        })
        .where(eq(schema.sessionIssues.id, existingIssue.id))
        .returning()
      issue = updatedIssue
    } else {
      const [createdIssue] = await db
        .insert(schema.sessionIssues)
        .values({
          bookingId: review.bookingId,
          parentId: review.parentId,
          teacherId: review.teacherId,
          caseReference: buildAdminCaseReference(),
          issueType: req.body.issueType ?? 'other',
          description: req.body.description ?? review.comment ?? 'Escalated from admin review queue',
          status: 'reviewing',
          resolution: req.body.resolution ?? 'support_only',
          desiredOutcome:
            req.body.resolution === 'refund'
              ? 'refund'
              : req.body.resolution === 'credit'
                ? 'credit'
                : 'support',
          nextAction: getIssueNextAction('reviewing', req.body.resolution ?? 'support_only'),
          slaTargetAt: new Date(new Date().setHours(18, 0, 0, 0)),
        })
        .returning()
      issue = createdIssue
    }

    const [updatedReview] = await db
      .update(schema.reviews)
      .set({ isFlagged: true, updatedAt: new Date() })
      .where(eq(schema.reviews.id, req.params.id))
      .returning()

    await createAdminAuditLog({
      action: 'review.escalated',
      entityType: 'review',
      entityId: updatedReview.id,
      before: review,
      after: { review: updatedReview, sessionIssueId: issue.id },
    })

    await createUserNotification({
      userId: review.parentId,
      type: 'review.escalated',
      title: 'Support is reviewing your feedback',
      body: 'A Beam admin has opened a support review for your session feedback.',
      data: { bookingId: review.bookingId, reviewId: review.id, sessionIssueId: issue.id },
    })

    return reply.send({ ok: true, review: updatedReview, issue })
  })

  fastify.patch<{
    Params: { id: string }
    Body: {
      status?: 'reported' | 'reviewing' | 'resolved'
      resolution?: 'none' | 'refund' | 'credit' | 'support_only'
      description?: string
    }
  }>('/admin/session-issues/:id', async (req, reply) => {
    const issue = await db.query.sessionIssues.findFirst({
      where: eq(schema.sessionIssues.id, req.params.id),
    })
    if (!issue) return reply.status(404).send({ error: 'Session issue not found' })

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, issue.bookingId),
    })

    const now = new Date()
    const nextStatus = req.body.status ?? issue.status
    const nextResolution = req.body.resolution ?? issue.resolution

    const [updatedIssue] = await db
      .update(schema.sessionIssues)
      .set({
        status: nextStatus,
        resolution: nextResolution,
        desiredOutcome:
          nextResolution === 'refund'
            ? 'refund'
            : nextResolution === 'credit'
              ? 'credit'
              : issue.desiredOutcome,
        description: req.body.description ?? issue.description,
        nextAction: getIssueNextAction(nextStatus, nextResolution),
        resolvedAt: nextStatus === 'resolved' ? now : null,
        updatedAt: now,
      })
      .where(eq(schema.sessionIssues.id, req.params.id))
      .returning()

    let refundedPayment: typeof schema.payments.$inferSelect | null = null
    if (nextStatus === 'resolved' && nextResolution === 'refund') {
      const payment = await db.query.payments.findFirst({
        where: eq(schema.payments.bookingId, issue.bookingId),
      })

      if (payment && payment.status === 'success') {
        const [updatedPayment] = await db
          .update(schema.payments)
          .set({ status: 'refunded', refundedAt: now, updatedAt: now })
          .where(eq(schema.payments.id, payment.id))
          .returning()
        refundedPayment = updatedPayment

        await createAdminAuditLog({
          action: 'payment.refunded_via_issue',
          entityType: 'payment',
          entityId: updatedPayment.id,
          before: payment,
          after: updatedPayment,
        })
      }
    }

    await createAdminAuditLog({
      action: 'session_issue.updated',
      entityType: 'session_issue',
      entityId: updatedIssue.id,
      before: issue,
      after: updatedIssue,
    })

    if (booking?.parentId) {
      const resolutionCopy =
        nextStatus === 'resolved'
          ? nextResolution === 'refund'
            ? 'We have resolved your issue and processed the refund.'
            : nextResolution === 'credit'
              ? 'We have resolved your issue and applied support credit.'
              : 'We have resolved your issue and updated the support case.'
          : 'A Beam admin is reviewing your reported issue.'

      await createUserNotification({
        userId: booking.parentId,
        type: 'session_issue.updated',
        title: nextStatus === 'resolved' ? 'Issue resolved' : 'Issue under review',
        body: resolutionCopy,
        data: { bookingId: issue.bookingId, sessionIssueId: updatedIssue.id, resolution: nextResolution, status: nextStatus },
      })
    }

    return reply.send({ ok: true, issue: updatedIssue, payment: refundedPayment })
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
        deliveryMode: schema.activities.deliveryMode,
        venueType: schema.activities.venueType,
        activityFormat: schema.activities.activityFormat,
        trialAvailable: schema.activities.trialAvailable,
        sessionDurationMins: schema.activities.sessionDurationMins,
        minChildren: schema.activities.minChildren,
        maxChildren: schema.activities.maxChildren,
        pricePerSession: schema.activities.pricePerSession,
        imageUrl: schema.activities.imageUrl,
        tags: schema.activities.tags,
        materialsNeeded: schema.activities.materialsNeeded,
        preparationNotes: schema.activities.preparationNotes,
        locality: schema.activities.locality,
        city: schema.activities.city,
        parentValue: schema.activities.parentValue,
        sessionFlow: schema.activities.sessionFlow,
        parentWaitingPolicy: schema.activities.parentWaitingPolicy,
        accessibilityNotes: schema.activities.accessibilityNotes,
        whatToBring: schema.activities.whatToBring,
        cancellationPolicy: schema.activities.cancellationPolicy,
        createdAt: schema.activities.createdAt,
        categoryName: schema.categories.name,
        totalBookings: sql<number>`(select count(*) from bookings where activity_id = ${schema.activities.id})`,
        avgRating: sql<number>`(select coalesce(avg(rating), 0) from reviews where activity_id = ${schema.activities.id})`,
        teacherCount: sql<number>`(select count(distinct teacher_id) from slots where activity_id = ${schema.activities.id})`,
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
      materialsNeeded, preparationNotes, status, deliveryMode, venueType,
      activityFormat, trialAvailable, locality, city, parentValue, sessionFlow,
      parentWaitingPolicy, accessibilityNotes, whatToBring, cancellationPolicy,
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
        ...(deliveryMode !== undefined && { deliveryMode: deliveryMode as 'at_home' | 'online' }),
        ...(venueType !== undefined && { venueType: venueType as 'indoor' | 'outdoor' | 'online' | 'at_home' }),
        ...(activityFormat !== undefined && { activityFormat: activityFormat as 'trial' | 'one_time' | 'recurring' }),
        ...(trialAvailable !== undefined && { trialAvailable: Boolean(trialAvailable) }),
        ...(sessionDurationMins !== undefined && { sessionDurationMins: Number(sessionDurationMins) }),
        ...(minChildren !== undefined && { minChildren: Number(minChildren) }),
        ...(maxChildren !== undefined && { maxChildren: Number(maxChildren) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl ? String(imageUrl) : null }),
        ...(tags !== undefined && { tags: Array.isArray(tags) ? tags as string[] : (typeof tags === 'string' && tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []) }),
        ...(materialsNeeded !== undefined && { materialsNeeded: materialsNeeded ? String(materialsNeeded) : null }),
        ...(preparationNotes !== undefined && { preparationNotes: preparationNotes ? String(preparationNotes) : null }),
        ...(locality !== undefined && { locality: locality ? String(locality) : null }),
        ...(city !== undefined && { city: city ? String(city) : null }),
        ...(parentValue !== undefined && { parentValue: parentValue ? String(parentValue) : null }),
        ...(sessionFlow !== undefined && { sessionFlow: sessionFlow ? String(sessionFlow) : null }),
        ...(parentWaitingPolicy !== undefined && { parentWaitingPolicy: parentWaitingPolicy ? String(parentWaitingPolicy) : null }),
        ...(accessibilityNotes !== undefined && { accessibilityNotes: accessibilityNotes ? String(accessibilityNotes) : null }),
        ...(whatToBring !== undefined && { whatToBring: whatToBring ? String(whatToBring) : null }),
        ...(cancellationPolicy !== undefined && { cancellationPolicy: cancellationPolicy ? String(cancellationPolicy) : null }),
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
      deliveryMode, venueType, activityFormat, trialAvailable, locality, city,
      parentValue, sessionFlow, parentWaitingPolicy, accessibilityNotes,
      whatToBring, cancellationPolicy,
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
      deliveryMode: (deliveryMode as 'at_home' | 'online') ?? 'at_home',
      venueType: (venueType as 'indoor' | 'outdoor' | 'online' | 'at_home') ?? 'at_home',
      activityFormat: (activityFormat as 'trial' | 'one_time' | 'recurring') ?? 'one_time',
      trialAvailable: Boolean(trialAvailable),
      minChildren: minChildren ? Number(minChildren) : 1,
      maxChildren: maxChildren ? Number(maxChildren) : 1,
      sessionDurationMins: sessionDurationMins ? Number(sessionDurationMins) : 60,
      pricePerSession: String(pricePerSession),
      imageUrl: imageUrl ? String(imageUrl) : null,
      tags: Array.isArray(tags) ? tags as string[] : (typeof tags === 'string' && tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      materialsNeeded: materialsNeeded ? String(materialsNeeded) : null,
      preparationNotes: preparationNotes ? String(preparationNotes) : null,
      locality: locality ? String(locality) : null,
      city: city ? String(city) : null,
      parentValue: parentValue ? String(parentValue) : null,
      sessionFlow: sessionFlow ? String(sessionFlow) : null,
      parentWaitingPolicy: parentWaitingPolicy ? String(parentWaitingPolicy) : null,
      accessibilityNotes: accessibilityNotes ? String(accessibilityNotes) : null,
      whatToBring: whatToBring ? String(whatToBring) : null,
      cancellationPolicy: cancellationPolicy ? String(cancellationPolicy) : null,
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
      teacherId: schema.slots.teacherId,
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

    if (startTime >= endTime) {
      return reply.status(422).send({ error: 'endTime must be after startTime' })
    }

    const [activityRows, teacherRows] = await Promise.all([
      db.select({
        id: schema.activities.id,
        title: schema.activities.title,
        sessionDurationMins: schema.activities.sessionDurationMins,
        tags: schema.activities.tags,
        categoryName: schema.categories.name,
      })
        .from(schema.activities)
        .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
        .where(eq(schema.activities.id, activityId))
        .limit(1),
      db.select({
        id: schema.users.id,
        verificationStatus: schema.teachers.verificationStatus,
        specializations: schema.teachers.specializations,
      })
        .from(schema.users)
        .innerJoin(schema.teachers, eq(schema.teachers.userId, schema.users.id))
        .where(eq(schema.users.id, teacherId))
        .limit(1),
    ])

    const activity = activityRows[0]
    const teacher = teacherRows[0]

    if (!activity) return reply.status(404).send({ error: 'Activity not found' })
    if (!teacher) return reply.status(404).send({ error: 'Teacher not found' })

    const startMinutes = parseTimeToMinutes(startTime)
    const endMinutes = parseTimeToMinutes(endTime)
    const slotDurationMinutes = endMinutes - startMinutes
    const minSlotDuration = activity.sessionDurationMins
    const maxSlotDuration = activity.sessionDurationMins * 2

    if (date === getTodayDateString()) {
      const now = new Date()
      const currentMinutes = now.getHours() * 60 + now.getMinutes()
      if (startMinutes <= currentMinutes) {
        return reply.status(422).send({ error: 'Start time must be after the current time' })
      }
    }

    if (slotDurationMinutes < minSlotDuration) {
      return reply.status(422).send({ error: `Slot duration must be at least ${minSlotDuration} minutes` })
    }

    if (slotDurationMinutes > maxSlotDuration) {
      return reply.status(422).send({ error: `Slot duration cannot be more than ${maxSlotDuration} minutes` })
    }

    const allowedDurations = SLOT_DURATION_OPTIONS.filter((duration) =>
      duration >= minSlotDuration && duration <= maxSlotDuration,
    )

    if (!allowedDurations.includes(slotDurationMinutes)) {
      return reply.status(422).send({
        error: `Slot duration must be one of: ${allowedDurations.join(', ')} minutes`,
      })
    }

    const activityKeywords = [
      activity.title,
      activity.categoryName ?? '',
      ...(activity.tags ?? []),
    ]

    if (!teacherMatchesActivitySpecialization(teacher.specializations ?? [], activityKeywords)) {
      return reply.status(422).send({ error: 'Teacher specializations do not match this activity' })
    }

    const existingDuplicate = await db.select({ id: schema.slots.id })
      .from(schema.slots)
      .where(and(
        eq(schema.slots.activityId, activityId),
        eq(schema.slots.teacherId, teacherId),
        eq(schema.slots.date, date),
        eq(schema.slots.startTime, startTime),
        eq(schema.slots.endTime, endTime),
      ))
      .limit(1)

    if (existingDuplicate.length > 0) {
      return reply.status(409).send({ error: 'This teacher already has the same slot for this activity' })
    }

    const [slot] = await db.insert(schema.slots).values({
      activityId,
      teacherId,
      date,
      startTime,
      endTime,
      isAvailable: true,
    }).returning()

    await syncConflictingTeacherSlots(db, { teacherId, date, startTime, endTime })

    const [freshSlot] = await db.select()
      .from(schema.slots)
      .where(eq(schema.slots.id, slot.id))
      .limit(1)

    return reply.status(201).send(freshSlot ?? slot)
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

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, bookingId),
    })

    const [updated] = await db
      .update(schema.payments)
      .set({ status: 'refunded', refundedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.payments.bookingId, bookingId))
      .returning()

    await createAdminAuditLog({
      action: 'payment.refunded',
      entityType: 'payment',
      entityId: updated.id,
      before: payment,
      after: updated,
    })

    if (booking?.parentId) {
      await createUserNotification({
        userId: booking.parentId,
        type: 'payment.refunded',
        title: 'Refund processed',
        body: 'Your Beam booking refund has been processed.',
        data: { bookingId, paymentId: updated.id },
      })
    }

    return reply.send({ ok: true, payment: updated })
  })

  fastify.post<{ Params: { bookingId: string } }>('/admin/payments/:bookingId/retry', async (req, reply) => {
    const { bookingId } = req.params

    const payment = await db.query.payments.findFirst({
      where: eq(schema.payments.bookingId, bookingId),
    })
    if (!payment) return reply.status(404).send({ error: 'Payment not found' })
    if (payment.status !== 'failed') return reply.status(422).send({ error: 'Only failed payments can be retried' })

    const booking = await db.query.bookings.findFirst({
      where: eq(schema.bookings.id, bookingId),
    })

    const [updated] = await db
      .update(schema.payments)
      .set({ status: 'pending', updatedAt: new Date() })
      .where(eq(schema.payments.bookingId, bookingId))
      .returning()

    await createAdminAuditLog({
      action: 'payment.retry_requested',
      entityType: 'payment',
      entityId: updated.id,
      before: payment,
      after: updated,
    })

    if (booking?.parentId) {
      await createUserNotification({
        userId: booking.parentId,
        type: 'payment.retry_requested',
        title: 'Payment retry initiated',
        body: 'We have reopened your payment so it can be completed again.',
        data: { bookingId, paymentId: updated.id },
      })
    }

    return reply.send({ ok: true, payment: updated })
  })

  fastify.patch<{ Params: { id: string }; Body: { action: 'dispatch' | 'settle' | 'retry' } }>(
    '/admin/payouts/:id',
    async (req, reply) => {
      const payout = await db.query.payouts.findFirst({
        where: eq(schema.payouts.id, req.params.id),
      })
      if (!payout) return reply.status(404).send({ error: 'Payout not found' })

      const { action } = req.body
      const now = new Date()
      let nextValues: Partial<typeof schema.payouts.$inferInsert> | null = null

      if (action === 'dispatch') {
        if (payout.status !== 'queued') return reply.status(422).send({ error: 'Only queued payouts can be dispatched' })
        nextValues = { status: 'dispatched', scheduledAt: payout.scheduledAt ?? now }
      } else if (action === 'settle') {
        if (payout.status !== 'dispatched') return reply.status(422).send({ error: 'Only dispatched payouts can be settled' })
        nextValues = { status: 'settled', settledAt: now }
      } else if (action === 'retry') {
        if (payout.status !== 'failed') return reply.status(422).send({ error: 'Only failed payouts can be retried' })
        nextValues = { status: 'queued', settledAt: null, scheduledAt: now }
      }

      if (!nextValues) return reply.status(400).send({ error: 'Invalid payout action' })

      const [updated] = await db
        .update(schema.payouts)
        .set(nextValues)
        .where(eq(schema.payouts.id, req.params.id))
        .returning()

      await createAdminAuditLog({
        action: `payout.${action}`,
        entityType: 'payout',
        entityId: updated.id,
        before: payout,
        after: updated,
      })

      await createUserNotification({
        userId: payout.teacherId,
        type: `payout.${action}`,
        title: action === 'settle' ? 'Payout settled' : action === 'dispatch' ? 'Payout dispatched' : 'Payout re-queued',
        body:
          action === 'settle'
            ? 'Your Beam payout has been settled.'
            : action === 'dispatch'
              ? 'Your Beam payout has been dispatched.'
              : 'Your Beam payout has been re-queued for processing.',
        data: { payoutId: updated.id, action },
      })

      return reply.send({ ok: true, payout: updated })
    }
  )

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

      const existing = await db.query.bookings.findFirst({
        where: eq(schema.bookings.id, id),
      })
      if (!existing) return reply.status(404).send({ error: 'Booking not found' })

      const [booking] = await db
        .update(schema.bookings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(schema.bookings.id, id))
        .returning()

      const payment = await db.query.payments.findFirst({
        where: eq(schema.payments.bookingId, id),
      })

      if (existing.slotId) {
        const slot = await db.query.slots.findFirst({ where: eq(schema.slots.id, existing.slotId) })
        if (slot) {
          await syncConflictingTeacherSlots(db, {
            teacherId: slot.teacherId,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })
        }
      }

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

    const [refundRows, issueRows, qualityRows, billingRows] = await Promise.all([
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

      // Session issues — no-show / quality / resolution requests
      filterType && !['no_show', 'quality', 'refund'].includes(filterType) ? [] : db.select({
        sourceId: schema.sessionIssues.id,
        bookingId: schema.sessionIssues.bookingId,
        amount: schema.payments.amount,
        parentFirstName: schema.users.firstName,
        parentLastName: schema.users.lastName,
        activityTitle: schema.activities.title,
        createdAt: schema.sessionIssues.reportedAt,
        issueType: schema.sessionIssues.issueType,
        issueStatus: schema.sessionIssues.status,
        issueResolution: schema.sessionIssues.resolution,
        issueDescription: schema.sessionIssues.description,
      })
        .from(schema.sessionIssues)
        .leftJoin(schema.bookings, eq(schema.sessionIssues.bookingId, schema.bookings.id))
        .leftJoin(schema.payments, eq(schema.bookings.id, schema.payments.bookingId))
        .leftJoin(schema.users, eq(schema.sessionIssues.parentId, schema.users.id))
        .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id)),

      // Quality disputes — flagged reviews
      filterType && filterType !== 'quality' ? [] : db.select({
        sourceId: schema.reviews.id,
        bookingId: schema.reviews.bookingId,
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
        bookingId: schema.payments.bookingId,
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
      amount: number; parentName: string; activityTitle: string; createdAt: Date | string | null; note?: string | null;
      sourceType: 'booking' | 'session_issue' | 'review' | 'payment'; sourceId: string; bookingId?: string | null
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
        sourceType: type === 'billing' ? 'payment' : 'booking',
        sourceId: row.sourceId,
        bookingId: type === 'billing' ? null : row.sourceId,
      }
    }

    const toIssueDispute = (row: (typeof issueRows)[0]): DisputeRow => {
      const mappedType =
        row.issueType === 'no_show'
          ? 'no_show'
          : row.issueResolution === 'refund'
            ? 'refund'
            : 'quality'
      const amount = Number(row.amount ?? 0)
      return {
        id: `${mappedType[0].toUpperCase()}-${row.sourceId.slice(0, 8).toUpperCase()}`,
        type: mappedType,
        status:
          row.issueStatus === 'reviewing'
            ? 'under_review'
            : row.issueStatus === 'resolved'
              ? 'resolved'
              : 'open',
        priority:
          row.issueType === 'safety_issue' || row.issueType === 'no_show'
            ? 'high'
            : amount > 500
              ? 'high'
              : amount > 200
                ? 'medium'
                : 'low',
        amount,
        parentName: `${row.parentFirstName ?? ''} ${row.parentLastName ?? ''}`.trim(),
        activityTitle: row.activityTitle ?? '',
        createdAt: row.createdAt,
        note: row.issueDescription ?? null,
        sourceType: 'session_issue',
        sourceId: row.sourceId,
        bookingId: row.bookingId,
      }
    }

    let all: DisputeRow[] = [
      ...refundRows.map(r => toDispute(r as any, 'refund')),
      ...issueRows
        .map((r) => toIssueDispute(r as any))
        .filter((item) => !filterType || filterType === item.type),
      ...qualityRows.map(r => ({ ...toDispute(r as any, 'quality'), sourceType: 'review' as const, bookingId: (r as any).bookingId ?? null })),
      ...billingRows.map(r => ({ ...toDispute(r as any, 'billing'), sourceType: 'payment' as const, bookingId: (r as any).bookingId ?? null })),
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
    const underReview = all.filter(d => d.status === 'under_review').length
    const highPriority = all.filter(d => d.priority === 'high').length
    const refundAtRisk = refundRows.reduce((s, r) => s + Number((r as any).amount ?? 0), 0)

    return reply.send({
      items,
      total,
      page,
      limit,
      kpis: { open, underReview, highPriority, refundAtRisk },
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
