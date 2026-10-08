# Beam — Handover Guide

> For the next owner/maintainer of this repository. Covers what exists today, how it fits together, how to run it locally, how it is deployed, and what is needed to publish the mobile apps.
>
> **Snapshot:** 2026-10-08 · branch `main` · last commit `5e3fbd0` · repo `github.com/Twitch-Works/beam`
>
> **Golden rule when docs disagree:** trust the code. Several older docs in this repo (`PLAN.md`, `docs/DEPLOYMENT.md`, some READMEs) are partly out of date — see [§10 Known issues & doc drift](#10-known-issues--doc-drift).

---

## Contents

1. [What Beam is](#1-what-beam-is)
2. [Repository structure](#2-repository-structure)
3. [Architecture & how the pieces talk](#3-architecture--how-the-pieces-talk)
4. [Features — what is built, per app](#4-features--what-is-built-per-app)
5. [Database](#5-database)
6. [Local setup](#6-local-setup)
7. [Environment variables (with examples)](#7-environment-variables-with-examples)
8. [Deployment](#8-deployment)
9. [iOS & Android publication](#9-ios--android-publication)
10. [Known issues & doc drift](#10-known-issues--doc-drift)
11. [Accounts, services & access to transfer](#11-accounts-services--access-to-transfer)
12. [Where to go next](#12-where-to-go-next)

---

## 1. What Beam is

A three-sided ed-tech marketplace, India-first:

- **Parents** discover and book at-home (or online) activities for their children — art, music, dance, STEM, storytelling, etc. — and pay via Razorpay (UPI/cards).
- **Teachers** (verified by Beam) deliver the sessions, manage their class times, and get paid out.
- **Beam ops (admin)** curate activities, verify teachers, manage bookings, payments, disputes and approvals.

Brand: "beam" coral/teal wordmark, primary teal `#1787A6`, font Nunito. Full design system is in the root `CLAUDE.md` and `packages/ui-tokens`.

---

## 2. Repository structure

pnpm workspaces + Turborepo monorepo. Node ≥ 20, pnpm 9.

```
beam/
├── apps/
│   ├── api/            Fastify 4 API (TypeScript, ESM) + Drizzle ORM          ✅ live
│   ├── admin/          Next.js 14 — ops dashboard AND teacher web portal (/my) ✅ live
│   ├── parent-app/     Expo SDK 54 / React Native 0.81 — parent mobile app     ✅ functional
│   ├── teacher-app/    Expo SDK 54 / React Native 0.81 — teacher mobile app    🔧 partial
│   ├── landing/        Vite + React 19 + Tailwind — marketing site / waitlist  ✅ single page
│   ├── parent-web/     Next.js parent web app                                  ⬜ empty (planned)
│   └── teacher-web/    Next.js teacher web app                                 ⬜ empty (planned — teacher web lives in admin /my)
├── packages/
│   ├── schemas/        ⭐ Zod schemas + TS types (source of truth). Compiled to dist/ (CommonJS)
│   ├── config/         Zod-validated env loader for the API (@beam/config)
│   ├── ui-tokens/      Colors, spacing, typography, radius, shadows + CSS variables
│   ├── ui-web/         A few shared web components (small)
│   ├── api-client/     ⬜ empty folder (planned typed client)
│   ├── hooks/          ⬜ empty folder (planned shared TanStack Query hooks)
│   └── ui-native/      ⬜ empty folder (planned RN component library)
├── docs/               ADRs (auth, calendar), DATABASE.md, DEPLOYMENT.md, ENVIRONMENT.md
├── scripts/            setup-dev-env.sh (pushes dev env vars to Vercel preview)
├── Dockerfile          API container image (see §10 — CMD is wrong)
├── CLAUDE.md           Architecture rules + file registry (also used by AI coding agents)
├── AGENTS.md           Same guidance for Codex-style agents
└── PLAN.md             Old build tracker — OUT OF DATE, do not rely on its ✅/⬜ marks
```

Each app has its own `CLAUDE.md`/`AGENTS.md` with app-specific conventions, and most have a `README.md` with a feature list.

### Code conventions (enforced by convention, not tooling)

- **Schema first** — new data shapes go in `packages/schemas/src/*.schema.ts` before app code. After editing, rebuild: `pnpm --filter=@beam/schemas build` (apps import the compiled `dist/`).
- **API layering** — new modules follow `routes → service → repository` (see `apps/api/src/modules/scheduling/` and `payments/`). Older modules (`admin`, `booking`, `catalog`) put Drizzle queries directly in route files — legacy, refactor opportunistically.
- **Services return `Result<T,E>`** (`apps/api/src/lib/result.ts`), never throw for business errors.
- **Mobile**: FlashList (not FlatList), `expo-image`, `expo-haptics` on primary buttons, tokens from `src/constants/theme.ts`.
- Lint/format: Biome (`pnpm lint`, `pnpm format`). Typecheck: `pnpm typecheck`.

---

## 3. Architecture & how the pieces talk

```
 Parent app (Expo) ─┐                         ┌─ Supabase Auth (phone OTP, email/password, JWT)
 Teacher app (Expo) ┼── HTTPS (fetch) ──► API (Fastify on Vercel) ──► Supabase Postgres (Drizzle)
 Admin + /my (Next) ┘        Bearer JWT ▲            │
                                        │            ├──► Razorpay (orders, verify, webhooks)
          Supabase JS SDK (login) ──────┘            └──► (planned) Redis/BullMQ, Resend, WhatsApp, Expo push
 Landing (Vite) — static, no backend
```

- **Auth:** Supabase Auth. Mobile apps log in with phone OTP (parent app also supports email/password); admin logs in with email/password via `@supabase/ssr`. The **app role** (`parent | teacher | admin | super_admin`) lives in the Supabase user's `app_metadata.role`. The API verifies the Supabase JWT using Supabase's JWKS (`apps/api/src/lib/supabase-jwks.ts`) and reads `app_metadata.role` (`apps/api/src/middleware/auth.ts`).
- **Which API routes are protected:** `/admin/*` → admin/super_admin only. `/teacher/*` (+ `PATCH /bookings/:id/status`) → teacher/admin, and a teacher can only ever act on their own id (taken from the JWT, not the request). **Parent routes, catalog and payments are NOT JWT-guarded yet** — they trust a `parentId` in the body/query. This is the most important security gap before a public launch.
- **Payments:** Razorpay Standard Checkout rendered in a WebView inside the parent app (`apps/parent-app/src/components/RazorpayCheckout.tsx`) — works in Expo Go, no native SDK. The API creates the order, verifies the HMAC signature, and handles `payment.captured` / `payment.failed` webhooks.
- **Dev conveniences (`APP_MODE=development` on the API):** bookings auto-capture payment (no card needed) unless `RAZORPAY_TEST_CHECKOUT=true`; teacher OTP is always `000000`; the 24h minimum booking window is removed.
- **Realtime, Redis, BullMQ, push/WhatsApp/email delivery:** planned, not implemented. Notifications are only written to the `notifications` table (in-app list).

---

## 4. Features — what is built, per app

### 4.1 API — `apps/api` (77 routes)

| Area | Routes | Notes |
|---|---|---|
| Health | `GET /health` | |
| Catalog (public) | `GET /activities`, `/activities/:id`, `/activities/:id/slots` | Filters: category, search, age, `lat/lng/radiusKm` |
| Parent profile | `GET /users/me`, `POST /users/register-parent`, `PATCH /users/profile` | |
| Children | `GET/POST /children`, `PATCH /children/:id`, `GET /children/:id/progress` | Skills radar + badges |
| Bookings (parent) | `GET/POST /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/reschedule`, `POST /bookings/:id/cancel`, `/verify-otp`, `/complete`, `/issues`, `/feedback` | 24h reschedule buffer, 15-day max window, OTP check-in, issue reporting with case refs |
| Coupons | `POST /coupons/validate` | flat / percent |
| Payments | `POST /payments/orders`, `POST /payments/:bookingId/verify`, `POST /webhooks/razorpay` | Route→service→repo module |
| Guest booking (landing, no login) | `POST /guest/bookings`, `POST /guest/bookings/:id/payment-order`, `POST /guest/bookings/:id/verify` | Finds the parent by mobile number or creates a **provisional** (temporary) account + the child; price taken server-side; never returns parent/child ids |
| Parent account claim | `POST /parent-accounts/claim` | App calls it after login; links/merges the provisional account into the login only when Supabase has verified the same phone |
| Teachers (public) | `GET /teachers`, `GET /teachers/:id` | |
| Teacher self-service | `GET /teacher/sessions`, `GET/PATCH /teacher/profile`, `GET/PATCH /teacher/availability`, `GET /teacher/earnings`, `PATCH /bookings/:id/status` (accept/decline) | JWT-guarded |
| Teacher scheduling | `GET /teacher/activities`, `GET/POST /teacher/slots`, `DELETE /teacher/slots/:id`, `GET /teacher/change-requests`, `POST /teacher/bookings/:id/change-requests`, `POST /teacher/change-requests/:id/withdraw` | New `scheduling` module |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | In-app only |
| Admin (33 routes) | analytics overview; bookings list/detail/assign/cancel; teachers list/detail/create/verify + pending queue; activities CRUD/publish/archive + slots; users list/detail; payments ledger, refund, retry, payout dispatch/settle; reviews list/flag/escalate; session issues; disputes; notifications; categories; coupons; audit logs | All `authorize('admin','super_admin')` |
| Admin approvals | `GET /admin/change-requests`, `PATCH /admin/change-requests/:id` | Approve/reject teacher reschedule/cancel requests |

Full request/response tables: `apps/api/CLAUDE.md`.

### 4.2 Admin dashboard — `apps/admin` (Next.js 14, port 3100)

One app, two audiences, selected by `NEXT_PUBLIC_USER_ENV` (see §7.2):

**Ops (admin / super_admin)** — sidebar: Dashboard, Users, Teachers, Activities, Bookings, Change Requests, Calendar, Payments, Reviews & Feedback, Disputes, SOS Alerts, Analytics (Overview/Revenue/Engagement/Reports), Coupons & Offers, Notifications, Settings, Audit Logs.

| Status | Pages |
|---|---|
| Live API (with mock fallback if API unreachable) | Dashboard, Users (+detail), Teachers list, Teacher verification queue, Activities (list/new/edit/publish/archive, slot creation), Bookings (+detail, assign, cancel+refund), Payments (ledger, refund, retry, payouts), Reviews (flag/escalate), Disputes, Notifications, Calendar, Analytics overview, **Change Requests** |
| Static / mock only | Analytics → Revenue, Engagement, Reports; Coupons; SOS Alerts; Audit Logs; Settings (feature flags UI only); Teacher detail `teachers/[id]` |

- A **mock-data toggle** in the topbar (stored in `localStorage`) forces mock data for demos.
- `/settings` and `/audit-logs` are restricted to `super_admin` in middleware.

**Teacher portal (`/my/*`, role `teacher`)** — My Profile, My Schedule, My Earnings:
- **My Schedule** tabs: *Upcoming Bookings* (request reschedule to one of the teacher's open class times, or cancellation, with a reason; withdraw; request history) · *My Classes* (next 30 days of bookable class times; add new ones for activities matching the teacher's specializations; remove unbooked ones — no approval needed) · *Weekly Availability* (structured working-hours editor) · *Past Sessions*.
- Booking changes requested by a teacher **do nothing until an admin approves** them on *Change Requests*. Approve-cancel cancels + refunds + frees the slot; approve-reschedule moves the booking; both notify parent and teacher and write an audit log.

### 4.3 Parent app — `apps/parent-app`

Bundle/package `com.beam.parent`, deep-link scheme `beam://`. Tabs: **Home · Explore · Bookings · Saved · Profile** (Kids exists as a hidden screen).

Built:
- Animated splash → intro carousel (signed-out only) → **late onboarding** (location + child age/interests, no login needed) → browse.
- Login: phone OTP, email/password (register + login), test number. Profile setup → child setup. **Login persists across restarts** (session in `expo-secure-store`); signed-in users skip the intro and onboarding.
- Home feed (location, promos, categories, upcoming session, recommendations, trending, verified teachers, Watch & Learn), Explore (search, category chips, Near Me, FlashList), Activity detail (About/Reviews/Teacher), Teacher profile, Reels (vertical video).
- Booking flow: choose booking type → select child → slot picker → review → payment (coupon, price breakdown, Razorpay WebView) → confirmation (calendar, prep checklist, share, reminders).
- Bookings tab (Upcoming/Completed/Cancelled), Booking detail: cancel, reschedule, OTP reveal at class time, mark complete, feedback/rating, issue reporting with case tracker, **"Teacher on the way" card** shown only from 1h before an at-home class until teacher check-in — opens Google Maps (teacher → home route once the API provides teacher coordinates).
- Kids: child progress (level, skills radar, badges, teacher notes), child edit. Saved activities. Profile (stats, edit, privacy/terms links, refer & earn, logout).

Not built (see `apps/parent-app/README.md` TODO table): live teacher location (fields exist, nothing sends them), Socket.io live status, push-token registration, SOS button, offline mode, real refund-status tracking, reviews content, **account deletion**.

### 4.4 Teacher app — `apps/teacher-app`

Bundle/package `com.beam.teacher`, scheme `beam://` (same as parent — see §10). Tabs: Dashboard · Sessions · Checklist · Earnings · Profile.

Built: phone OTP login (+ test number), onboarding (skills, profile, availability, verification step), dashboard with accept/decline, sessions list, session detail → active session → complete session, checklist, earnings, notifications, profile + edit, weekly availability grid.

Not built: push registration, live updates, SOS response, offline completion queue, address display, payout detail, verification status, document upload, bank account, calendar view, **"I'm on my way" location sharing**, **EAS config** (no `eas.json`, placeholder project id — cannot be built for stores yet). Its local `.env` only sets `EXPO_PUBLIC_APP_MODE`, so it falls back to a hard-coded **older** Supabase project and `beam-api-xi` — fix before testing (see §7.4).

### 4.5 Landing site — `apps/landing`

Single route `/` (`src/pages/LandingPage.tsx`): hero, stats, how it works, activities, features, trust, social proof, **waitlist section**, footer.

**Book Now (no login)** — navbar + hero buttons open `src/components/booking/BookingModal.tsx`: pick a class → pick a slot (next 15 days, teacher shown) → parent name, mobile, child name + age → review & pay (Razorpay web checkout, loaded from `checkout.razorpay.com`) → "Your booking is complete. Manage booking through our mobile app." with Play Store / App Store buttons. The parent account is matched by mobile number, or a **provisional** (temporary) account is created. When the parent later logs into the app with that number (phone OTP), the app calls `POST /parent-accounts/claim`: the provisional account — kids, bookings, payments — is permanently linked to the login (or merged into their existing account), and profile/child setup open pre-filled with the website details so they can finalize them. Email-only signups are not linked (phone not verified). Talks to the API via `src/lib/bookingApi.ts`. Vite build → static `dist/`. Production domain appears to be `beamkids.in` (referenced by the API CORS list and the parent app's Privacy/Terms links), but there is **no deploy config in the repo** and **no `/privacy` or `/terms` page** (see §9.4).

---

## 5. Database

Supabase Postgres, schema in `apps/api/src/db/schema.ts` (Drizzle).

**Tables:** `users`, `children`, `teachers`, `categories`, `activities`, `slots`, `bookings`, `payments`, `payouts`, `reviews`, `session_issues`, `booking_change_requests`, `discount_codes`, `notifications`, `audit_logs`.

**Migrations** — `apps/api/src/db/migrations/`:

| File | Content | Applied how |
|---|---|---|
| `0000_salty_famine.sql` | Initial schema | drizzle-kit (in journal) |
| `0002_booking_lifecycle.sql` | OTP + lifecycle columns | drizzle-kit (in journal) |
| `0003_parent_catalog_alignment.sql` | Catalog/parent fields | **manual** (not in journal) |
| `0004_session_issue_flow.sql` | `session_issues` | **manual** |
| `0005_dispute_case_tracker.sql` | Case references | **manual** |
| `0006_fill_activity_slots_aug_to_dec_2026.sql` | Test slots Aug–Dec 2026 | drizzle-kit (in journal) |
| `0007_booking_change_requests.sql` | Teacher change requests | **manual** — applied to the current dev DB on 2026-10-08 |
| `0008_provisional_parent_accounts.sql` | `users.account_status` / `auth_user_id` / `created_via` / `claimed_at` for landing-page guest accounts | **manual** — must be applied before deploying the API code that uses it |

⚠️ The drizzle journal (`meta/_journal.json`) only lists 0000, 0002, 0006, so `pnpm db:migrate` will **not** apply 0003/0004/0005/0007 on a fresh database. For a new environment, run all SQL files in order in the Supabase SQL editor (or `psql`), then consider regenerating a clean baseline with `drizzle-kit`. The direct Supabase DB host is IPv6-only on projects without the IPv4 add-on — use the **transaction pooler** URL (port 6543).

**Seeds** (dev data only):

```bash
pnpm --filter=api db:seed            # demo categories, activities, parents, children, teachers, bookings
pnpm --filter=api db:seed-user       # test parent used by the 9999999999 mock login (fixed UUID 00000000-…-999999999999)
pnpm --filter=api db:seed-teacher    # demo teacher + Supabase login + sample bookings/payout + open class times
```

Demo teacher (dev only): `teacher.demo@beam.in` / `Beam@2024!` → log into the admin app with `NEXT_PUBLIC_USER_ENV=partner`.

---

## 6. Local setup

### 6.1 Prerequisites

- Node 20+ (repo tested with 22), pnpm 9 (`corepack enable`)
- Access to the Supabase project (or create your own and run all migrations — §5)
- Mobile: Expo Go on a phone, or Xcode 15+ (iOS simulator) / Android Studio (emulator)
- Optional: Razorpay test keys, `eas-cli` (`npm i -g eas-cli`)

### 6.2 Install & build shared packages

```bash
pnpm install
pnpm --filter=@beam/schemas build      # required — API/apps import the compiled dist/
```

### 6.3 Create env files

```bash
cp apps/api/.env.example              apps/api/.env
cp apps/admin/.env.local.example      apps/admin/.env.local
cp apps/parent-app/.env.example       apps/parent-app/.env
# teacher-app has no .env.example — create apps/teacher-app/.env (see §7.4)
```

Fill them in using §7. All `.env*` files are git-ignored.

### 6.4 Run

```bash
pnpm dev:api                           # API on http://localhost:3000  (check: curl localhost:3000/health)
pnpm dev:admin                         # Admin on http://localhost:3100
pnpm --filter=@beam/parent-app start   # Expo dev server for the parent app
pnpm --filter=@beam/teacher-app start  # Expo dev server for the teacher app
pnpm --filter=landing dev              # Landing on Vite's default port (5173)
```

- **Phone + local API:** `localhost` on a phone is the phone itself. Set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.20:3000`) or a deployed API URL.
- **Teacher portal locally:** start admin with `NEXT_PUBLIC_USER_ENV=partner pnpm dev:admin`, or set it in `.env.local` (see §7.2 — leaving it unset blocks teachers).
- **Test logins (mobile, no SMS):** parent app `9999999999` / OTP `123456` (mock session tied to the seeded test parent); teacher app `9999999999` / OTP `000000`.

### 6.5 Quality checks

```bash
pnpm typecheck                         # all workspaces
pnpm lint                              # Biome
pnpm --filter=admin build              # catches Next.js build errors
pnpm --filter=admin readiness          # admin production-readiness static checks
```

Known: `apps/parent-app/app/(root)/explore.tsx` has 2 pre-existing FlashList v2 type errors (`estimatedItemSize` removed in v2). There is **no automated test suite** wired yet (Vitest is referenced in docs but not installed).

---

## 7. Environment variables (with examples)

Never commit real values. Supabase **anon** keys are public by design; the **service-role** key, DB password, JWT secret and Razorpay secret are secrets.

### 7.1 API — `apps/api/.env`

Validated at startup by `packages/config` (process exits listing missing vars).

```env
NODE_ENV=development
APP_MODE=development                 # development = dev shortcuts (auto-capture payments, OTP 000000, no 24h window)

# Supabase → Project Settings → Database → Transaction pooler (port 6543)
DATABASE_URL=postgresql://postgres.<project-ref>:<db-password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
POSTGRES_URL=                        # optional; preferred over DATABASE_URL by db/index.ts and drizzle.config.ts if set

# Supabase → Project Settings → API
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # SECRET — bypasses RLS; used by seeds + admin user creation

JWT_SECRET=<openssl rand -hex 32>    # ≥32 chars; required by config (JWTs are actually verified via Supabase JWKS)
PORT=3000

# Payments — Razorpay → Settings → API Keys (rzp_test_* in dev, rzp_live_* in prod)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
RAZORPAY_WEBHOOK_SECRET=             # Razorpay → Webhooks → secret (needed for /webhooks/razorpay)
RAZORPAY_TEST_CHECKOUT=false         # dev only: true = real checkout flow instead of auto-capture

# Optional / planned integrations (not used by code yet)
UPSTASH_REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379
RESEND_API_KEY=re_...
EXPO_ACCESS_TOKEN=
META_WHATSAPP_TOKEN=
```

### 7.2 Admin — `apps/admin/.env.local`

```env
NEXT_PUBLIC_APP_MODE=development
NEXT_PUBLIC_API_URL=http://localhost:3000          # no trailing slash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_USER_ENV=admin                         # 'admin' = ops team only · 'partner' = teachers only
```

`NEXT_PUBLIC_USER_ENV` is read server-side in `src/middleware.ts` and `src/lib/admin-access.ts`. **Despite comments saying "unset = all roles", unset behaves exactly like `admin`.** To serve teachers you need a deployment (or local run) with `partner`. Intended production setup: two Vercel deployments of the same app — ops (`admin`) and teacher portal (`partner`).

### 7.3 Parent app — `apps/parent-app/.env`

```env
EXPO_PUBLIC_APP_MODE=development
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000       # or https://<api-deployment>.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_BYPASS_SUPABASE_EMAIL_SIGNUP=false      # true = register via API without Supabase email confirmation
```

Only `EXPO_PUBLIC_*` vars reach the app, and they are **baked in at build time**. Fallbacks if unset: API `https://beam-api-mu.vercel.app`, Supabase project `gfcywrxdsfmlmsjytqzg` (older project — don't rely on fallbacks).

### 7.4 Teacher app — `apps/teacher-app/.env` (no example file exists — create it)

```env
EXPO_PUBLIC_APP_MODE=development
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Fallbacks if unset: API `https://beam-api-xi.vercel.app`, Supabase `gfcywrxdsfmlmsjytqzg` — **different from the parent app**, so set all three explicitly.

### 7.5 Landing — `apps/landing/.env` (see `.env.example`)

```env
VITE_API_URL=http://localhost:3000                  # API base URL; must be in the API CORS list (localhost:5173 and beamkids.in are)
VITE_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.beam.parent
VITE_APP_STORE_URL=https://apps.apple.com/app/idXXXXXXXXXX   # set once the iOS app is live
```

Values are baked in at build time (`pnpm --filter=landing build`). Without store URLs the buttons fall back to the Play listing URL above and an App Store search.

### 7.6 Which Supabase / API is which

| Reference | Where seen | Status |
|---|---|---|
| Supabase `rikqbx…` (full ref in local `.env` files) | API, admin, parent-app local envs | **Current** project used locally |
| Supabase `bbmjnrtlrxlutafvndkm` | `scripts/setup-dev-env.sh` ("beam-dev") | Earlier dev project |
| Supabase `gfcywrxdsfmlmsjytqzg` | Hard-coded fallbacks in both mobile apps, `PLAN.md` | Older project — confirm whether still in use |
| API `beam-api-mu.vercel.app` | parent-app `.env` + fallback | Likely current API deployment |
| API `beam-api-xi.vercel.app` | teacher-app fallback, admin env docs | Earlier/other API deployment |
| API `beam-api-ji9u.onrender.com` | `PLAN.md`, `docs/DEPLOYMENT.md` | Old Render deployment |

Confirm in the Vercel/Supabase dashboards and delete stale projects to avoid confusion.

---

## 8. Deployment

### 8.1 API → Vercel (serverless)

- Config: `apps/api/vercel.json`. Vercel project root = `apps/api`.
  - Install: `cd ../.. && pnpm install --frozen-lockfile`
  - Build: `cd ../.. && pnpm --filter=@beam/schemas build && pnpm --filter=api build`
  - All paths rewrite to the serverless function `apps/api/api/index.ts` (wraps `buildApp()`), `maxDuration: 30s`.
- Env vars: everything in §7.1 with production values (`NODE_ENV=production`, `APP_MODE=production`, live Razorpay keys, prod Supabase).
- Deploy trigger: Git push to the connected branch (Vercel Git integration — confirm in the dashboard; the Vercel team in `scripts/setup-dev-env.sh` is `mohak-agrawals-projects-4c591387`, projects `beam-api` and `beam-admin`; the repo has since moved to the `Twitch-Works` GitHub org).
- `scripts/setup-dev-env.sh` pushes dev env vars to Vercel **Preview** for both projects (fill in the placeholders first; requires `vercel login`).
- After changing the API URL, update: admin `NEXT_PUBLIC_API_URL`, mobile `EXPO_PUBLIC_API_URL` (requires new mobile builds), Razorpay webhook URL (`https://<api>/webhooks/razorpay`), and the CORS allow-list in `apps/api/src/app.ts` if the admin/landing domains change.
- Serverless caveat: long-running jobs, Socket.io and BullMQ workers (planned) will need a non-serverless host (Render/Fly/Docker) later.

### 8.2 API → Docker (alternative)

`Dockerfile` at repo root builds only the API. **Fix before use:** `CMD ["node", "dist/app.js"]` should be `CMD ["node", "dist/server.js"]` — `app.js` only builds the app and never listens, so the container exits immediately. `docs/DEPLOYMENT.md`'s Render start command has the same bug.

### 8.3 Admin → Vercel

- Config: `apps/admin/vercel.json` (project root `apps/admin`, builds with `pnpm --filter=admin build`).
- Env: §7.2 with production values. For the teacher portal, create a second Vercel project from the same repo/root with `NEXT_PUBLIC_USER_ENV=partner` and its own domain.
- Known prod URL from older docs: `https://beam-admin-seven.vercel.app` (CORS also allows `https://admin.beamkids.in`).

### 8.4 Landing

No config in repo. Any static host works: build `pnpm --filter=landing build`, publish `apps/landing/dist` (Vercel: framework Vite, root `apps/landing`, output `dist`; add an SPA rewrite to `/index.html`). Domain: `beamkids.in`.

### 8.5 Database changes in production

1. Write the migration SQL in `apps/api/src/db/migrations/` and update `schema.ts`.
2. Apply to production **before** deploying API code that uses it (Supabase SQL editor or `psql` via the pooler URL).
3. Never run seed scripts against production.

### 8.6 Pre-deploy checklist

- [ ] `pnpm typecheck` and `pnpm --filter=admin build` pass
- [ ] `@beam/schemas` rebuilt
- [ ] Migrations applied to the target DB
- [ ] New env vars added in Vercel (API + both admin projects) and EAS (mobile)
- [ ] Razorpay webhook URL + secret correct for the environment
- [ ] `APP_MODE=production` on the production API (otherwise payments auto-capture and OTP is `000000`!)

---

## 9. iOS & Android publication

Both apps are Expo (SDK 54, React Native 0.81, new architecture default) built with **EAS Build** and uploaded with **EAS Submit**. Native `ios/` and `android/` folders are **not** committed (generated by `expo prebuild` during EAS builds; `apps/parent-app/android/` only contains an IDE folder).

### 9.1 Current configuration

| | Parent app | Teacher app |
|---|---|---|
| Display name | Beam | Beam Teacher |
| Expo slug | `beam-parent` | `beam-teacher` |
| iOS bundle identifier | `com.beam.parent` | `com.beam.teacher` |
| Android package | `com.beam.parent` | `com.beam.teacher` |
| Version | 1.0.0 | 1.0.0 |
| Build numbers | `appVersionSource: remote` (EAS manages iOS buildNumber / Android versionCode) | not configured |
| EAS project ID | `ef7c21a5-cd69-473f-9018-4c16a40f8653` | `beam-teacher-app` ⚠️ placeholder — not a real project |
| `eas.json` | ✅ `development`, `preview` (Android APK, internal), `production` (Android AAB) | ❌ missing |
| `owner` (Expo account/org) | not set — builds go to whoever is logged in to `eas-cli` | not set |
| Deep-link scheme | `beam` | `beam` ⚠️ same scheme as parent |
| Orientation / tablet | portrait, iPhone only (`supportsTablet: false`) | portrait, iPhone only |
| Permissions | Location (fine/coarse; iOS when-in-use **and** always strings), notifications | Notifications |
| Plugins | expo-router, expo-font, expo-notifications, expo-secure-store, expo-video, expo-location | expo-router, expo-font, expo-notifications, expo-secure-store |
| Icons/splash | `assets/images/icon.png`, adaptive icon, splash on `#1787A6`; regenerate with `scripts/build-icons.sh` | `assets/images/…` |
| Payments | Razorpay web checkout in WebView (physical service — App Store IAP not required) | — |

### 9.2 Build & submit commands

```bash
cd apps/parent-app
eas login                                   # use the Beam company Expo account
eas build --platform android --profile preview      # installable test APK  (= pnpm build:android:apk)
eas build --platform android --profile production   # Play Store AAB         (= pnpm build:android:aab)
eas build --platform ios --profile production       # App Store IPA
eas submit --platform android                        # upload latest AAB to Play Console
eas submit --platform ios                            # upload latest IPA to App Store Connect / TestFlight
```

**Env vars for EAS:** `.env` is git-ignored and therefore **not uploaded** to EAS cloud builds. Store the `EXPO_PUBLIC_*` values as EAS environment variables (`eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://… --visibility plaintext`, repeat for each) and add `"environment": "production"` / `"preview"` to the matching `eas.json` profiles — or put them in each profile's `env` block.

Teacher app first-time setup: `cd apps/teacher-app && eas init` (creates a real project id and writes it to `app.json`), then add an `eas.json` mirroring the parent app's.

### 9.3 Accounts needed

| | Apple App Store | Google Play |
|---|---|---|
| Account | Apple Developer Program, **Organization** enrollment (needs D-U-N-S number), US$99/year | Google Play Console, organization account, US$25 one-time; D-U-N-S for org verification |
| App records | Create 2 apps in App Store Connect with the bundle IDs above (register IDs in Certificates, Identifiers & Profiles) | Create 2 apps with the package names above |
| Signing | Let EAS manage distribution certificate + provisioning profiles (`eas credentials`) | Let EAS generate the upload keystore; enroll in **Play App Signing**. Back up the keystore (`eas credentials` → download) |
| Automated submit | App Store Connect API key (Issuer ID, Key ID, .p8) for `eas submit` | Google Cloud service-account JSON with Play Console access for `eas submit` |
| Testing track | TestFlight (internal → external with beta review) | Internal testing → closed testing. **New personal developer accounts must run a closed test with ≥12 testers for 14 days before production** (organization accounts are exempt) |

> **Check identifier availability early.** `com.beam.parent` / `com.beam.teacher` are generic and may already be registered by someone else, and Play package names can never be changed after the first upload. Consider a domain-based id such as `in.beamkids.parent` / `in.beamkids.teacher` **before** the first store upload (requires updating `app.json`).

### 9.4 Store-review blockers to fix before submitting

1. **In-app account deletion** — required by Apple (guideline 5.1.1(v)) and Google Play for any app with account creation. Neither app nor the API has it. Add a "Delete account" action in Profile + an API endpoint (and a web deletion URL for the Play listing).
2. **Privacy policy & terms URLs** — the parent app links to `https://beamkids.in/privacy` (and terms), but the landing site has only `/`. Publish real pages; both stores require a privacy policy URL.
3. **Location permission strings** — parent app declares `NSLocationAlwaysUsageDescription` but only uses foreground location. Remove "always" to avoid review questions; Play requires a declaration only for background location, so keep it foreground-only.
4. **Reviewer demo login** — provide test credentials in review notes. The `9999999999` / `123456` parent mock login and the teacher `9999999999` / `000000` login work only against an API/DB with the seeded test data; make sure the production build points to an environment where they work, or create real review accounts.
5. **Teacher app**: no `eas.json`, placeholder EAS project id, shares `beam://` scheme with the parent app (deep links can open the wrong app — change one, e.g. `beamteacher`).
6. **Production hardening**: parent API routes are not JWT-guarded (§3); `APP_MODE` must be `production` in the API used by store builds.
7. **Push notifications** (when implemented): iOS needs an APNs key, Android needs FCM credentials (`google-services.json`) uploaded via `eas credentials`.

### 9.5 Store listing material checklist (per app)

- App name, subtitle (iOS), short + full description, keywords (iOS), category (Education / Lifestyle — **not** the "Kids" category, since parents are the users)
- Icon 1024×1024 (no alpha on iOS), Play feature graphic 1024×500
- Screenshots: iPhone 6.7"/6.9" and 6.5", Android phone (min 2) — tablet not needed (`supportsTablet: false`)
- Privacy policy URL, support URL/email, marketing URL (`beamkids.in`)
- **Apple App Privacy** questionnaire & **Google Data safety** form: data collected includes phone number, email, name, precise/coarse location, child name + date of birth + interests, payment info (handled by Razorpay), usage data. Data about children is collected from the parent — describe this clearly. Comply with India's **DPDP Act 2023** (verifiable parental consent for children's data).
- Content rating questionnaires (IARC on Play, age rating on iOS)
- Pricing: free; India availability first
- Export compliance (iOS): standard HTTPS only → set `ITSAppUsesNonExemptEncryption: false` in `ios.infoPlist` to skip the question each upload

### 9.6 Releasing updates

- Bump `version` in `app.json` for user-visible releases; EAS auto-increments build numbers (`appVersionSource: remote`).
- JS-only hotfixes could use EAS Update (`expo-updates`), which is **not installed/configured** yet.
- Remember: `EXPO_PUBLIC_*` values are compiled into each build — changing the API URL requires a new build.

---

## 10. Known issues & doc drift

| # | Issue | Where | Impact |
|---|---|---|---|
| 1 | Parent/catalog/payment API routes not JWT-guarded; trust `parentId` from client | `apps/api/src/modules/booking/*`, `payments/` | **Security — fix before public launch** |
| 2 | Dockerfile/Render start `dist/app.js` instead of `dist/server.js` | `Dockerfile`, `docs/DEPLOYMENT.md` | Container exits immediately |
| 3 | Migrations 0003/0004/0005/0007 not in drizzle journal | `apps/api/src/db/migrations/meta/_journal.json` | `db:migrate` incomplete on fresh DBs |
| 4 | `NEXT_PUBLIC_USER_ENV` unset blocks teachers (comments/docs say otherwise) | `apps/admin/src/middleware.ts`, `admin-access.ts` | Teachers get access-denied |
| 5 | Teacher app `.env` incomplete → old Supabase + `beam-api-xi` | `apps/teacher-app/.env` | Teacher app talks to a different backend |
| 6 | Mobile apps hard-code different fallback API URLs and an old Supabase project + anon key | `src/lib/api.ts`, `src/lib/supabase.ts` in both apps | Silent misconfiguration |
| 7 | Teacher app not buildable for stores (no `eas.json`, fake project id) | `apps/teacher-app` | Blocks publication |
| 8 | Same `beam://` scheme in both apps | both `app.json` | Deep-link collisions |
| 9 | No account deletion; privacy/terms pages missing | apps + landing | Store rejection |
| 10 | No automated tests; Vitest not installed | repo | Regressions caught only by typecheck |
| 11 | 2 TS errors (FlashList v2 `estimatedItemSize`) | `apps/parent-app/app/(root)/explore.tsx` | `pnpm typecheck` fails for parent-app |
| 12 | Supabase SecureStore values >2 KB may not persist on some Android devices | `apps/parent-app/src/lib/supabase.ts` | Possible logout-on-restart on Android; fix with a chunked storage adapter if seen |
| 13 | Teacher live location not implemented (parent map shows only home) | teacher-app + API | Feature gap |
| 14 | `PLAN.md` phases 1–5 marked ⬜ although most are built; `docs/DEPLOYMENT.md` says API on Render & no `eas.json`; `docs/ENVIRONMENT.md` omits several vars | docs | Misleading — this file supersedes them |
| 15 | `PLAN.md` contains a real admin login and Supabase project refs; anon keys are committed in mobile fallbacks and `scripts/setup-dev-env.sh` | repo | **Rotate the admin password**; anon keys are public-by-design but remove the hard-coded fallbacks |
| 16 | `packages/api-client`, `hooks`, `ui-native`, `apps/parent-web`, `apps/teacher-web` are empty placeholders | repo | Root `CLAUDE.md` describes them as if they exist |

---

## 11. Accounts, services & access to transfer

Make sure the new owner receives admin/owner access to each of these (and that personal accounts are replaced by company accounts):

| Service | Used for | Notes |
|---|---|---|
| GitHub org `Twitch-Works` | Source (`beam` repo) | Transfer org ownership / admin |
| Vercel (team currently `mohak-agrawals-projects-4c591387`) | API + admin hosting | Move projects to a company team; re-check env vars |
| Supabase (current project `rikqbx…`, plus older `gfcywrx…`, `bbmjnrt…`) | Auth + Postgres | Transfer org ownership; DB password; service-role key; SMS provider config for phone OTP |
| SMS provider behind Supabase phone auth (Twilio/MSG91 etc.) | OTP delivery | Check Supabase → Auth → Providers → Phone |
| Razorpay | Payments | Merchant account KYC, test + live keys, webhook secret |
| Expo / EAS account | Mobile builds & submissions | Owner of project `ef7c21a5-…`; transfer to a company org and set `owner` in `app.json` |
| Apple Developer + App Store Connect | iOS publication | Organization enrollment; API key for EAS Submit |
| Google Play Console + Google Cloud | Android publication | Service account for EAS Submit; Play App Signing |
| Domain registrar / DNS for `beamkids.in` | Landing, admin subdomain, privacy policy | |
| Render (`beam-api-ji9u`) | Old API deployment | Decommission if unused |
| Planned: Upstash Redis, Resend, Meta WhatsApp, Expo push | Notifications/jobs | Not in use yet |

---

## 12. Where to go next

Suggested priority order:

1. **Security**: JWT-guard parent/booking/payment routes and derive `parentId` from the token (pattern: `resolveActorId` in `booking/teacher.routes.ts`).
2. **Environment hygiene**: settle on one Supabase project + one API URL per environment; remove hard-coded fallbacks; fix teacher-app `.env`; fix the Dockerfile CMD; fold manual migrations into the drizzle journal.
3. **Store readiness**: account deletion, privacy/terms pages, final bundle IDs, teacher-app EAS setup, EAS env vars, push credentials.
4. **Product gaps**: teacher "I'm on my way" + live location (parent side already consumes `teacherLatitude/teacherLongitude/teacherLocationUpdatedAt`), push notifications, Redis slot locking, real refund tracking, admin static pages (revenue/engagement/coupons/SOS/audit logs).
5. **Quality**: add Vitest to `apps/api` (service tests with a mocked repository work well — see `scheduling.service.ts`), fix the explore.tsx type errors, make `pnpm typecheck` green in CI.

Per-area deep dives: root `CLAUDE.md` (rules + file registry), `apps/api/CLAUDE.md` (full API reference), `apps/admin/CLAUDE.md` (admin UX + teacher portal), `apps/parent-app/README.md`, `apps/teacher-app/README.md`, `docs/ADR/`.
