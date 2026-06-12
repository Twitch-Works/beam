# API — Fastify 4 Backend

Serves all 5 client apps. Single Fastify server with modular architecture.
All business logic lives here. Mobile and web apps are pure presentation layers.

## Actual Code Status

Last synced: 2026-05-13.

Only the admin module exists today. The other modules listed below are planned architecture — their files do not exist yet.

### What exists
```
src/app.ts                            — Fastify entry point; registers CORS, JWT, adminRoutes
src/db/index.ts                       — Drizzle client (postgres-js)
src/db/schema.ts                      — Full Drizzle schema: all tables
src/db/seed.ts                        — Demo seed data; run with pnpm --filter=api db:seed
src/lib/result.ts                     — Result<T,E> type + ok() / err() helpers
src/middleware/auth.ts                — authenticate + authorize(role) preHandlers (scaffold — JWT verify not yet wired to Supabase)
src/modules/admin/admin.routes.ts     — All implemented admin endpoints (see API Reference below)
```

### What does NOT exist yet (planned)
The module folders `auth/`, `users/`, `catalog/`, `scheduling/`, `booking/`, `payments/`, `notifications/`, `ai/` and their service/repository files are planned but not scaffolded. Create them before building non-admin features.

---

## API Reference

Base URL: `http://localhost:3000` in dev (`PORT` env var). Production URL in `NEXT_PUBLIC_API_URL` env var.
Auth: none currently enforced — `authenticate` middleware exists but admin routes don't use `preHandler` yet.

### Health
| Method | Path | Response |
|--------|------|----------|
| GET | `/health` | `{ status: "ok", ts: ISO timestamp }` |

### Analytics
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/analytics/overview` | — | `{ kpis: { totalUsers, activeBookings, totalRevenue, sessionsCompleted, verifiedTeachers }, recentBookings[8] }` |

### Bookings
| Method | Path | Query / Params | Response |
|--------|------|----------------|----------|
| GET | `/admin/bookings` | `status`, `city`, `search`, `page`, `limit` (default 20, max 100) | `{ items, total, page, limit }` |
| GET | `/admin/bookings/:id` | — | Full booking with `parent`, `child`, `activity` (+ `category`), `slot`, `payment`, `review`, `teacher` |

### Teachers
| Method | Path | Query / Body | Response |
|--------|------|--------------|----------|
| GET | `/admin/teachers` | `status`, `city`, `search` | `{ items, total, verified, pending }` |
| GET | `/admin/teachers/verification/pending` | — | `{ items, total }` — pending verification queue |
| GET | `/admin/teachers/:id` | — | Teacher user + `teacher` profile + `sessions[20]` + `totalEarnings` |
| POST | `/admin/teachers` | `firstName*`, `lastName*`, `email*`, `phone`, `city`, `bio`, `specializations` | `{ id, userId }` — 409 if email taken |

> **Route order matters:** `/admin/teachers/verification/pending` is registered before `/admin/teachers/:id` so it won't be shadowed.

### Activities
| Method | Path | Query / Body | Response |
|--------|------|--------------|----------|
| GET | `/admin/activities` | `status`, `categoryId`, `search`, `page`, `limit` | `{ items, total, page, limit }` — items include `categoryName`, `totalBookings`, `avgRating` |
| POST | `/admin/activities` | `title*`, `description*`, `ageGroup*`, `pricePerSession*`, `sessionType`, `sessionDurationMins`, `minChildren`, `maxChildren`, `categoryId`, `imageUrl`, `tags`, `materialsNeeded`, `preparationNotes`, `status` | Created activity row — 201 |
| GET | `/admin/activities/:id/slots` | — | `{ items }` — slots with `teacherFirstName/LastName`, `isAvailable`, `lockedByBookingId` |

### Slots
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/admin/slots` | `activityId*`, `teacherId*`, `date*`, `startTime*`, `endTime*` | Created slot row — 201 |

### Users
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/users` | `role`, `search`, `page`, `limit` | `{ items, total, page, limit }` — items include `childCount`, `bookingCount` |

### Payments
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/payments` | `status`, `search`, `page`, `limit` | `{ payments[], payouts[], totals: { totalRevenue, pendingPayouts, refundsIssued, failed } }` |

