# Admin — Next.js 14

Internal operating system for Beam ops. Used only by `admin` and `super_admin`.
This app is not a marketing surface and not a parent or teacher experience.
Everything should optimize for speed, clarity, auditability, and operational confidence.

## What admin owns
- Booking operations: assign teacher, reschedule, cancel, track status
- Teacher operations: verify, onboard, review quality, monitor payouts
- Curriculum operations: activities, categories, pricing, age groups
- Payment operations: ledger, payout queue, refunds, disputes
- Quality operations: ratings review, flagged sessions, intervention queue
- Schedule operations: all-session calendar, conflict monitoring
- Analytics: revenue, bookings, engagement, teacher performance
- System operations: notifications, offers, audit logs, protected settings

## API Reference — `apps/api/src/modules/admin/admin.routes.ts`

All endpoints are served at `NEXT_PUBLIC_API_URL` (default `http://localhost:3000` in dev, set in Vercel dashboard for prod).
Use `adminApi` from `src/lib/api.ts` — never call `fetch` directly in page code.
Fields marked `*` are required in request bodies. All list endpoints return `{ items, total }` unless noted.

### Analytics
| Method | Path | Query params | Response |
|--------|------|--------------|----------|
| GET | `/admin/analytics/overview` | — | `{ kpis: { totalUsers, activeBookings, totalRevenue, sessionsCompleted, verifiedTeachers }, recentBookings[8] }` |

### Bookings
| Method | Path | Query / Body | Response |
|--------|------|--------------|----------|
| GET | `/admin/bookings` | `status`, `city`, `search`, `page`, `limit` | `{ items, total, page, limit }` |
| GET | `/admin/bookings/:id` | — | Full booking with `parent`, `child`, `activity` (+ `category`), `slot`, `payment`, `review`, `teacher` |

### Teachers
| Method | Path | Query / Body | Response |
|--------|------|--------------|----------|
| GET | `/admin/teachers` | `status`, `city`, `search` | `{ items, total, verified, pending }` |
| GET | `/admin/teachers/:id` | — | Teacher detail + `sessions[20]` + `totalEarnings` |
| GET | `/admin/teachers/verification/pending` | — | `{ items, total }` — pending verification queue |
| POST | `/admin/teachers` | `firstName*`, `lastName*`, `email*`, `phone`, `city`, `bio`, `specializations` | `{ id, userId }` |

### Activities
| Method | Path | Query / Body | Response |
|--------|------|--------------|----------|
| GET | `/admin/activities` | `status`, `categoryId`, `search`, `page`, `limit` | `{ items, total, page, limit }` — each item includes `categoryName`, `totalBookings`, `avgRating` |
| POST | `/admin/activities` | `title*`, `description*`, `ageGroup*`, `pricePerSession*`, `sessionType`, `sessionDurationMins`, `minChildren`, `maxChildren`, `categoryId`, `imageUrl`, `tags`, `materialsNeeded`, `preparationNotes`, `status` | Created activity row |
| GET | `/admin/activities/:id/slots` | — | `{ items }` — slots with `teacherFirstName`, `teacherLastName`, `isAvailable`, `lockedByBookingId` |

### Slots
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/admin/slots` | `activityId*`, `teacherId*`, `date*`, `startTime*`, `endTime*` | Created slot row |

### Users
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/users` | `role`, `search`, `page`, `limit` | `{ items, total, page, limit }` — includes `childCount`, `bookingCount` |

### Payments
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/payments` | `status`, `search`, `page`, `limit` | `{ payments, payouts, totals: { totalRevenue, pendingPayouts, refundsIssued, failed } }` |

### Reviews
| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/admin/reviews` | `minRating`, `flagged` (boolean), `search` | `{ items, total, avgRating, flagged }` |

### Reference data
| Method | Path | Response |
|--------|------|----------|
| GET | `/admin/categories` | `{ items }` |
| GET | `/admin/coupons` | `{ items }` |
| GET | `/admin/audit-logs` | `{ items, total }` — last 100 entries with actor info |

### Activity detail endpoints (implemented)
- `GET /admin/activities/:id` — fetch single activity
- `PUT /admin/activities/:id` — update any activity fields

### Newly implemented
| Method | Path | Notes |
|--------|------|-------|
| PATCH | `/admin/teachers/:id/verify` | body: `{ action: 'verify'\|'reject', notes? }` |
| PATCH | `/admin/bookings/:id/assign` | body: `{ teacherId }` |
| POST | `/admin/bookings/:id/cancel` | auto-refunds payment if `status=success` |
| GET | `/admin/disputes` | synthesized from bookings/reviews/payments; query: `status`, `type`, `search`, `page` |
| GET | `/admin/notifications` | templates (hardcoded) + logs from DB; query: `page`, `type` |

