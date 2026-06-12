# Admin App Spec

## Goal
Build a calm, high-trust internal operating system for Beam ops. Admin staff use this
to manage bookings, verify teachers, process payments, triage quality issues, and monitor
platform health in real time. Every action should be explicit, auditable, and fast to reach.

## Design Reference
`docs/design/admin-dashboard-reference.png` — use this as the canonical visual reference
for layout, component density, color, and spacing decisions throughout all phases.

## Current Status
- Next.js 14 app scaffold exists and production build currently completes.
- Dashboard shell, login page, and 21 admin route pages are present under `src/app`.
- Overview dashboard, operational tables, analytics pages, settings, audit logs, and detail pages are UI scaffolds using mock data and TODO actions.
- Supabase SSR auth, route middleware, and role guards are not wired yet.
- `settings` and `audit-logs` are documented as `super_admin` only, but still need server-side enforcement.
- Live API/query hooks, admin schemas, Socket.io/SOS handling, audit logging, and mutation flows remain production blockers.
- `pnpm --filter=admin readiness` tracks the static production-readiness blockers below.

## Production Readiness Checklist

Run these before considering the admin app ready to ship:

```bash
pnpm --filter=admin typecheck
pnpm --filter=admin build
pnpm --filter=admin lint
pnpm --filter=admin readiness
```

Required pass conditions:
- Route middleware redirects unauthenticated users to `/login`.
- Dashboard layout performs SSR session and `admin` / `super_admin` role checks.
- Login uses real Supabase auth instead of simulated success.
- `settings`, `audit-logs`, payout dispatch, and other privileged actions are enforced server-side for `super_admin`.
- Mock dashboard/table/detail data is replaced with typed `@beam/hooks/admin` or `@beam/api-client` calls.
- Admin payloads and responses use shared schemas from `@beam/schemas`; no inline production data contracts.
- Destructive and financial actions require confirmation, reason capture where relevant, and audit logging.
- Socket.io client handles `sos.triggered`, `payment.failed`, and booking/session updates with visible operational alerts.
- Loading, empty, and error states exist for all data-heavy pages.
- Lint is non-interactive and CI-safe.
- No npm lockfile drift exists inside this pnpm workspace.

## Users
- **`admin`** — Beam ops staff. Day-to-day booking, teacher, payment, and quality operations.
- **`super_admin`** — Beam leads. All of the above plus payout dispatch, settings, and audit logs.

## Core User Journey
Login → Overview dashboard → Drill into operational queue → Take action → Confirm outcome

---

## Phase 1: Foundation
Goal: a working shell that an admin can log in to, navigate, and not get past without the right role.

- Admin login page (`(auth)/login/`)
- Supabase SSR session (cookie-based, same pattern as parent-web and teacher-web)
- Middleware: redirect any unauthenticated request to `/login`
- Role guard: redirect anyone without `admin` or `super_admin` role to an access-denied page
- Dashboard layout shell: fixed 220px dark sidebar (`#0F172A`) + white topbar + `#F8FAFC` content area
- Sidebar: **beam** script wordmark in teal at top, then grouped navigation links matching the reference exactly:
  - Main group: Dashboard, Users, Teachers, Activities, Bookings, Payments, Reviews & Feedback, Disputes
  - Analytics group (labelled "ANALYTICS"): Overview, Revenue, Engagement, Reports
  - System group (labelled "SYSTEM"): Coupons & Offers, Notifications, Settings, Audit Logs
  - Bottom: current admin avatar + name + role chip (e.g. "Super Admin")
  - Decorative illustration (child + toys) above the admin identity chip, matching the reference
- Active sidebar item: teal fill + white text; inactive: gray icon + gray label
- Topbar: global search bar ("Search children, teachers, activities..."), date chip (e.g. "16 May 2024" with calendar icon and dropdown arrow), notifications bell with unread badge count
- Personalised heading on dashboard: "Welcome back, [Name]! 👋" + subtitle "Here's what's happening on Beam today."
- Empty placeholder content area — just the shell, no dashboard content yet
- `super_admin`-only routes (`/settings`, `/audit-logs`) blocked at layout level with SSR role check

### Success Criteria
- An admin with the correct role can log in and see the full sidebar
- A user without `admin` or `super_admin` role is redirected immediately after login
- Navigating between sidebar items renders the correct (empty) page without errors
- Refreshing any page preserves the session without redirecting to login
- Layout renders cleanly at 1280px and 1440px viewport widths
- Sidebar, topbar, and content area match the reference in proportions and color

---

