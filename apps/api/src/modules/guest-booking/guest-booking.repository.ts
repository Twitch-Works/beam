import { and, eq, ilike, inArray, or } from 'drizzle-orm'
import { db } from '../../db/index.js'
import * as schema from '../../db/schema.js'

// Drizzle queries only — never imported from outside this module.

export async function findUserByPhones(phones: string[]) {
  const [row] = await db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(inArray(schema.users.phone, phones))
    .limit(1)
  return row ?? null
}

export async function findUserByEmail(email: string) {
  return (await db.query.users.findFirst({ where: eq(schema.users.email, email), columns: { id: true, role: true } })) ?? null
}

// Temporary account until the parent signs in to the app with the same (verified) number
export async function insertProvisionalParent(values: { email: string; firstName: string; lastName: string; phone: string }) {
  const [row] = await db
    .insert(schema.users)
    .values({ ...values, role: 'parent', accountStatus: 'provisional', createdVia: 'landing' })
    .returning({ id: schema.users.id })
  return row
}

export async function findChildByName(parentId: string, firstName: string) {
  const [row] = await db
    .select({ id: schema.children.id })
    .from(schema.children)
    .where(and(eq(schema.children.parentId, parentId), ilike(schema.children.firstName, firstName)))
    .limit(1)
  return row ?? null
}

export async function insertChild(values: { parentId: string; firstName: string; dateOfBirth: string }) {
  const [row] = await db.insert(schema.children).values(values).returning({ id: schema.children.id })
  return row
}

export async function findActivity(id: string) {
  return (await db.query.activities.findFirst({
    where: eq(schema.activities.id, id),
    columns: { id: true, title: true, status: true, pricePerSession: true },
  })) ?? null
}

export async function findBookingWithPayment(id: string) {
  const [row] = await db
    .select({
      id: schema.bookings.id,
      parentId: schema.bookings.parentId,
      status: schema.bookings.status,
      paymentStatus: schema.payments.status,
    })
    .from(schema.bookings)
    .leftJoin(schema.payments, eq(schema.payments.bookingId, schema.bookings.id))
    .where(eq(schema.bookings.id, id))
    .limit(1)
  return row ?? null
}

// ── Claiming a provisional account ───────────────────────────────────────────

export async function findProvisionalParentByPhones(phones: string[]) {
  const [row] = await db
    .select({ id: schema.users.id, phone: schema.users.phone })
    .from(schema.users)
    .where(and(inArray(schema.users.phone, phones), eq(schema.users.accountStatus, 'provisional'), eq(schema.users.role, 'parent')))
    .limit(1)
  return row ?? null
}

/** The Beam user row already tied to this Supabase login (by id or by an earlier claim). */
export async function findUserForAuthId(authUserId: string) {
  const [row] = await db
    .select({ id: schema.users.id, role: schema.users.role, phone: schema.users.phone })
    .from(schema.users)
    .where(or(eq(schema.users.id, authUserId), eq(schema.users.authUserId, authUserId)))
    .limit(1)
  return row ?? null
}

export async function linkProvisionalParent(id: string, values: { authUserId: string; email: string | null }) {
  await db
    .update(schema.users)
    .set({
      authUserId: values.authUserId,
      accountStatus: 'active',
      claimedAt: new Date(),
      updatedAt: new Date(),
      ...(values.email ? { email: values.email } : {}),
    })
    .where(eq(schema.users.id, id))
}

/** Move everything the provisional parent owns onto the existing account, then drop it. */
export async function mergeProvisionalParent(params: { fromId: string; intoId: string; phoneForTarget: string | null }) {
  const { fromId, intoId } = params
  await db.transaction(async (tx) => {
    await tx.update(schema.children).set({ parentId: intoId }).where(eq(schema.children.parentId, fromId))
    await tx.update(schema.bookings).set({ parentId: intoId }).where(eq(schema.bookings.parentId, fromId))
    await tx.update(schema.payments).set({ parentId: intoId }).where(eq(schema.payments.parentId, fromId))
    await tx.update(schema.reviews).set({ parentId: intoId }).where(eq(schema.reviews.parentId, fromId))
    await tx.update(schema.sessionIssues).set({ parentId: intoId }).where(eq(schema.sessionIssues.parentId, fromId))
    await tx.update(schema.notifications).set({ userId: intoId }).where(eq(schema.notifications.userId, fromId))
    if (params.phoneForTarget) {
      await tx.update(schema.users).set({ phone: params.phoneForTarget, updatedAt: new Date() }).where(and(eq(schema.users.id, intoId)))
    }
    await tx.delete(schema.users).where(eq(schema.users.id, fromId))
  })
}