---

## Primary UX direction
Use the root Beam design system, but apply it with an admin-product lens:
- Calm, premium, high-trust dashboard
- Soft bright surfaces with strong data contrast
- Fast scanning for KPIs, alerts, and table actions
- Friendly brand touches without making the tool feel playful or noisy

The reference UI direction for admin is:
- White and light-gray page canvas
- Rounded cards with soft shadows
- Teal as the primary action and chart color
- Coral/pink and lavender used as supporting accents
- DM Sans for interface text
- DM Mono for metrics, currency blocks, and tabular numeric emphasis

## What this app should feel like
- Immediate: key numbers visible without scrolling too far
- Operational: booking, teacher, payout, and review queues are always actionable
- Trustworthy: every destructive or high-risk action is explicit and auditable
- Live: dashboard reflects realtime ops activity, especially SOS and session updates

## Actual Code Status

Last synced with code: 2026-05-12.

- Build/typecheck: `pnpm --filter=admin typecheck` and `pnpm --filter=admin build` pass.
- Lint: `pnpm --filter=admin lint` uses Biome and is currently expected to fail until formatting/a11y/import diagnostics are fixed.
- Readiness: `pnpm --filter=admin readiness` is the static production-readiness gate for auth, mock data, privileged guards, realtime dependency, TODOs, and lockfile drift.
- Routes: login plus 22 admin pages exist under `src/app`; `activities/[id]` was created.
- Data: dashboard, bookings, teachers, activities, and payments pages progressively enhance — they fetch from the real API (`NEXT_PUBLIC_API_URL`) and fall back to mock data if the API is unavailable. Remaining pages still use page-local mock data.
- API client: `src/lib/api.ts` (`adminApi`) is the typed fetch wrapper used by all wired pages.
- Auth: Supabase SSR session creation, route middleware, and role checks are not wired.
- Privileged access: `settings` and `audit-logs` still need SSR `super_admin` enforcement.
- Runtime actions: verification, assignment, refunds, payouts, disputes, settings, reports, and notifications are UI/TODO scaffolds.
- Realtime: Socket.io/SOS handling is specified but not implemented.
- Backend: Fastify API (`apps/api/`) now has full Drizzle schema, seed data, and GET endpoints for all admin pages. Run `pnpm --filter=api db:seed` to populate the demo database.

## File Registry

Every significant file you create or meaningfully modify must have its one-line summary maintained here. 
Follow the format: `path/to/file.ts — what it does (key exports or behavior)`.

### src/lib/
```txt
api.ts — adminApi typed fetch wrapper: analytics, bookings, teachers, activities, users, payments, reviews, coupons, auditLogs, categories — uses NEXT_PUBLIC_API_URL
```

### scripts/
```txt
readiness-check.mjs — Static production-readiness gate for admin blockers: auth guards, mock data, realtime dependency, TODOs, lint setup, and pnpm lockfile drift
```

### src/components/layout/
```txt
DashboardShell.tsx  — 'use client' shell wrapping SidebarProvider + AdminSidebar + AdminTopbar; imported by (dashboard)/layout.tsx
Sidebar.tsx         — Collapsible sidebar with SidebarProvider context, nav sections (Main/Analytics/System), profile footer
Topbar.tsx          — Sticky topbar: global search, date chip, notification bell
```

