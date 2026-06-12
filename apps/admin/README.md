# Beam Admin

Internal ops and management dashboard for the Beam platform. Used by admin and super_admin users to manage bookings, teachers, activities, payments, and platform analytics.

## Stack

- **Next.js 14** (App Router)
- **Recharts** — revenue and engagement charts
- **TanStack Table v8** — paginated, filterable data tables
- **Supabase SSR** (`@supabase/ssr`) — auth with server-side session handling
- **socket.io-client** — installed (real-time SOS feed not yet wired)
- **Tailwind CSS** — styling

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- A running instance of `apps/api` (see `apps/api/README.md`)
- A Supabase project with at least one user that has `admin` or `super_admin` in their `app_metadata.role`

---

## Installation

```bash
# From monorepo root — installs all workspaces
pnpm install

# Run admin app only
pnpm --filter=admin dev
# → http://localhost:3100
```

---

## Environment Variables

Create `apps/admin/.env.local` (gitignored):

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the Fastify API server |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## Auth Flow

1. Admin visits any route → `middleware.ts` intercepts the request
2. If no valid session → redirected to `/login`
3. Login uses **email + password** (not OTP — unlike the parent/teacher apps)
4. After login, Supabase session cookie is set; middleware reads `app_metadata.role`
5. Role must be `admin` or `super_admin` — any other role is rejected and redirected to `/login`
6. `super_admin` users have access to `/settings` and `/audit-logs`; `admin` users are redirected away from those routes

### Adding an admin user

Run this in the Supabase SQL editor:

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
WHERE email = 'admin@yourdomain.com';
```

For super_admin: replace `"admin"` with `"super_admin"`.

---

## Mock Mode (Development)

Most pages support a mock data mode so you can develop without a running API:

```js
// In the browser console — toggle on
localStorage.setItem('beam_admin_mock_mode', 'true')

