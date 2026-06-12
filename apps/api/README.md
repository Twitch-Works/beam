# Beam API

Fastify 4 backend serving all five Beam client apps. Single server with modular route/service/repository architecture, Drizzle ORM, PostgreSQL, and Razorpay payments.

## Stack

- **Fastify 4** — HTTP server
- **Drizzle ORM** — type-safe PostgreSQL queries
- **PostgreSQL** — primary database
- **Supabase** — auth (JWT verification) and storage
- **Razorpay** — payments, order creation, webhook handling
- **BullMQ + Redis** — job queues (reminders, notifications, payouts)
- **tsx** — TypeScript execution in dev (`tsx watch`)

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (local or hosted — Supabase DB works)
- Supabase project (for JWT verification)
- Razorpay account (optional for payment flows)
- Redis or Upstash Redis (optional — used for job queues and slot locking)

---

## Installation

```bash
# From monorepo root
pnpm install

# Run API only
pnpm --filter=api dev
# → http://localhost:3000
```

---

## Environment Variables

Create `apps/api/.env` (gitignored):

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/beam
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
JWT_SECRET=<min-32-char-secret>

# Optional — defaults shown
PORT=3000

# Optional — needed for payment flows
RAZORPAY_KEY_ID=<razorpay-key-id>
RAZORPAY_KEY_SECRET=<razorpay-key-secret>
RAZORPAY_WEBHOOK_SECRET=<razorpay-webhook-secret>

# Optional — needed for email notifications
RESEND_API_KEY=<resend-api-key>

# Optional — needed for job queues and slot locking (one of these)
UPSTASH_REDIS_URL=redis://...
REDIS_URL=redis://localhost:6379
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) |
| `JWT_SECRET` | Yes | Secret used to verify JWTs (≥32 chars) |
| `PORT` | No | Server port (default: 3000) |
| `RAZORPAY_KEY_ID` | Payment flows | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Payment flows | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhooks | Used to verify Razorpay webhook signatures |
| `RESEND_API_KEY` | Email notifications | Resend API key |
| `UPSTASH_REDIS_URL` or `REDIS_URL` | Job queues | Redis for BullMQ and slot locking |

> All env vars are validated on startup via Zod in `packages/config/src/index.ts`. The server will not start if required vars are missing.

---

## Database Setup

```bash
# Generate migrations from schema changes
pnpm --filter=api db:generate

# Run pending migrations
pnpm --filter=api db:migrate

# Seed demo data (dev only)
pnpm --filter=api db:seed

# Open Drizzle Studio UI
pnpm --filter=api db:studio
```

Schema source of truth: `src/db/schema.ts`

Migrations are stored in `src/db/migrations/`. Always commit generated migration files alongside schema changes.

---

## API Routes Implemented

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{ status: "ok", ts: <ISO timestamp> }` |

### Admin — Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/admin/analytics/overview` | KPIs: total users, active bookings, revenue, sessions completed, verified teachers + recent bookings |

### Admin — Bookings
| Method | Path | Query Params | Description |
|---|---|---|---|
| GET | `/admin/bookings` | `status`, `city`, `search`, `page`, `limit` | Paginated booking list |
| GET | `/admin/bookings/:id` | — | Full booking detail (parent, child, activity, slot, payment, teacher) |
| PATCH | `/admin/bookings/:id/assign` | body: `{ teacherId }` | Assign a teacher to a booking |
| POST | `/admin/bookings/:id/cancel` | — | Cancel booking; refunds payment if `status=success` |

### Admin — Teachers
| Method | Path | Query / Body | Description |
|---|---|---|---|
| GET | `/admin/teachers` | `status`, `city`, `search` | Teacher list with verification status |
| GET | `/admin/teachers/verification/pending` | — | Teachers awaiting verification |
| GET | `/admin/teachers/:id` | — | Teacher detail + sessions + total earnings |
| POST | `/admin/teachers` | `firstName`, `lastName`, `email`, `phone`, `city`, `bio`, `specializations` | Create a new teacher account |
| PATCH | `/admin/teachers/:id/verify` | body: `{ action: 'verify'|'reject', notes? }` | Approve or reject teacher verification |

### Admin — Activities
| Method | Path | Query / Body | Description |
|---|---|---|---|
| GET | `/admin/activities` | `status`, `categoryId`, `search`, `page`, `limit` | Paginated activity list |
| POST | `/admin/activities` | `title`, `description`, `ageGroup`, `pricePerSession`, `sessionType`, etc. | Create a new activity |
| GET | `/admin/activities/:id` | — | Single activity detail with slots |
| PUT | `/admin/activities/:id` | any activity fields | Update any activity fields |
| PATCH | `/admin/activities/:id/publish` | — | Set activity status to `published` |
| PATCH | `/admin/activities/:id/archive` | — | Set activity status to `archived` |
| GET | `/admin/activities/:id/slots` | — | Slots for an activity (with teacher and availability) |