### src/app/
```txt
(auth)/layout.tsx                      — Auth layout wrapper
(auth)/login/page.tsx                  — Admin login form, SSR session initialization, redirect if no admin role

(dashboard)/layout.tsx                 — Server Component; SSR role guard scaffold (TODO: wire Supabase); renders DashboardShell
(dashboard)/page.tsx                   — 'use client'; Overview dashboard: KPI cards (5), Recharts line/donut/bar charts, bookings table, teacher performance

(dashboard)/users/page.tsx             — Parent + child user directory, search, filters, and detail entry
(dashboard)/users/UsersTable.tsx       — Data table for users using @beam/ui-web DataTable
(dashboard)/teachers/page.tsx          — Teacher list + verification status, quality monitoring
(dashboard)/teachers/TeachersTable.tsx — Data table for teachers using @beam/ui-web DataTable
(dashboard)/teachers/[id]/page.tsx     — Teacher detail: hero card, approve/reject flow, profile info grid, sessions table, earnings + documents sidebar
(dashboard)/teachers/verification/page.tsx — Pending verification queue: card UI with DocPill components, approve disabled until docs complete

(dashboard)/activities/page.tsx        — Curriculum management: create/edit/publish activities + age groups
(dashboard)/activities/ActivitiesTable.tsx — Data table for activities using @beam/ui-web DataTable
(dashboard)/activities/[id]/page.tsx   — Activity edit form: pre-populated fields from mock/API data, status badge, archive confirm, save draft vs publish actions
(dashboard)/activities/new/page.tsx    — Create activity form: basic info, target & pricing (session type, group min/max), materials & prep, visibility toggle

(dashboard)/bookings/page.tsx          — Paginated filterable bookings table, bulk teacher assignment, booking detail modal
(dashboard)/bookings/BookingsTable.tsx — Data table for bookings using @beam/ui-web DataTable
(dashboard)/bookings/[id]/page.tsx     — Booking detail: hero strip, child/parent/teacher/activity info cards, timeline with check circles, cancel+refund confirmation actions

(dashboard)/payments/page.tsx          — Payment ledger table + payout queue management
(dashboard)/payments/PaymentsTable.tsx — Data table for payments using @beam/ui-web DataTable

(dashboard)/disputes/page.tsx          — Disputes and refund requests triage
(dashboard)/disputes/DisputesTable.tsx — Data table for disputes using @beam/ui-web DataTable

(dashboard)/reviews/page.tsx           — Ratings, low-score queue, parent feedback review
(dashboard)/reviews/ReviewsTable.tsx   — Data table for reviews using @beam/ui-web DataTable

(dashboard)/analytics/page.tsx         — Analytics overview dashboards
(dashboard)/analytics/revenue/page.tsx — Revenue trends and payout analytics (Recharts)
(dashboard)/analytics/engagement/page.tsx — Signup, booking funnel, repeat rate metrics
(dashboard)/analytics/reports/page.tsx — Downloadable reports and CSV exports

(dashboard)/coupons/page.tsx           — Coupons, discount codes, and offers management
(dashboard)/coupons/CouponsTable.tsx   — Data table for coupons using @beam/ui-web DataTable
(dashboard)/notifications/page.tsx     — Notification templates, campaigns, delivery logs
(dashboard)/settings/page.tsx          — System configuration (super_admin only)
(dashboard)/audit-logs/page.tsx        — Audit history and action traceability (super_admin only)
```

## Navigation model
Match the reference dashboard layout.

### Main sidebar sections
- Dashboard
- Users
- Teachers
- Activities
- Bookings
- Payments
- Reviews & Feedback
- Disputes

### Analytics section
- Overview
- Revenue
- Engagement
- Reports

### System section
- Coupons & Offers
- Notifications
- Settings
- Audit Logs

Sidebar behavior:
- Fixed left navigation
- Beam wordmark at top
- Clear active state using teal fill or teal accent border
- Collapsible groups are okay, but primary sections should remain obvious
- Current admin identity should stay visible at the bottom of the sidebar

## Topbar requirements
The topbar is operational, not decorative.

- Global search for children, teachers, bookings, and activities
- Date-range selector for dashboard filtering
- Notifications bell with unread badge count
- Optional quick actions menu for create activity, assign teacher, or open disputes

Search behavior:
- Debounced input
- Search by booking ID, parent name, child name, teacher name, or activity title
- Results should open directly to the correct detail page

## Overview dashboard composition
The root dashboard should closely follow the reference composition.

### KPI row
Top cards:
- Total users
- Active bookings
- Total revenue
- Sessions completed
- Verified teachers

KPI card rules:
- Show primary value first
- Show trend delta below it
- Use soft tinted icon circle on the right
- Keep numbers highly legible and compact

### Chart row
- Revenue overview line chart
- Bookings overview donut chart
- User signups bar chart

### Mid-content operations row
- Recent bookings table/card list
- Top activities summary
- Teacher performance summary

### Lower insights row
- User distribution donut
- Growth overview metric cards
- Reviews summary
- Recent feedback

### Persistent alert rail or footer strip
Use a low-profile but visible system strip for:
- pending teacher verification count
- refund/dispute attention items
- feature announcements or ops notices

## Dashboard content rules
- Numbers should use DM Mono where it helps scanning
- Revenue must always show INR formatting
- Trend deltas need clear positive/negative semantics
- Every summary widget should have a drill-down destination when relevant
- Avoid overloading charts with too many series; clarity beats density

## Core pages

### Dashboard
- Snapshot of platform health
- Fast links into bookings, teachers, disputes, and payouts
- Realtime awareness for SOS and failed payments

### Users
- Parent and child account directory
- Search, filters, account state, and profile access
- Child-linked activity and booking context where useful

### Teachers
- Verification pipeline
- Teacher quality monitoring
- Session history, rating trend, and payout visibility
- Manual admin actions should be explicit and permission-checked

### Activities
- Curriculum and pricing control
- Category and age-group management
- Publish or unpublish workflows