### Reviews
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/reviews` | `minRating`, `flagged` (`"true"`), `search` | `{ items, total, avgRating, flagged }` |

### Reference Data
| Method | Path | Response |
|--------|------|----------|
| GET | `/admin/categories` | `{ items }` |
| GET | `/admin/coupons` | `{ items }` |
| GET | `/admin/audit-logs` | `{ items, total }` — last 100 entries with actor name + role |

### Implemented (latest additions)
- `PATCH /admin/teachers/:id/verify` — body: `{ action: 'verify'|'reject', notes? }` → updates `verificationStatus`
- `PATCH /admin/bookings/:id/assign` — body: `{ teacherId }` → sets `teacherId` on booking
- `POST /admin/bookings/:id/cancel` — cancels booking; refunds payment if `status=success`
- `GET /admin/disputes` — synthesized from cancelled+refunded bookings, flagged reviews, failed payments; query: `status`, `type`, `search`, `page`, `limit`; response: `{ items, total, page, limit, kpis }`
- `GET /admin/notifications` — hardcoded templates + DB logs; query: `page`, `limit`, `type`; response: `{ templates, logs: { items, total }, kpis }`

### Implemented (single-activity endpoints)
- `GET /admin/activities/:id` — single activity detail
- `PUT /admin/activities/:id` — update any activity fields

---

## Planned Module Structure

When building non-admin modules, follow this layout:

```
src/modules/{name}/
  index.ts              ← PUBLIC CONTRACT — only re-exports live here
  {name}.routes.ts      ← Thin: validate (Zod) → call service → respond
  {name}.service.ts     ← Business logic; emits events; no DB calls
  {name}.repository.ts  ← Drizzle queries only; never exported outside module
  {name}.schema.ts      ← Local Zod schemas (extend @beam/schemas if needed)
  CLAUDE.md             ← Module-specific rules
  __tests__/
    {name}.service.test.ts
    {name}.routes.test.ts
```

Planned modules (not yet scaffolded):
```
auth/           OTP flow, JWT issuance, refresh rotation
users/          Parent profiles, teacher profiles, child profiles
catalog/        Activities, categories, age groups, pricing
scheduling/     Teacher slots, availability, atomic slot locking
booking/        Booking lifecycle, cart, checkout, feedback, rebooking
payments/       Razorpay, refunds, teacher payouts, discount codes
notifications/  Push (FCM/APNs), WhatsApp (Meta API), Email (Resend)
ai/             Recommendations (pgvector), session summaries (GPT-4o)
```

---

## Auth Middleware

```typescript
// src/middleware/auth.ts — never re-implement
fastify.get('/bookings', {
  preHandler: [authenticate, authorize('parent')]
}, handler)

// request.user after authenticate:
// { id: string, role: 'parent'|'teacher'|'admin'|'super_admin' }
```

Current admin routes do NOT use `preHandler` yet — auth enforcement is a TODO before production.

---

## Service Pattern

```typescript
// Return Result<T, E> — never throw raw errors from services
import { ok, err, Result } from '@/lib/result'

export async function createBooking(
  input: CreateBookingInput,
  actorId: string
): Promise<Result<Booking, BookingError>> {
  const slot = await bookingRepo.findSlot(input.slotId)
  if (!slot) return err('SLOT_NOT_FOUND')
  await eventBus.emit('booking.confirmed', { bookingId: booking.id })
  return ok(booking)
}
```

## Repository Pattern

```typescript
// Drizzle only. No business logic. No events. No Result type.
export async function findBookingById(id: string): Promise<Booking | null> {
  return db.query.bookings.findFirst({ where: eq(bookings.id, id) })
}
```

## Route Pattern

```typescript
fastify.post('/bookings', { preHandler: [authenticate, authorize('parent')] },
  async (request, reply) => {
    const input = CreateBookingInputSchema.parse(request.body)
    const result = await bookingService.createBooking(input, request.user.id)
    if (!result.ok) return reply.status(422).send({ error: result.error })
    return reply.status(201).send(result.value)
  }
)
```

---

## Event Bus (planned)

```
src/lib/event-bus.ts  ← Redis pub/sub wrapper (not yet created)
src/events/           ← Handlers: one file per event (not yet created)

Booking events:
  booking.confirmed   → schedule reminders, notify teacher
  booking.completed   → update child skills, request review, trigger payout
  booking.cancelled   → release slot lock, process refund
  booking.rescheduled → notify parent + teacher, update slot lock

Payment events:
  payment.succeeded   → confirm booking status
  payment.failed      → release slot, notify parent

Teacher events:
  teacher.assigned    → notify teacher (push + WhatsApp)
  session.started     → log start time, notify parent

SOS events:
  sos.triggered       → Socket.io broadcast to all admin connections (highest priority)
```

---

## Config

```typescript
import { config } from '@beam/config'
// config.db.url, config.redis.url, config.razorpay.keyId, etc.
// Never read process.env directly in app code
```

## Error Handling

- Zod parse errors → 400 (Fastify schema validation)
- Service errors: `Result.err` → 422 with error code string
- Unexpected: Sentry captures, returns 500 with `requestId`

## Commands

```bash
pnpm --filter=api dev          # start dev server (tsx watch)
pnpm --filter=api db:generate  # drizzle-kit generate
pnpm --filter=api db:migrate   # drizzle-kit migrate
pnpm --filter=api db:seed      # populate demo database
pnpm --filter=api db:studio    # drizzle studio UI
pnpm test --filter=api         # unit + integration
```
