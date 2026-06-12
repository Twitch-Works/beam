# Beam — Platform Build Tracker

> Living document. Update as things ship. Be honest about what's broken.
> Stack: Next.js 14 (admin/web) · Expo (mobile) · Fastify 4 API · Supabase Auth · Drizzle + PostgreSQL · Razorpay

---

## Legend
- ✅ Done
- 🔧 In progress / partial
- ⬜ Not started
- ❌ Broken / blocked

---

## Infra & DevOps

| Task | Status | Notes |
|---|---|---|
| Monorepo setup (Turborepo + pnpm) | ✅ | |
| Drizzle schema (all tables) | ✅ | `apps/api/src/db/schema.ts` |
| Seed data | ✅ | `pnpm --filter=api db:seed` |
| Render API deployment | ✅ | https://beam-api-ji9u.onrender.com |
| Vercel admin deployment | ✅ | https://beam-admin-seven.vercel.app |
| **Prod DB migrations** | ❌ | Run `pnpm --filter=api db:migrate` on Render shell |
| Supabase project | ✅ | gfcywrxdsfmlmsjytqzg (ap-south-1) |

---

## Phase 0 — Admin App ✅ (mostly done)

| Task | Status | Notes |
|---|---|---|
| All page scaffolds (22 pages) | ✅ | |
| Supabase SSR auth + middleware | ✅ | Role: `admin` / `super_admin` in app_metadata |
| Admin user created | ✅ | admin@beam.in / Beam@2024! |
| Dashboard KPIs + charts | ✅ | Live API + mock fallback |
| Activities list + filters | ✅ | Live API |
| **Create activity** | ✅ | POST /admin/activities |
| **Edit activity** | ✅ | GET + PUT /admin/activities/:id |
| Teachers list + invite | ✅ | Live API |
| Bookings list + detail | ✅ | Live API |
| Payments ledger | ✅ | Live API |
| Users directory | ✅ | Live API |
| Mock data toggle (topbar) | ✅ | Persists in localStorage |
| Slot management (per activity) | ✅ | POST /admin/slots |
| Teacher assignment to bookings | ⬜ | PATCH /admin/bookings/:id/assign |
| Teacher verification flow | ⬜ | PATCH /admin/teachers/:id/verify |
| Disputes queue | ⬜ | |
| Refund approval | ⬜ | |
| Realtime SOS alert | ⬜ | Socket.io |

---

## Phase 1 — API: Auth + Core Modules

> **Blocker:** everything below needs this. Start here.

| Task | Status | Notes |
|---|---|---|
| `POST /auth/otp/send` | ⬜ | Twilio / MSG91 |
| `POST /auth/otp/verify` → JWT | ⬜ | Supabase custom JWT or own JWT |
| `POST /auth/refresh` | ⬜ | |
| `GET /activities` (public catalog) | ⬜ | With age/category/price filters |
| `GET /activities/:id` (public) | ⬜ | Full detail for parent app |
| `GET /categories` (public) | ⬜ | |
| `GET /slots?activityId=` | ⬜ | Available slots for booking |
| `POST /users/profile` | ⬜ | Create/update parent profile |
| `POST /users/children` | ⬜ | Add child profile |
| `GET /users/me` | ⬜ | Own profile |

**Files to create:**
- `apps/api/src/modules/auth/`
- `apps/api/src/modules/catalog/`
- `apps/api/src/modules/users/`

---

## Phase 2 — Parent App (Mobile)

> Goal: parent can browse → book → pay.

| Task | Status | Notes |
|---|---|---|
| OTP login screen | ⬜ | |
| Parent profile setup | ⬜ | |
| Add child (name, DOB, interests) | ⬜ | |
| Home screen (activity feed) | ⬜ | |
| Explore / search | ⬜ | |
| Activity detail screen | ⬜ | |
| Slot picker | ⬜ | |
| Cart / checkout | ⬜ | |
| Razorpay payment | ⬜ | |
| Booking confirmation | ⬜ | |
| Upcoming sessions (dashboard) | ⬜ | |
| Past bookings | ⬜ | |
| Child profile + skills | ⬜ | |

---

## Phase 3 — Teacher App (Mobile)

> Goal: teacher can see and run sessions.

| Task | Status | Notes |
|---|---|---|
| OTP login | ⬜ | |
| Dashboard (today's sessions) | ⬜ | |
| Session detail (child info, address) | ⬜ | |
| Pre-session checklist | ⬜ | Offline-capable |
| Start / complete session | ⬜ | |
| Earnings screen | ⬜ | |
| Availability calendar | ⬜ | |

---

## Phase 4 — Bookings + Payments API

| Task | Status | Notes |
|---|---|---|
| `POST /bookings` | ⬜ | Cart → booking, slot lock |
| `GET /bookings` (parent) | ⬜ | |
| `GET /bookings/:id` | ⬜ | |
| `POST /bookings/:id/cancel` | ⬜ | Release slot, trigger refund |
| Razorpay payment intent | ⬜ | |
| Razorpay webhook handler | ⬜ | Signature verification |
| Teacher payout calculation | ⬜ | T+2 schedule |
| `POST /bookings/:id/feedback` | ⬜ | Post-session review |

---

## Phase 5 — Notifications

| Task | Status | Notes |
|---|---|---|
| Push (Expo / FCM) | ⬜ | |
| WhatsApp (Meta API) | ⬜ | Booking confirmation, reminders |
| Email (Resend) | ⬜ | Receipts |
| Session reminders (BullMQ) | ⬜ | 24h + 1h before |

---

## Phase 6 — Parent Web + Teacher Web

> Mirror of mobile apps in Next.js 14. Do after mobile is stable.

| Task | Status | Notes |
|---|---|---|
| Parent web (Next.js) | ⬜ | SEO-optimised activity listings |
| Teacher web (Next.js) | ⬜ | Calendar view, session management |

---

## Immediate Next Actions

1. ❌ **Run `pnpm db:migrate` on Render** (Render Shell or locally with prod DATABASE_URL)
2. ⬜ Scaffold `apps/api/src/modules/auth/` — OTP send/verify, JWT
3. ⬜ Scaffold `apps/api/src/modules/catalog/` — public activity listing
4. ⬜ Wire parent app home screen to live catalog API

---

## Key Credentials & URLs

| Thing | Value |
|---|---|
| API (prod) | https://beam-api-ji9u.onrender.com |
| Admin (prod) | https://beam-admin-seven.vercel.app |
| Admin login | admin@beam.in / Beam@2024! |
| Supabase project | gfcywrxdsfmlmsjytqzg |
| Admin local port | 3100 |
| API local port | 3000 |
