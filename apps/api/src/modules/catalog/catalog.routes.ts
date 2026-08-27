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
    Querystring: {
      category?: string
      ageGroup?: string
      search?: string
      activityFormat?: string
      venueType?: string
      trialAvailable?: string
      timeOfDay?: string
      page?: string
      limit?: string
      lat?: string
      lng?: string
      radiusKm?: string
    }
  }>('/activities', async (req, reply) => {
    const {
      category,
      ageGroup,
      search,
      activityFormat,
      venueType,
      trialAvailable,
      timeOfDay,
      page = '1',
      limit = '20',
      lat,
      lng,
      radiusKm = '10',
    } = req.query
    const pageNum  = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, parseInt(limit) || 20)
    const offset   = (pageNum - 1) * limitNum

    const useLocation = lat != null && lng != null
    const latNum  = useLocation ? parseFloat(lat!) : 0
    const lngNum  = useLocation ? parseFloat(lng!) : 0
    const radiusNum = parseFloat(radiusKm)

    const conditions = [eq(schema.activities.status, 'published')]
    if (ageGroup)  conditions.push(ilike(schema.activities.ageGroup, `%${ageGroup}%`))
    if (category) conditions.push(ilike(schema.categories.name, category))
    if (activityFormat) conditions.push(eq(schema.activities.activityFormat, activityFormat))
    if (venueType) conditions.push(eq(schema.activities.venueType, venueType))
    if (trialAvailable === 'true') conditions.push(eq(schema.activities.trialAvailable, true))
    if (search) {
      conditions.push(or(
        ilike(schema.activities.title, `%${search}%`),
        ilike(schema.activities.description, `%${search}%`),
        ilike(schema.activities.locality, `%${search}%`),
      )!)
    }
    if (useLocation) {
      conditions.push(sql`
        ${schema.activities.latitude} IS NOT NULL
        AND ${schema.activities.longitude} IS NOT NULL
        AND ${haversineExpr(latNum, lngNum)} <= ${radiusNum}
      `)
    }
    if (timeOfDay) {
      const slotTimeCondition = timeOfDay === 'morning'
        ? sql`slot.start_time < '12:00'`
        : timeOfDay === 'afternoon'
          ? sql`slot.start_time >= '12:00' AND slot.start_time < '17:00'`
          : sql`slot.start_time >= '17:00'`
      const fromStr = new Date().toISOString().split('T')[0]
      const to = new Date()
      to.setDate(to.getDate() + 7)
      const toStr = to.toISOString().split('T')[0]
      conditions.push(sql`EXISTS (
        SELECT 1 FROM slots slot
        WHERE slot.activity_id = ${schema.activities.id}
          AND slot.is_available = true
          AND slot.date >= ${fromStr}
          AND slot.date <= ${toStr}
          AND ${slotTimeCondition}
      )`)
    }

    const distanceCol = useLocation
      ? haversineExpr(latNum, lngNum)
      : sql<number | null>`NULL`
    const totalBookingsCol = sql<number>`(
      select count(*)::int from bookings booking
      where booking.activity_id = ${schema.activities.id}
    )`
    const avgRatingCol = sql<number | null>`(
      select avg(review.rating)::numeric from reviews review
      where review.activity_id = ${schema.activities.id}
    )`
    const reviewCountCol = sql<number>`(
      select count(*)::int from reviews review
      where review.activity_id = ${schema.activities.id}
    )`
    const teacherCountCol = sql<number>`(
      select count(distinct slot.teacher_id)::int from slots slot
      where slot.activity_id = ${schema.activities.id}
    )`
    const nextAvailableDateCol = sql<string | null>`(
      select slot.date from slots slot
      where slot.activity_id = ${schema.activities.id}
        and slot.is_available = true
        and (${APP_MODE === 'development'} = true or (slot.date || 'T' || slot.start_time)::timestamp >= now() + interval '24 hours')
        and (slot.date || 'T' || slot.start_time)::timestamp <= now() + interval '15 days'
      order by slot.date asc, slot.start_time asc
      limit 1
    )`
    const nextAvailableStartTimeCol = sql<string | null>`(
      select slot.start_time from slots slot
      where slot.activity_id = ${schema.activities.id}
        and slot.is_available = true
        and (${APP_MODE === 'development'} = true or (slot.date || 'T' || slot.start_time)::timestamp >= now() + interval '24 hours')
        and (slot.date || 'T' || slot.start_time)::timestamp <= now() + interval '15 days'
      order by slot.date asc, slot.start_time asc
      limit 1
    )`

    const rows = await db
      .select({
        id:                  schema.activities.id,
        title:               schema.activities.title,
        description:         schema.activities.description,
        ageGroup:            schema.activities.ageGroup,
        sessionType:         schema.activities.sessionType,
        deliveryMode:        schema.activities.deliveryMode,
        venueType:           schema.activities.venueType,
        activityFormat:      schema.activities.activityFormat,
        trialAvailable:      schema.activities.trialAvailable,
        sessionDurationMins: schema.activities.sessionDurationMins,
        pricePerSession:     schema.activities.pricePerSession,
        imageUrl:            schema.activities.imageUrl,
        tags:                schema.activities.tags,
        categoryId:          schema.activities.categoryId,
        categoryName:        schema.categories.name,
        categoryColor:       schema.categories.color,
        locality:            schema.activities.locality,
        city:                schema.activities.city,
        totalBookings:       totalBookingsCol,
        avgRating:           avgRatingCol,
        reviewCount:         reviewCountCol,
        teacherCount:        teacherCountCol,
        distanceKm:          distanceCol,
        nextAvailableDate:   nextAvailableDateCol,
        nextAvailableStartTime: nextAvailableStartTimeCol,
      })
      .from(schema.activities)
      .leftJoin(schema.categories,  eq(schema.activities.categoryId, schema.categories.id))
      .where(and(...conditions))
      .orderBy(useLocation ? distanceCol : desc(schema.activities.createdAt))
      .limit(limitNum)
      .offset(offset)

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.activities)
      .leftJoin(schema.categories, eq(schema.activities.categoryId, schema.categories.id))
      .where(and(...conditions))

    return reply.send({
      items: rows,
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
        languages: schema.teachers.languages,
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
          languages: teacherRow.languages ?? [],
          verificationStatus: teacherRow.verificationStatus ?? 'pending',
          totalSessions: Number(totalSessions ?? 0),
        }
      }),
    )

    const [teacherCountRow] = await db
      .select({ teacherCount: sql<number>`count(distinct ${schema.slots.teacherId})::int` })
      .from(schema.slots)
      .where(eq(schema.slots.activityId, id))

    const [nextSlot] = await db
      .select({
        date: schema.slots.date,
        startTime: schema.slots.startTime,
      })
      .from(schema.slots)
      .where(and(
        eq(schema.slots.activityId, id),
        eq(schema.slots.isAvailable, true),
      ))
      .orderBy(schema.slots.date, schema.slots.startTime)
      .limit(1)

    return reply.send({
      ...activity,
      avgRating:   ratingRow?.avgRating ?? null,
      reviewCount: Number(ratingRow?.reviewCount ?? 0),
      teacherCount: Number(teacherCountRow?.teacherCount ?? 0),
      teacherId:   teachers[0]?.id ?? null,
      teachers,
      nextAvailableDate: nextSlot?.date ?? null,
      nextAvailableStartTime: nextSlot?.startTime ?? null,
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