### Admin — Slots
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/admin/slots` | `activityId`, `teacherId`, `date`, `startTime`, `endTime` | Create a session slot |

### Admin — Users
| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/admin/users` | `role`, `search`, `page`, `limit` | Parent + child user directory |

### Admin — Payments
| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/admin/payments` | `status`, `search`, `page`, `limit` | Payment ledger + payout queue + totals |
| POST | `/admin/payments/:bookingId/refund` | — | Mark payment as refunded (standalone, without cancelling booking). Returns 422 if already refunded. |

### Admin — Reviews
| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/admin/reviews` | `minRating`, `flagged`, `search` | Review list with avg rating and flagged count |

### Admin — Reference Data
| Method | Path | Description |
|---|---|---|
| GET | `/admin/categories` | All activity categories |
| GET | `/admin/coupons` | All discount codes with usage stats |
| GET | `/admin/audit-logs` | Last 100 audit log entries |
| GET | `/admin/disputes` | Synthesized dispute view (cancelled bookings, refund requests, flagged reviews) |
| GET | `/admin/notifications` | Notification templates + delivery logs |

### Bookings (Parent / Teacher)
| Method | Path | Description |
|---|---|---|
| GET | `/bookings` | Parent's own bookings (filter by `status`) |
| POST | `/bookings` | Create a booking + pending payment record; locks the slot |
| GET | `/bookings/:id` | Single booking detail |
| POST | `/bookings/:id/cancel` | Parent cancels their own booking; releases the slot. Returns 422 if already cancelled or completed |
| POST | `/bookings/:id/feedback` | Parent submits post-session rating (1–5) + optional comment; inserts into reviews table. Returns 422 if booking not completed or already reviewed |
| GET | `/children` | Children belonging to the authenticated parent |
| PATCH | `/children/:id` | Update a child's firstName, lastName, or dateOfBirth |
| GET | `/teachers/:id` | Public teacher profile |
| GET | `/children/:id/progress` | Child skill scores, badges, and most recent teacher note (derived from completed bookings) |
| POST | `/coupons/validate` | Validate a coupon code against an order amount |
| PATCH | `/users/profile` | Update parent profile (firstName, lastName, city, phone) |
| GET | `/teacher/profile` | Authenticated teacher's own profile |
| PATCH | `/teacher/profile` | Update teacher profile (bio, languages/specializations, etc.) |
| GET | `/teacher/earnings` | Teacher earnings summary |
| GET | `/teacher/availability` | Teacher's weekly availability |
| PATCH | `/teacher/availability` | Update teacher's weekly availability |
| GET | `/notifications` | In-app notifications for the authenticated user |
| PATCH | `/notifications/read-all` | Mark all notifications as read |

### Catalog
| Method | Path | Query | Description |
|---|---|---|---|
| GET | `/activities/:id` | — | Single activity detail with teacher slots |
| GET | `/activities` | (see catalog routes) | Filterable activity listing |

### Payments
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/payments/orders` | `bookingId` | Create a Razorpay order for a booking |
| POST | `/payments/:bookingId/verify` | `razorpayPaymentId`, `razorpayOrderId`, `razorpaySignature` | Verify payment signature and confirm booking |
| POST | `/webhooks/razorpay` | — | Razorpay webhook handler (HMAC signature verified) |

---

## Module Structure

```
src/
├── server.ts                   # Entry point — creates and starts Fastify
├── app.ts                      # Plugin registration, CORS, routes
├── db/
│   ├── index.ts                # Drizzle client (postgres-js)
│   ├── schema.ts               # All table definitions (source of truth)
│   ├── seed.ts                 # Demo seed data
│   └── migrations/             # Generated SQL migration files
├── lib/
│   ├── result.ts               # Result<T,E> type + ok()/err() helpers
│   ├── event-bus.ts            # Redis pub/sub wrapper (planned)
│   └── slot-lock.ts            # Atomic slot locking via Redis (planned)
├── middleware/
│   └── auth.ts                 # authenticate + authorize(role) preHandlers
├── modules/
│   ├── admin/
│   │   └── admin.routes.ts     # All /admin/* endpoints
│   ├── booking/
│   │   ├── booking.routes.ts   # /bookings/:id, /children, /teachers/:id
│   │   ├── parent.routes.ts    # /children/:id/progress, /coupons/validate, /users/profile
│   │   └── teacher.routes.ts   # /teacher/profile, /teacher/earnings, /teacher/availability, /notifications
│   ├── catalog/
│   │   └── catalog.routes.ts   # /activities, /activities/:id
│   ├── payments/
│   │   ├── payments.routes.ts  # /payments/orders, /payments/:id/verify, /webhooks/razorpay
│   │   ├── payments.service.ts # Razorpay SDK calls, signature verification
│   │   ├── payments.repository.ts
│   │   └── payments.schema.ts  # Zod input schemas for payment routes
│   ├── auth/                   # Placeholder (planned)
│   ├── scheduling/             # Placeholder (planned)
│   ├── users/                  # Placeholder (planned)
│   ├── notifications/          # Placeholder (planned)
│   └── ai/                     # Placeholder (planned)
├── events/                     # Event handlers (planned — not yet scaffolded)
└── jobs/                       # BullMQ job definitions (planned — not yet scaffolded)
```

---

## Auth Middleware

```typescript
import { authenticate, authorize } from '@/middleware/auth'