## Phase 2: Overview Dashboard
Goal: ops staff can open the dashboard and immediately understand platform health at a glance.

### KPI Row (5 cards, full width)
Match the reference exactly — each card:
- Label (small, gray): e.g. "Total Users"
- Primary value (large, DM Mono, navy): e.g. **12,485**
- Trend delta below value (green arrow + percent for positive): e.g. "↑ 18.6% vs last 30 days"
- Soft tinted icon circle on the right (teal circle with outlined icon for Users, yellow for Bookings, mint for Revenue, lavender for Sessions, blue-gray for Teachers)
- White card, `border-radius: 16px`, soft card shadow

KPIs:
1. **Total Users** — total parent + teacher accounts
2. **Active Bookings** — bookings in `pending` or `confirmed` state
3. **Total Revenue** — ₹ formatted, DM Mono
4. **Sessions Completed** — completed session count
5. **Verified Teachers** — teacher accounts in verified state

### Chart Row (3 charts)
**Revenue Overview** (left, ~50% width):
- Dual line chart (Recharts `LineChart`)
- Two series: Revenue (₹, teal) and Bookings (count, warm yellow/orange)
- Y-axis: INR labels (₹2L, ₹4L, ₹6L, ₹8L)
- X-axis: date labels (1 May, 5 May, 10 May…)
- Dots on each data point; smooth curve
- Range toggle top-right: "This Month ▾" (dropdown: This Week / This Month / Last 6 Months)
- Legend: two colored dots with labels

**Bookings Overview** (center, ~25% width):
- Donut chart (Recharts `PieChart`) — center label shows total count and "Total" text
- Four segments matching Beam semantic status colors:
  - Completed → teal (`#E5F7F4` family)
  - Upcoming → amber
  - Cancelled → red/pink
  - Rescheduled → lavender
- Legend to the right: segment name, count, percentage (e.g. "Completed  1,452 (64.6%)")

**User Signups** (right, ~25% width):
- Bar chart (Recharts `BarChart`)
- Single series: coral/pink bars
- X-axis: day labels (Mon, Tue, Wed…)
- Y-axis: count (0, 200, 400, 600, 800)
- Range toggle: "This Week ▾"

### Mid-Content Operations Row (3 columns)
**Recent Bookings** (left, ~50%):
- Table with columns: Booking ID, Child & Activity (avatar + name + age), Teacher (avatar + name + rating), Date & Time, Status badge, Amount
- Status badges use Beam semantic colors: Upcoming (amber), Confirmed (green), Cancelled (red)
- 5 rows shown; "View all →" link top-right
- Row height 48px, alternating white / `#F8FAFC`

**Top Activities** (center, ~25%):
- Simple list of 5 activities
- Each row: activity icon (emoji or colored icon), activity name, booking count below name (e.g. "243 bookings")
- Range toggle: "This Month ▾"
- "View all activities →" link at bottom

**Teacher Performance** (right, ~25%):
- Table with columns: Teacher (avatar + name), Sessions (count), Rating (star icon + number), Earnings (₹, DM Mono)
- 5 rows; "View all teachers →" link at bottom
- Range toggle: "This Month ▾"

### Lower Insights Row (4 columns)
**User Distribution** (leftmost, ~25%):
- Donut chart (Recharts `PieChart`)
- Three segments: Parents (teal, ~66%), Teachers (lavender, ~23%), Kids Profiles (yellow, ~11%)
- Center label: total user count + "Total Users"
- Legend below: segment name + count + percentage
- Range toggle: "This Month ▾"

**Growth Overview** (second, ~25%):
- Three metric cards stacked: Users, Bookings, Revenue
- Each shows: label + trend percent (green, bold) + a small sparkline (Recharts `LineChart`, tiny, no axes)
- Range label: "Last 6 Months ▾"

**Reviews Summary** (third, ~25%):
- Large average rating number (e.g. **4.8**) in DM Mono, navy
- Total reviews below (e.g. "(1,248 reviews)")
- Star rating display (filled stars in yellow/amber)
- Horizontal bar breakdown: 5★ 78%, 4★ 16%, 3★ 4%, 2★ 1%, 1★ 1%
  - Bars: teal fill, gray track, label left (star count), percentage right
- Range toggle: "This Month ▾"

**Recent Feedback** (rightmost, ~25%):
- 2 feedback entries shown
- Each: parent avatar + name, star rating (filled stars), activity name, relative timestamp (e.g. "2h ago"), comment text
- "View all →" link top-right