// Toggle off
localStorage.removeItem('beam_admin_mock_mode')
```

Refresh the page after toggling. Mock responses are hardcoded in `src/lib/api.ts`.

---

## Features Implemented

### Fully wired (reads + writes both work)
| Route | What works |
|---|---|
| `/` | KPI cards (live from API), revenue + booking trend charts (Recharts), donut chart, recent bookings table |
| `/users` | Parent + child directory with search and role filters |
| `/teachers` | Teacher list with filters; create teacher form (POST to API); **CSV export** (downloads filtered list) |
| `/teachers/[id]` | Teacher detail — approve/reject verification (`PATCH /admin/teachers/:id/verify`), sessions, earnings |
| `/teachers/verification` | Pending verification queue display |
| `/activities` | Activity list with filters; create activity form (POST to API); **Publish** (`PATCH /admin/activities/:id/publish`) and **Archive** (`PATCH /admin/activities/:id/archive`) — optimistic update in table and grid views; activity detail + edit (`GET`/`PUT /admin/activities/:id`) |
| `/bookings` | Paginated bookings table; individual "Assign Teacher" and "Cancel" actions; **bulk Cancel Selected**; **CSV export** (downloads filtered list) |
| `/bookings/[id]` | Booking detail — **Cancel Booking** (`POST /admin/bookings/:id/cancel`), **Refund Payment** (`POST /admin/payments/:bookingId/refund`), **Reassign Teacher** (inline teacher ID input → `PATCH /admin/bookings/:id/assign`). All with loading states and error messages. |
| `/payments` | Payment ledger table + payout queue display |
| `/disputes` | Dispute triage list with filters; **Review** button marks row as `under_review`; **Resolve** button marks row as `resolved` (optimistic local state — disputes are synthesized from other tables) |
| `/reviews` | Ratings feed, low-score queue |
| `/analytics`, `/analytics/revenue`, `/analytics/engagement` | Charts and KPI displays |
| `/calendar` | Session calendar — bookings clickable, routes to detail |
| `/coupons` | Discount code table with usage stats |
| `/notifications` | Template list + delivery logs (read only) |
| `/audit-logs` | Last 100 action log entries (super_admin only) |
| `/login` | Email + password login with role validation |

---

## Features NOT Yet Implemented (TODO)

### Notifications — `/notifications`
| Button | Status |
|---|---|
| **+ New Campaign** | No `onClick` handler (has TODO comment) |
| **Edit** (on templates) | No `onClick` handler — does nothing |
| **Activation toggle** (on templates) | Looks clickable but has no handler — state never persists |
| **Cancel** (on scheduled campaigns) | No `onClick` handler (has TODO comment) |

### Settings — `/settings` (super_admin only)
All toggles and form fields update local state only. The save button uses a fake `setTimeout` delay and explicitly shows: *"Settings API is not wired yet. Changes are local preview only and were not saved."*

### SOS — `/sos`
- Socket.io is **not connected** — comment in file reads: *"Live alerts via WebSocket are not yet connected — new incidents will appear here after page refresh."*
- Incident status updates (assign responder, mark resolved) are not wired
- "Call Parent" / "Call Teacher" use `tel:` links — these work

### Analytics reports — `/analytics/reports`
- CSV export buttons render but `onClick` is not connected to any API

### Real-time
- KPI cards are static per page load — no polling or WebSocket refresh
- Socket.io client is installed but no connection is established anywhere in the app

### API enforcement
- The Fastify API `authenticate` middleware exists but is **not applied** to `/admin/*` routes — any request can call them in the current build

### Payout dispatch
- Payout queue on `/payments` shows pending records but there is no dispatch action or `POST /payouts/dispatch` endpoint

### Dispute persistence
- Dispute "Review" and "Resolve" actions update local UI state only (disputes are synthesized from cancelled bookings, flagged reviews, and failed payments — there is no disputes table). Status changes are lost on page refresh.

---

## Folder Structure

```
apps/admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout (fonts, providers)
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   └── login/                      # Login page
│   │   └── (dashboard)/
│   │       ├── layout.tsx                  # Sidebar + topbar + auth/role guard
│   │       ├── page.tsx                    # Main dashboard
│   │       ├── users/
│   │       ├── teachers/
│   │       │   ├── [id]/                   # Teacher detail
│   │       │   └── verification/           # Verification queue
│   │       ├── activities/
│   │       ├── bookings/
│   │       ├── payments/
│   │       ├── disputes/
│   │       ├── reviews/
│   │       ├── analytics/
│   │       │   ├── page.tsx
│   │       │   ├── revenue/
│   │       │   ├── engagement/
│   │       │   └── reports/
│   │       ├── coupons/
│   │       ├── notifications/
│   │       ├── calendar/
│   │       ├── sos/
│   │       ├── settings/                   # super_admin only
│   │       └── audit-logs/                 # super_admin only
│   ├── components/
│   │   ├── layout/                         # Sidebar, Topbar
│   │   └── ui/                             # Shared admin UI atoms
│   └── lib/
│       ├── api.ts                          # Axios client + all admin API calls + mock mode
│       └── supabase/
│           ├── browser.ts                  # Client-side Supabase instance
│           └── server.ts                   # Server-side Supabase instance (RSC/middleware)
├── middleware.ts                            # Auth check + role guard on every request
├── next.config.js
├── tailwind.config.ts
└── .env.local                              # (gitignored) — see env vars section
```

---

## Run Commands

```bash
pnpm --filter=admin dev          # dev server on http://localhost:3100
pnpm --filter=admin build        # production build
pnpm --filter=admin start        # run production build
pnpm typecheck --filter=admin    # TypeScript check
pnpm lint --filter=admin         # Biome lint
```

---

## Known Issues

- Pages show empty state if `apps/api` is not running — start the API first.
- After toggling mock mode, refresh the page for changes to take effect.
- `super_admin`-only routes redirect `admin` users back to the dashboard — this is intentional.
- The API does not enforce auth on admin endpoints yet; any request can call them in the current dev build.
