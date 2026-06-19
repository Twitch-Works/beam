import type { FastifyInstance } from 'fastify'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { eq, and, ilike, or, desc, count, avg, gte, lte, sql } from 'drizzle-orm'

const APP_MODE = process.env.APP_MODE ?? process.env.NODE_ENV ?? 'development'
const MIN_BOOKING_HOURS = APP_MODE === 'development' ? 0 : 24
const MAX_BOOKING_HOURS = 24 * 15

function parseSlotDateTime(slot: { date: string; startTime: string }) {
  return new Date(`${slot.date}T${slot.startTime}`)
}

function getHoursUntil(date: Date) {
  return (date.getTime() - Date.now()) / (1000 * 60 * 60)
}

function isBookableSlot(slot: { date: string; startTime: string }) {
  const hoursUntil = getHoursUntil(parseSlotDateTime(slot))
  return hoursUntil >= MIN_BOOKING_HOURS && hoursUntil <= MAX_BOOKING_HOURS
}

// Haversine distance in km between two lat/lng points
function haversineExpr(lat: number, lng: number) {
  return sql<number>`
    6371 * 2 * ASIN(SQRT(
      POWER(SIN((RADIANS(${schema.activities.latitude}) - RADIANS(${lat})) / 2), 2)
      + COS(RADIANS(${lat})) * COS(RADIANS(${schema.activities.latitude}))
      * POWER(SIN((RADIANS(${schema.activities.longitude}) - RADIANS(${lng})) / 2), 2)
    ))
  `
}