### Bookings
- High-density operational table
- Bulk assignment and bulk status workflows where safe
- Strong filters by status, city, teacher, date, and activity

### Payments
- Parent payment ledger
- Teacher payout queue
- Refund and dispute workflows
- Reconciliation visibility

### Reviews & Feedback
- Low-rating triage
- Searchable review stream
- Flagged sessions and intervention tracking

### Analytics
- Revenue trends
- Booking funnel
- User signup trends
- Teacher performance
- Exportable reporting

### Notifications
- Template management
- Delivery log visibility
- Campaign or operational notification actions

### Settings and audit logs
- `super_admin` only
- Must prioritize safety, reversibility, and traceability

## Role access matrix
| Section | admin | super_admin |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Users | ✅ | ✅ |
| Teachers | ✅ | ✅ |
| Activities | ✅ | ✅ |
| Bookings | ✅ | ✅ |
| Payments (view) | ✅ | ✅ |
| Refund approval | ✅ | ✅ |
| Payout dispatch | ❌ | ✅ |
| Settings | ❌ | ✅ |
| Audit logs | ❌ | ✅ |

Enforce at layout and page level using SSR session role checks.
Never rely on client-only hiding for privileged actions.

## Data and component patterns
```ts
// Tables
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

// Charts
import { BarChart, LineChart, PieChart } from 'recharts'

// Calendar
import { Calendar } from 'react-big-calendar'

// Shared UI
import { Button, Badge, DataTable, StatCard, ChartCard } from '@beam/ui-web'

// Tokens
import { colors, spacing, typography, radius, shadows } from '@beam/ui-tokens'
```

## Admin-specific UI rules
- Use `DM Sans` for interface text in admin
- Use `DM Mono` selectively for metrics, currency, and dense numeric cells
- Prefer white cards on `#F8FAFC` backgrounds
- Keep table row height around the root spec target of 48px
- Use soft shadows, never harsh black shadows
- Use teal for primary data emphasis, not for every decorative element
- Use coral and red carefully for alerts, disputes, and destructive states only

## Table behavior rules
- Sorting, filtering, and pagination are expected defaults
- Sticky headers are preferred for long operational tables
- Bulk actions should appear only when rows are selected
- Row actions should avoid hidden ambiguity: use clear labels or well-known icons
- Every critical table should support empty, loading, and error states

## Chart behavior rules
- Charts should answer one operational question each
- Default ranges should be useful, such as `This Week`, `This Month`, `Last 6 Months`
- Tooltips must show formatted values
- Legends should stay readable and minimal
- Avoid decorative gradients that reduce legibility

## Realtime behavior
Socket.io client connects when the dashboard shell mounts.

Important events:
- `booking.created` -> refresh booking counters and queue indicators
- `booking.updated` -> refresh booking detail and status summaries
- `session.started` -> update schedule and active-session visibility
- `session.completed` -> update completion counts and payout expectations
- `payment.failed` -> surface operational alert in payments and dashboard
- `sos.triggered` -> highest-priority alert flow

SOS handling:
- Must be impossible to miss
- Full-screen or near-full-screen interrupt treatment is acceptable
- Show child, parent, teacher, booking, and contact context immediately
- Log acknowledgement and action taken

## Search and filter expectations
- Search should be global in the header
- Page-level filters should persist in the URL where practical
- Admins should be able to share filtered views
- Date filtering should be consistent across cards, tables, and charts

## Safety rules
- All destructive actions require explicit confirmation
- Status changes must show current state and next state clearly
- Refunds, cancellations, and payout actions need audit-friendly UX
- Never hide risky actions behind vague icon-only controls
- Expose who performed an action when the backend provides that data

## Performance rules
- Prefer server-rendered shells and route-level data loading where it helps first paint
- Use client components only for interactivity-heavy areas like tables, filters, charts, and live widgets
- Paginate large datasets instead of rendering everything
- Avoid expensive dashboard overfetching on first load

## Schema and boundary rules
- Schema first: create or update shared Zod schemas in `packages/schemas/` before app code
- Import shared modules only from their package barrel exports
- Never read `process.env` directly in app code; use shared config
- Admin-only hooks belong in `@beam/hooks/admin`
- Admin-only API access belongs behind typed `@beam/api-client` helpers

## Good defaults for implementation
- Use route groups to keep auth and dashboard shells separate
- Keep reusable dashboard widgets small and composable
- Separate table column definitions from page shells
- Extract metric formatting helpers for INR, percentages, and deltas
- Keep review, disputes, and payout flows especially explicit

## Reference note
When designing admin screens, use the provided dashboard snapshot as the tone reference:
- airy spacing
- soft rounded cards
- teal-led brand palette
- friendly but serious admin UX
- visible hierarchy between metrics, charts, tables, and review queues