fastify.get('/bookings', {
  preHandler: [authenticate, authorize('parent')]
}, handler)

// request.user after authenticate:
// { id: string, role: 'parent' | 'teacher' | 'admin' | 'super_admin' }
```

> **Note:** Admin routes (`/admin/*`) do not apply `preHandler` yet. Auth enforcement on those routes is a TODO before production.

---

## Coding Patterns

### Service returns `Result<T, E>`
```typescript
import { ok, err, Result } from '@/lib/result'

async function createBooking(input): Promise<Result<Booking, 'SLOT_NOT_FOUND'>> {
  const slot = await repo.findSlot(input.slotId)
  if (!slot) return err('SLOT_NOT_FOUND')
  return ok(booking)
}
```

### Routes call service, handle Result
```typescript
fastify.post('/bookings', async (req, reply) => {
  const result = await bookingService.create(req.body)
  if (!result.ok) return reply.status(422).send({ error: result.error })
  return reply.status(201).send(result.value)
})
```

### Repositories: Drizzle only, no business logic
```typescript
export async function findById(id: string) {
  return db.query.bookings.findFirst({ where: eq(bookings.id, id) })
}
```

### Config: never read `process.env` directly in app code
```typescript
import { config } from '@beam/config'
// config.db.url, config.razorpay.keyId, config.port, etc.
```

---

## Features NOT Yet Implemented (TODO)

| Feature | Notes |
|---|---|
| Auth module (`/auth/otp/send`, `/auth/otp/verify`) | Supabase OTP not yet exposed via API; clients call Supabase SDK directly |
| Scheduling module (`/slots`, slot locking) | `lib/slot-lock.ts` is planned; atomic Redis locking not yet built |
| Booking creation (`POST /bookings`) | Create flow not yet in booking.routes.ts |
| Booking cancellation (parent-facing) | Admin cancel exists; parent-facing cancel not wired |
| Post-session feedback (`POST /bookings/:id/feedback`) | Endpoint not yet created |
| AI recommendations | `modules/ai/` is a placeholder; pgvector + OpenAI not wired |
| Notification dispatch (push, WhatsApp, email) | `modules/notifications/` is a placeholder; BullMQ jobs not scaffolded |
| Payout dispatch | No `POST /payouts/dispatch` endpoint |
| Activity listing filter route | `GET /activities` exists in catalog.routes.ts but may be limited |
| Auth enforcement on admin routes | `preHandler` not applied to `/admin/*` yet |
| Disputes table | Disputes are synthesized from other tables; no `disputes` DB table or per-dispute status persistence |

---

## Run Commands

```bash
pnpm --filter=api dev          # dev server with watch (tsx watch src/server.ts)
pnpm --filter=api build        # compile TypeScript to dist/
pnpm --filter=api start        # run compiled dist/server.js
pnpm --filter=api typecheck    # tsc --noEmit
pnpm --filter=api db:generate  # generate Drizzle migration from schema.ts changes
pnpm --filter=api db:migrate   # run pending migrations against DATABASE_URL
pnpm --filter=api db:seed      # populate database with demo data
pnpm --filter=api db:studio    # open Drizzle Studio in browser
```

---

## Known Issues

- Admin routes have no auth middleware applied — any request can call them in the current build.
- `lib/event-bus.ts` and `lib/slot-lock.ts` are referenced in CLAUDE.md but not yet created.
- BullMQ jobs and event handlers are entirely unscaffolded.
- `modules/ai/` exists as a folder but contains no working code.
- Razorpay webhook endpoint (`POST /webhooks/razorpay`) verifies the HMAC signature; ensure `RAZORPAY_WEBHOOK_SECRET` is set to the same value configured in the Razorpay dashboard.
