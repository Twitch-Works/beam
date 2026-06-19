import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'
import { eq, and, desc, ilike } from 'drizzle-orm'
import beamSchemas from '@beam/schemas'

// Skill axis mapping: activity tags/category keywords → skill keys
const CATEGORY_SKILL_MAP: Record<string, string[]> = {
  art:       ['creativity'],
  craft:     ['creativity', 'motor'],
  music:     ['creativity', 'focus'],
  dance:     ['motor', 'social'],
  stem:      ['focus', 'language'],
  science:   ['focus', 'language'],
  language:  ['language'],
  reading:   ['language', 'focus'],
  sport:     ['motor', 'social'],
  yoga:      ['focus', 'motor'],
  cooking:   ['motor', 'focus'],
  social:    ['social'],
}

function deriveSkills(completedBookings: { activityTitle: string | null; tags: string[] }[]) {
  const skillTotals: Record<string, number> = { creativity: 0, motor: 0, language: 0, social: 0, focus: 0 }
  const skillCounts: Record<string, number> = { creativity: 0, motor: 0, language: 0, social: 0, focus: 0 }

  for (const booking of completedBookings) {
    const text = (booking.activityTitle ?? '').toLowerCase()
    const tags = booking.tags.map(t => t.toLowerCase())
    const allWords = [...text.split(' '), ...tags]

    for (const word of allWords) {
      for (const [keyword, skills] of Object.entries(CATEGORY_SKILL_MAP)) {
        if (word.includes(keyword)) {
          for (const skill of skills) {
            skillTotals[skill] = (skillTotals[skill] ?? 0) + 1
            skillCounts[skill] = (skillCounts[skill] ?? 0) + 1
          }
        }
      }
    }
  }

  const total = completedBookings.length
  const base = Math.min(40, total * 8)

  return {
    creativity:  Math.min(100, base + (skillTotals.creativity ?? 0) * 12),
    motor:       Math.min(100, base + (skillTotals.motor ?? 0) * 12),
    language:    Math.min(100, base + (skillTotals.language ?? 0) * 12),
    social:      Math.min(100, base + (skillTotals.social ?? 0) * 12),
    focus:       Math.min(100, base + (skillTotals.focus ?? 0) * 12),
  }
}

type Badge = { id: string; label: string; icon: string; iconColor: string; bg: string }

function deriveBadges(completedBookings: { activityTitle: string | null; sessionType: string; tags: string[] }[]): Badge[] {
  const total = completedBookings.length
  const badges: Badge[] = []

  if (total >= 1) badges.push({ id: 'explorer', label: 'Explorer', icon: 'star-outline', iconColor: '#6B48D9', bg: '#EDE9FE' })
  if (total >= 3) badges.push({ id: 'dedicated', label: 'Dedicated', icon: 'medal-outline', iconColor: '#FCB857', bg: '#FEF3C7' })
  if (total >= 5) badges.push({ id: 'focus_champ', label: 'Focus Champ', icon: 'radio-button-on-outline', iconColor: '#6B48D9', bg: '#EDE9FE' })

  const creativeSessions = completedBookings.filter(b => {
    const text = (b.activityTitle ?? '').toLowerCase() + ' ' + b.tags.join(' ').toLowerCase()
    return text.includes('art') || text.includes('craft') || text.includes('paint') || text.includes('creat')
  }).length
  if (creativeSessions >= 2) badges.push({ id: 'creative_mind', label: 'Creative Mind', icon: 'color-palette-outline', iconColor: '#FF7A59', bg: '#FFE8E2' })

  const groupSessions = completedBookings.filter(b => b.sessionType === 'group').length
  if (groupSessions >= 2) badges.push({ id: 'social_star', label: 'Social Star', icon: 'people-outline', iconColor: '#22C55E', bg: '#DCFCE7' })

  return badges
}