### Persistent Alert Strip (bottom of page, full width)
Three items in a horizontal strip (light background, subtle border-top):
1. "You have **8 teachers pending verification**" — teal icon, "Review Now" button (teal outlined)
2. "**3 refund requests** need your attention" — amber icon, "View Requests" button (amber outlined)
3. "New feature: Growth Insights Report is live" — green icon, "Check Now" button (gray outlined)

Counts must be real data from the API. Strip should not show an item if its count is 0.

### Socket.io
- Client connects on dashboard shell layout mount
- Connection event logged (dev) but no live event handlers needed yet in this phase

### Success Criteria
- All 5 KPI cards show real data with correct INR formatting (₹ symbol + comma separators)
- Revenue and Bookings overview charts render with real data and support time range switching
- User Signups bar chart renders (mock data acceptable in this phase if API not ready)
- Donut chart center totals match the sum of their segments
- Trend deltas show green arrow for positive, red for negative
- Recent bookings table shows last 5 bookings with correct status badge colors
- Alert strip shows teacher verification count and refund request count from live API; hides item if count is 0
- Page uses loading skeletons during data fetch — no blank flash
- Dashboard first contentful paint feels immediate at typical broadband speeds
- Socket.io connection confirmed in browser network tab

---

## Phase 3: Bookings + Teachers (Core Operations)
Goal: ops staff can find any booking, change its status, assign a teacher, and manage teacher onboarding.

### Bookings (`/bookings`)
- Full-width filterable table
- Columns matching the reference: Booking ID, Child & Activity (avatar + name + age), Teacher (avatar + name + star rating), Date & Time, Status badge, Amount (₹, DM Mono)
- Filter bar above table: Status dropdown, Teacher search, Date range picker, Activity title search
- Sticky header, 48px row height, alternating row colors
- Server-side pagination, page size 25, page controls at bottom
- Loading skeleton rows, empty state ("No bookings match your filters"), error state

**Booking Detail (`/bookings/[id]`)**
- Full booking info: parent, child, teacher, activity, slot date/time, session type (1:1 or group), amount, discount applied
- Current status displayed prominently with semantic badge
- Status transition controls: shows current status → next valid status, requires confirm dialog
- Manual teacher assignment: searchable teacher dropdown, shows teacher name + rating + availability
- Notes field for admin observations (saved to booking record)
- Link back to booking list

**Bulk Assignment**
- Row checkboxes on bookings table
- Bulk action bar appears (bottom of viewport) when ≥1 row selected: "Assign Teacher" + selected count + "Clear selection"
- Bulk assign: teacher search dropdown → confirm → applies to all selected unassigned bookings

### Teachers (`/teachers`)
- Teacher list table: avatar + name, city, rating (star + number), session count, status badge (Verified / Pending / Suspended)
- Filter: status, city, rating range
- "Pending Verification" tab pre-filters to pending teachers

**Teacher Verification Queue (`/teachers/verification`)**
- List of teachers with documents submitted, sorted by submission date (oldest first)
- Each row: teacher name, submitted date, document status (ID / qualification / background check)
- Verify action: explicit confirm step — shows teacher name and "This will mark [Name] as verified"
- Verification logs admin ID + timestamp (auditable)

**Teacher Detail (`/teachers/[id]`)**
- Profile: avatar, name, city, bio, skills, rating trend (Recharts `LineChart`, last 6 months)
- Assigned sessions table: session date, child, activity, status, rating given
- Payout history: date, amount, status
- Suspend action (admin): requires reason text input + confirm — shows current status clearly before acting

### SOS Handling (implement in this phase — safety-critical)
- Socket.io `sos.triggered` event handled on dashboard layout component mount (present on all `/dashboard/*` routes)
- On event: render full-screen overlay above all content (z-index highest)
- Overlay content:
  - Red/coral header bar: "🚨 SOS Alert — Immediate Attention Required"
  - Child name + age
  - Parent name + phone number (formatted, clickable `tel:` link)
  - Teacher name + phone number
  - Activity name + session address (prominent — this is where they physically are)
  - Booking ID
  - Timestamp of trigger
- Two actions only: **"Acknowledge"** (teal, primary) and **"Call Parent"** (`tel:` link styled as coral button)
- Overlay cannot be dismissed by Escape key or clicking outside — only via Acknowledge
- On Acknowledge: overlay collapses to a persistent amber banner at top of page
  - Banner: "SOS acknowledged — [Child name]'s session. Monitor and follow up."
  - Banner stays until page is navigated or manually dismissed via × button
- Acknowledge action POSTs to API with admin ID + timestamp (audit trail)