export async function catalogRoutes(fastify: FastifyInstance) {
  // GET /activities — public catalog listing
  fastify.get<{
    Querystring: { category?: string; ageGroup?: string; search?: string; page?: string; limit?: string; lat?: string; lng?: string; radiusKm?: string }
  }>('/activities', async (req, reply) => {
    const { category, ageGroup, search, page = '1', limit = '20', lat, lng, radiusKm = '10' } = req.query
    const pageNum  = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, parseInt(limit) || 20)
    const offset   = (pageNum - 1) * limitNum

    const useLocation = lat != null && lng != null
    const latNum  = useLocation ? parseFloat(lat!) : 0
    const lngNum  = useLocation ? parseFloat(lng!) : 0
    const radiusNum = parseFloat(radiusKm)

    const conditions = [eq(schema.activities.status, 'published')]
    if (ageGroup)  conditions.push(ilike(schema.activities.ageGroup, `%${ageGroup}%`))
    if (search) {
      conditions.push(or(
        ilike(schema.activities.title, `%${search}%`),
        ilike(schema.activities.description, `%${search}%`),
      )!)
    }
    if (useLocation) {
      conditions.push(sql`
        ${schema.activities.latitude} IS NOT NULL
        AND ${schema.activities.longitude} IS NOT NULL
        AND ${haversineExpr(latNum, lngNum)} <= ${radiusNum}
      `)
    }

    const distanceCol = useLocation
      ? haversineExpr(latNum, lngNum)
      : sql<number | null>`NULL`

    const rows = await db
      .select({
        id:                  schema.activities.id,
        title:               schema.activities.title,
        description:         schema.activities.description,
        ageGroup:            schema.activities.ageGroup,
        sessionType:         schema.activities.sessionType,
        sessionDurationMins: schema.activities.sessionDurationMins,
        pricePerSession:     schema.activities.pricePerSession,
        imageUrl:            schema.activities.imageUrl,
        tags:                schema.activities.tags,
        categoryId:          schema.activities.categoryId,
        categoryName:        schema.categories.name,
        categoryColor:       schema.categories.color,
        totalBookings:       count(schema.bookings.id),
        avgRating:           avg(schema.reviews.rating),
        distanceKm:          distanceCol,
      })
      .from(schema.activities)
      .leftJoin(schema.categories,  eq(schema.activities.categoryId, schema.categories.id))
      .leftJoin(schema.bookings,    eq(schema.activities.id, schema.bookings.activityId))
      .leftJoin(schema.reviews,     eq(schema.activities.id, schema.reviews.activityId))
      .where(and(...conditions))
      .groupBy(
        schema.activities.id,
        schema.categories.id,
        schema.categories.name,
        schema.categories.color,
      )
      .orderBy(useLocation ? distanceCol : desc(schema.activities.createdAt))
      .limit(limitNum)
      .offset(offset)

    // Category filter applied in JS after groupBy to avoid complex sub-query
    const filtered = category
      ? rows.filter(r => r.categoryName?.toLowerCase() === category.toLowerCase())
      : rows

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.activities)
      .where(and(...conditions))

    return reply.send({
      items: filtered,
      total: Number(total),
      page: pageNum,
      limit: limitNum,
    })
  })

  // GET /activities/:id — single activity detail
  fastify.get<{ Params: { id: string } }>('/activities/:id', async (req, reply) => {
    const { id } = req.params

    const activity = await db.query.activities.findFirst({
      where: eq(schema.activities.id, id),
      with: { category: true },
    })

    if (!activity) return reply.status(404).send({ error: 'Activity not found' })

    const [ratingRow] = await db
      .select({ avgRating: avg(schema.reviews.rating), reviewCount: count(schema.reviews.id) })
      .from(schema.reviews)
      .where(eq(schema.reviews.activityId, id))

    const teacherRows = await db
      .select({
        id: schema.users.id,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        bio: schema.teachers.bio,
        city: schema.users.city,
        verificationStatus: schema.teachers.verificationStatus,
        specializations: schema.teachers.specializations,
      })
      .from(schema.slots)
      .innerJoin(schema.users, eq(schema.slots.teacherId, schema.users.id))
      .leftJoin(schema.teachers, eq(schema.teachers.userId, schema.users.id))
      .where(eq(schema.slots.activityId, id))
      .groupBy(
        schema.users.id,
        schema.users.firstName,
        schema.users.lastName,
        schema.users.city,
        schema.teachers.bio,
        schema.teachers.verificationStatus,
        schema.teachers.specializations,
      )
      .orderBy(schema.users.firstName, schema.users.lastName)

    const teachers = await Promise.all(
      teacherRows.map(async (teacherRow) => {
        const [{ totalSessions }] = await db
          .select({ totalSessions: count(schema.bookings.id) })
          .from(schema.bookings)
          .where(and(
            eq(schema.bookings.teacherId, teacherRow.id),
            eq(schema.bookings.status, 'completed'),
          ))

        return {
          ...teacherRow,
          specializations: teacherRow.specializations ?? [],
          verificationStatus: teacherRow.verificationStatus ?? 'pending',
          totalSessions: Number(totalSessions ?? 0),
        }
      }),
    )

    return reply.send({
      ...activity,
      avgRating:   ratingRow?.avgRating ?? null,
      reviewCount: Number(ratingRow?.reviewCount ?? 0),
      teacherId:   teachers[0]?.id ?? null,
      teachers,
    })
  })

  // GET /activities/:id/slots?from=YYYY-MM-DD&days=7
  fastify.get<{
    Params: { id: string }
    Querystring: { from?: string; days?: string; teacherId?: string }
  }>('/activities/:id/slots', async (req, reply) => {
    const { id } = req.params
    const days    = Math.min(15, parseInt(req.query.days ?? '7'))
    const fromStr = req.query.from ?? new Date().toISOString().split('T')[0]
    const { teacherId } = req.query

    const from = new Date(fromStr)
    const to   = new Date(from)
    to.setDate(to.getDate() + days - 1)
    const toStr = to.toISOString().split('T')[0]

    const rows = await db
      .select({
        id:        schema.slots.id,
        date:      schema.slots.date,
        startTime: schema.slots.startTime,
        endTime:   schema.slots.endTime,
        isAvailable: schema.slots.isAvailable,
        teacherFirstName: schema.users.firstName,
        teacherLastName:  schema.users.lastName,
      })
      .from(schema.slots)
      .leftJoin(schema.users, eq(schema.slots.teacherId, schema.users.id))
      .where(and(
        eq(schema.slots.activityId, id),
        ...(teacherId ? [eq(schema.slots.teacherId, teacherId)] : []),
        eq(schema.slots.isAvailable, true),
        gte(schema.slots.date, fromStr),
        lte(schema.slots.date, toStr),
      ))
      .orderBy(schema.slots.date, schema.slots.startTime)

    const bookableRows = rows.filter((row) => isBookableSlot({
      date: row.date as string,
      startTime: row.startTime as string,
    }))

    // Group by date
    const byDate: Record<string, typeof rows> = {}
    for (const row of bookableRows) {
      const d = row.date as string
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(row)
    }

    return reply.send({ slots: byDate, from: fromStr, to: toStr })
  })
}