export async function parentRoutes(fastify: FastifyInstance) {
  // ── GET /users/me ──────────────────────────────────────────────────────────
  // Resolve the Beam user row for the current auth user.
  fastify.get<{
    Querystring: { authUserId?: string; email?: string; phone?: string }
  }>('/users/me', async (req, reply) => {
    const { authUserId, email, phone } = req.query
    const normalizedEmail = email?.trim().toLowerCase()
    const normalizedPhone = phone?.trim()

    if (!authUserId && !normalizedEmail && !normalizedPhone) {
      return reply.status(400).send({ error: 'authUserId, email, or phone is required' })
    }

    let user = authUserId
      ? await db.query.users.findFirst({ where: eq(schema.users.id, authUserId) })
      : null

    if (!user && normalizedEmail) {
      user = await db.query.users.findFirst({ where: eq(schema.users.email, normalizedEmail) })
    }

    if (!user && normalizedPhone) {
      user = await db.query.users.findFirst({ where: eq(schema.users.phone, normalizedPhone) })
    }

    if (!user) return reply.status(404).send({ error: 'User not found' })

    return reply.send({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      city: user.city,
      role: user.role,
    })
  })

  // ── POST /users/register-parent ────────────────────────────────────────────
  // Create parent row in public.users after Supabase auth signup
  fastify.post('/users/register-parent', async (req, reply) => {
    const { userId, email, firstName, lastName, phone } = beamSchemas.RegisterParentInputSchema.parse(req.body)
    const resolvedUserId = userId ?? randomUUID()

    const [existingById, existingByEmail] = await Promise.all([
      db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, resolvedUserId)).limit(1),
      db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1),
    ])

    if (existingById.length > 0 || existingByEmail.length > 0) {
      return reply.status(409).send({ error: 'Parent account already exists' })
    }

    const [user] = await db.insert(schema.users).values({
      id: resolvedUserId,
      email,
      role: 'parent',
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone?.trim() || null,
    }).returning({ id: schema.users.id })

    return reply.status(201).send({ id: user.id })
  })

  // ── GET /children/:id/progress ────────────────────────────────────────────
  // Child's skill scores, badges, and most recent teacher note
  fastify.get<{ Params: { id: string } }>('/children/:id/progress', async (req, reply) => {
    const { id } = req.params

    const child = await db.query.children.findFirst({ where: eq(schema.children.id, id) })
    if (!child) return reply.status(404).send({ error: 'Child not found' })

    const bookingRows = await db
      .select({
        notes:         schema.bookings.notes,
        sessionType:   schema.bookings.sessionType,
        activityTitle: schema.activities.title,
        tags:          schema.activities.tags,
        teacherFirstName: schema.users.firstName,
        teacherLastName:  schema.users.lastName,
        scheduledAt:   schema.bookings.scheduledAt,
      })
      .from(schema.bookings)
      .leftJoin(schema.activities, eq(schema.bookings.activityId, schema.activities.id))
      .leftJoin(schema.users, eq(schema.bookings.teacherId, schema.users.id))
      .where(and(eq(schema.bookings.childId, id), eq(schema.bookings.status, 'completed')))
      .orderBy(desc(schema.bookings.scheduledAt))

    const completed = bookingRows.map(r => ({
      activityTitle: r.activityTitle,
      sessionType: r.sessionType,
      tags: r.tags ?? [],
    }))

    const skills = deriveSkills(completed)
    const badges = deriveBadges(completed)

    // Most recent teacher note
    const noteRow = bookingRows.find(r => r.notes && r.notes.trim().length > 0)
    const teacherNote = noteRow ? {
      teacherName: [noteRow.teacherFirstName, noteRow.teacherLastName?.[0]].filter(Boolean).join(' ') + '.',
      note: noteRow.notes!,
      date: noteRow.scheduledAt
        ? new Date(noteRow.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : '',
    } : null

    return reply.send({
      skills,
      badges,
      teacherNote,
      totalSessions: bookingRows.length,
    })
  })

  // ── POST /coupons/validate ─────────────────────────────────────────────────
  // Validate a coupon code and return discount details
  fastify.post<{
    Body: { code: string; orderAmount: number }
  }>('/coupons/validate', async (req, reply) => {
    const { code, orderAmount } = req.body
    if (!code) return reply.status(400).send({ error: 'code is required' })

    const coupon = await db.query.discountCodes.findFirst({
      where: eq(schema.discountCodes.code, code.toUpperCase()),
    })

    if (!coupon || !coupon.isActive) {
      return reply.status(422).send({ error: 'Invalid or expired coupon code' })
    }

    const now = new Date()
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return reply.status(422).send({ error: 'Coupon is not yet active' })
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return reply.status(422).send({ error: 'Coupon has expired' })
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return reply.status(422).send({ error: 'Coupon usage limit reached' })
    }
    if (orderAmount < parseFloat(coupon.minOrderAmount)) {
      return reply.status(422).send({ error: `Minimum order ₹${coupon.minOrderAmount} required` })
    }

    const discountAmount = coupon.type === 'flat'
      ? Math.min(parseFloat(coupon.value), orderAmount)
      : Math.round(orderAmount * parseFloat(coupon.value) / 100)

    return reply.send({
      code: coupon.code,
      type: coupon.type,
      value: parseFloat(coupon.value),
      discountAmount,
      finalAmount: orderAmount - discountAmount,
    })
  })

  // ── PATCH /users/profile ───────────────────────────────────────────────────
  // Parent profile update (name, city, phone)
  fastify.patch<{
    Body: { userId: string; firstName?: string; lastName?: string; city?: string; phone?: string }
  }>('/users/profile', async (req, reply) => {
    const { userId, firstName, lastName, city, phone } = req.body
    if (!userId) return reply.status(400).send({ error: 'userId is required' })

    const update: Record<string, any> = { updatedAt: new Date() }
    if (firstName !== undefined) update.firstName = firstName.trim()
    if (lastName  !== undefined) update.lastName  = lastName.trim()
    if (city      !== undefined) update.city      = city.trim()
    if (phone     !== undefined) update.phone     = phone.trim()

    if (Object.keys(update).length <= 1) return reply.send({ ok: true })

    await db.update(schema.users).set(update).where(eq(schema.users.id, userId))
    return reply.send({ ok: true })
  })
}