### Success Criteria
- Ops can find a booking by booking ID, parent name, or teacher name in under 10 seconds using the filter bar
- Status change requires an explicit confirmation dialog showing before and after status
- Teacher assignment on a booking is reflected immediately without full page reload
- Teacher verification logs the acting admin's identity (visible in teacher detail)
- Bulk assignment applies to all selected bookings; shows a success toast with count
- SOS overlay appears within 2 seconds of the Socket.io event firing
- SOS overlay cannot be closed by clicking outside or pressing Escape
- Acknowledge action is recorded and retrievable via audit trail

---

## Phase 4: Payments + Quality + Users
Goal: ops can process refunds, manage payouts, triage bad sessions, and look up any user.

### Payments (`/payments`)
**Payment Ledger**
- Table: parent name, booking ID, amount (₹, DM Mono), payment method, status badge, date
- Filter: status, date range, payment method
- Row click → payment detail drawer or modal

**Payout Queue**
- Separate tab or section on `/payments`
- Teacher payouts pending dispatch: teacher name, session count, amount (₹), T+2 estimated date
- Dispatch action: `super_admin` only — button not rendered at all for `admin` role (SSR check, not CSS hide)
- Dispatch confirm: shows total amount, teacher name, and "This cannot be undone" warning

**Disputes (`/payments/disputes`)**
- Open disputes table: parent name, booking ID, disputed amount, reason, date raised
- Admin notes field per dispute: saves without page navigation
- Refund approval action: any `admin` — shows exact amount + reason before confirm
- Resolved disputes filterable from the same table

### Reviews & Feedback (`/reviews`)
- All post-session reviews table: sortable columns — teacher, activity, rating (asc default), date
- Status color: < 4 stars highlighted in red row tint
- Filter by teacher name, parent name, activity title, rating range
- Flag session action: marks booking for follow-up, visible in booking detail
- Low-rating queue: filtered view of ratings < 4, with intervention notes field

### Users (`/users`)
- Parent + child directory table
- Search: parent name, phone number, child name
- Columns: parent name + avatar, phone, booking count, last active, account status
- Expandable row or linked child chip: child name, age, linked activity history summary

### Success Criteria
- Payout dispatch button is not rendered (not just hidden) for `admin` role — verified with a test `admin` session
- Refund approval confirm dialog shows exact ₹ amount and reason text
- Dispute notes field saves on blur or explicit save button without navigating away
- Low-rating queue is sorted with lowest ratings first by default
- User search returns results debounced at 300ms, results within 500ms on broadband
- Flagging a session is reflected in the booking detail page without a hard refresh

---

## Phase 5: Content Management
Goal: ops can manage the product catalogue, create offers, and send operational notifications.

### Activities (`/activities`)
- Activity list: title, category, age range, price, published status toggle
- Create activity (`/activities/new`): title, description, age range (min/max), price, category dropdown, image upload
- Edit activity (`/activities/[id]`): same form pre-populated
- Publish/unpublish toggle: optimistic UI — toggles immediately, reverts on API error
- Age group management inline on activity form

### Coupons & Offers (`/coupons`)
- Coupon list: code, type (flat ₹ / percent), value, expiry date, usage count / max uses, active badge
- Create coupon form: code, discount type, value, max uses, expiry date
- Deactivate coupon: confirm step, immediate effect

### Notifications (`/notifications`)
- Template list: key, channel (Push / WhatsApp / Email), preview text, last sent timestamp
- Delivery log tab: user name, template, channel, sent at, status (Delivered / Failed)
- Operational send: target by role or specific user — confirm before sending

### Success Criteria
- New activity can be created and published end-to-end in under 3 minutes
- Unpublished activities do not appear in parent-app/web catalog (verified via API spot-check)
- Coupon deactivation causes the code to fail at checkout within 30 seconds
- Notification delivery log shows real status from the send provider (not just "queued")

---

## Phase 6: Analytics + System
Goal: leadership can measure platform performance; `super_admin` can configure and audit the system.

### Analytics — Overview (`/analytics`)
- Revenue trend card, booking funnel summary, engagement summary — same component patterns as dashboard charts

### Analytics — Revenue (`/analytics/revenue`)
- INR revenue by day/week/month (Recharts `LineChart` + data table below)
- Export to CSV: date range picker → download button → valid CSV with ₹ amounts and ISO dates

### Analytics — Engagement (`/analytics/engagement`)
- Signup trend (bar chart), first-booking conversion rate, repeat booking rate
- Cards showing absolute numbers + trend delta

### Analytics — Reports (`/analytics/reports`)
- Report type selector (Revenue / Bookings / Teacher Performance / User Growth)
- Date range picker
- Generate + download as CSV

