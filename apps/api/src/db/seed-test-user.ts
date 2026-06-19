/**
 * Idempotent test user seed — safe to run multiple times.
 * Creates the test account for phone 9999999999 with bookings in all statuses.
 *
 * Run with:
 *   pnpm --filter=api exec tsx src/db/seed-test-user.ts
 */
import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, and } from 'drizzle-orm'
import * as schema from './schema.js'

const MOCK_USER_ID = '00000000-0000-0000-0000-999999999999'

console.log('🔍 Checking database connection... ', process.env.DATABASE_URL, process.env.POSTGRES_URL)

const client = postgres(process.env.POSTGRES_URL || process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d
}
function daysFromNow(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d
}

async function seedTestUser() {
  console.log('🧪 Seeding test user 9999999999…')

  // ── Test Parent User ───────────────────────────────────────────────────────
  await db.insert(schema.users).values({
    id: MOCK_USER_ID,
    email: 'test@9999999999.beam',
    role: 'parent',
    firstName: 'Test',
    lastName: 'User',
    phone: '+919999999999',
    city: 'Bengaluru',
  }).onConflictDoNothing()

  // ── Child ──────────────────────────────────────────────────────────────────
  const existingChildren = await db
    .select({ id: schema.children.id })
    .from(schema.children)
    .where(eq(schema.children.parentId, MOCK_USER_ID))
    .limit(1)

  let childId: string
  if (existingChildren.length > 0) {
    childId = existingChildren[0].id
    console.log('  → child already exists, skipping insert')
  } else {
    const [child] = await db.insert(schema.children).values({
      parentId: MOCK_USER_ID,
      firstName: 'Arjun',
      lastName: 'Sharma',
      dateOfBirth: '2017-03-15',
    }).returning()
    childId = child.id
    console.log('  → child created:', childId)
  }

  // ── Fetch real activity / teacher / slot IDs from DB ─────────────────────
  const activities = await db
    .select({ id: schema.activities.id, title: schema.activities.title, pricePerSession: schema.activities.pricePerSession, sessionDurationMins: schema.activities.sessionDurationMins, sessionType: schema.activities.sessionType })
    .from(schema.activities)
    .where(eq(schema.activities.status, 'published'))
    .limit(5)

  if (activities.length < 5) {
    console.error('❌ Not enough published activities — run pnpm --filter=api db:seed first')
    process.exit(1)
  }

  const teachers = await db
    .select({ id: schema.users.id, firstName: schema.users.firstName })
    .from(schema.users)
    .where(eq(schema.users.role, 'teacher'))
    .limit(5)

  if (teachers.length < 5) {
    console.error('❌ Not enough teacher users — run pnpm --filter=api db:seed first')
    process.exit(1)
  }

  const slots = await db
    .select({ id: schema.slots.id, activityId: schema.slots.activityId, date: schema.slots.date, startTime: schema.slots.startTime })
    .from(schema.slots)
    .limit(5)

  if (slots.length < 5) {
    console.error('❌ Not enough slots — run pnpm --filter=api db:seed first')
    process.exit(1)
  }

  // ── Check if test bookings already exist ──────────────────────────────────
  const existingBookings = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(eq(schema.bookings.parentId, MOCK_USER_ID))

  if (existingBookings.length > 0) {
    console.log(`  → ${existingBookings.length} bookings already exist for test user, skipping`)
    await client.end()
    console.log('✅ Test user seed complete (already seeded)')
    return
  }

  // ── Create bookings: one per status ───────────────────────────────────────
  const bookingSpecs: Array<{
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rescheduled'
    scheduledAt: Date
    activityIdx: number
  }> = [
    { status: 'confirmed',   scheduledAt: daysFromNow(2),  activityIdx: 0 },
    { status: 'pending',     scheduledAt: daysFromNow(5),  activityIdx: 1 },
    { status: 'completed',   scheduledAt: daysAgo(7),      activityIdx: 2 },
    { status: 'cancelled',   scheduledAt: daysAgo(3),      activityIdx: 3 },
    { status: 'rescheduled', scheduledAt: daysFromNow(10), activityIdx: 4 },
  ]

  const bookingRows = await db.insert(schema.bookings).values(
    bookingSpecs.map(({ status, scheduledAt, activityIdx }) => ({
      parentId:      MOCK_USER_ID,
      childId,
      teacherId:     teachers[activityIdx].id,
      activityId:    activities[activityIdx].id,
      slotId:        slots[activityIdx].id,
      status,
      sessionType:   activities[activityIdx].sessionType,
      totalAmount:   String(parseFloat(activities[activityIdx].pricePerSession) + 29),
      discountAmount: '0',
      scheduledAt,
      createdAt:     daysAgo(activityIdx + 1),
    }))
  ).returning()

  console.log(`  → ${bookingRows.length} bookings created`)

  // ── Payments for each booking ──────────────────────────────────────────────
  await db.insert(schema.payments).values(
    bookingRows.map(b => ({
      bookingId: b.id,
      parentId:  MOCK_USER_ID,
      amount:    b.totalAmount,
      gateway:   'upi' as const,
      gatewayPaymentId: `mock_${b.id.slice(0, 8)}`,
      status: b.status === 'cancelled'   ? 'refunded' as const
            : b.status === 'pending'     ? 'pending'  as const
            : 'success' as const,
      refundedAt: b.status === 'cancelled' ? daysAgo(2) : null,
    }))
  )

  console.log('  → payments created')
  await client.end()
  console.log('✅ Test user seed complete')
  console.log(`   User ID: ${MOCK_USER_ID}`)
  console.log('   Login:   phone 9999999999 → OTP 123456')
}

seedTestUser().catch(err => {
  console.error('❌ Test user seed failed:', err)
  process.exit(1)
})