### Settings (`/settings` — `super_admin` only)
- System configuration — every field change shows current value → new value before saving
- Destructive settings require reason input + confirm dialog

### Audit Logs (`/audit-logs` — `super_admin` only)
- Paginated table: actor (admin name), action type, target entity (booking ID / teacher name / etc.), old value, new value, timestamp
- Non-editable read-only surface
- Filter by actor, action type, date range

### Success Criteria
- Revenue chart totals match the payment ledger for the same date range (spot-check 3 periods)
- CSV export produces a valid file; ₹ amounts use numeric format (no ₹ symbol in cells, separate currency column)
- Settings page returns 403 for `admin` role at the SSR level (not a client redirect)
- Audit log contains entries for: every status change from Phase 3, every refund approval from Phase 4, every payout dispatch from Phase 4
- All analytics charts support This Week / This Month / Last 3 Months / Last 6 Months ranges

---

## Design Direction

### Layout (from reference)
- Sidebar: 220px fixed, bg `#0F172A`, active item bg `#1E3A5F` + 3px teal left border, white text
- Topbar: white bg, search bar with icon, date chip (calendar icon + date + dropdown arrow), bell with badge
- Content canvas: bg `#F8FAFC`, max-width 1440px, 24–32px padding
- Cards: white bg, `border-radius: 16px`, shadow `0 2px 12px rgba(0,0,0,0.08)`
- Decorative sidebar illustration: child + toy bear + stars (bottom of sidebar, above admin identity)

### Typography
- Interface text: DM Sans
- Metrics, currency amounts, KPI numbers: DM Mono
- KPI values: large (36px+), navy (`#1E293B`)
- Section labels: small caps or small bold, medium gray (`#64748B`)

### Color usage (match reference exactly)
- Primary actions: teal (`#1787A6`)
- Revenue chart primary series: teal
- Revenue chart secondary series (Bookings count): warm yellow/orange
- Bookings donut segments: teal (Completed), amber (Upcoming), coral (Cancelled), lavender (Rescheduled)
- User signups bars: coral/pink
- Trend delta positive: green (`#22C55E`) with ↑ arrow
- Trend delta negative: red (`#EF4444`) with ↓ arrow
- KPI icon circles: soft tinted backgrounds (not solid), outlined icons

### What to avoid
- Dark-mode-first content area (sidebar dark, content always light)
- Decorative gradients on charts — reduces legibility
- Icon-only controls for any risky action — always label them
- Hiding `super_admin` features with CSS — SSR role check only

---

## Open Dependencies
- `@beam/ui-web`: `Button`, `Input`, `Badge`, `DataTable`, `StatCard`, `ChartCard`, `BulkActionBar`, `SessionCalendar`
- `@beam/ui-tokens`: all color, spacing, radius, typography values
- `@beam/hooks/admin`: all data fetching and mutation hooks
- `@beam/api-client`: admin endpoints
- `@beam/schemas`: form validation and types
- Backend: all modules in `apps/api/src/modules/`
- Socket.io server emitting: `sos.triggered`, `booking.created`, `booking.updated`, `payment.failed`, `session.started`, `session.completed`

---

## Build Order Recommendation
1. Auth + layout shell + sidebar + role guard (Phase 1)
2. KPI cards + Revenue/Bookings/Signups charts (Phase 2 — connect to real data)
3. **SOS handling** (Phase 3 — do this before any other Phase 3 work — safety-critical)
4. Bookings table + detail + status controls (Phase 3)
5. Teacher list + verification queue + teacher detail (Phase 3)
6. Alert strip + lower dashboard row (Phase 2 — finish dashboard)
7. Payments ledger + payout queue + disputes (Phase 4)
8. Reviews triage + users directory (Phase 4)
9. Activities + coupons + notifications (Phase 5)
10. Analytics pages + CSV export (Phase 6)
11. Settings + audit logs — super_admin only (Phase 6)

---

## Notes
- Build operations pages before analytics — the bookings queue and teacher verification unblock
  daily Beam ops from day one; analytics is a leadership tool that can wait
- SOS must be production-ready before the platform goes live with real sessions
- Every table requires loading skeleton, empty state, and error state before that table is "done"
- Mock data is acceptable for charts in Phase 2 if the API is not ready, but must be replaced
  before Phase 6 is considered complete
- Verify `super_admin`-only surfaces with an actual `admin` role test session — visual inspection is not sufficient
- INR formatting rule: ₹ symbol + comma separators (e.g. ₹24,58,000) — use Indian numbering system (lakh, crore grouping), not Western thousands grouping
