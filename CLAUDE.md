# Beam — Root Context

## What is Beam
Three-sided ed-tech marketplace: Parents book at-home activities for children, delivered by verified Teachers. India-first. Five client apps + one API backend in this monorepo.

## The 5 Apps
```
apps/parent-app/     → React Native (Expo)   — Parent mobile app (iOS + Android)
apps/parent-web/     → Next.js 14            — Parent web app (same flows, browser)
apps/teacher-app/    → React Native (Expo)   — Teacher mobile app (iOS + Android)
apps/teacher-web/    → Next.js 14            — Teacher web app (same flows, browser)
apps/admin/          → Next.js 14            — Admin + Ops dashboard (web only)
apps/api/            → Fastify 4             — Backend API + BullMQ workers
```

## Shared Packages
```
packages/schemas/        → ⭐ SOURCE OF TRUTH — all Zod schemas + inferred TS types
packages/ui-native/      → React Native shared components + Beam design tokens (mobile)
packages/ui-web/         → React shared components + Beam design tokens (web)
packages/ui-tokens/      → Raw token values shared by both ui-native and ui-web
packages/api-client/     → Type-safe API client (Axios, typed from @beam/schemas)
packages/hooks/          → Shared TanStack Query hooks (grouped by role)
packages/config/         → Env validation via Zod — ONLY place to read process.env
packages/types/          → Shared TS interfaces not covered by schemas
packages/testing/        → Vitest factories, test utilities, mock builders
```

## Context Engineering
```
.claude/agents/          → Subagents (security, schema, test, boundary)
.claude/commands/        → Slash commands (/new-feature, /catchup, /pr-review)
docs/ADR/                → Architecture Decision Records
```

## App ↔ Package Dependency Map
```
parent-app   → @beam/ui-native, @beam/api-client, @beam/hooks/parent,  @beam/schemas
parent-web   → @beam/ui-web,    @beam/api-client, @beam/hooks/parent,  @beam/schemas
teacher-app  → @beam/ui-native, @beam/api-client, @beam/hooks/teacher, @beam/schemas
teacher-web  → @beam/ui-web,    @beam/api-client, @beam/hooks/teacher, @beam/schemas
admin        → @beam/ui-web,    @beam/api-client, @beam/hooks/admin,   @beam/schemas
api          → @beam/schemas, @beam/config
```

---

## Workspace Reality Check

This root document describes the intended Beam architecture, design system, and file layout.
In this workspace snapshot, some apps and packages may be partially scaffolded or missing.

Agent rule:
- Trust the filesystem over this document when they disagree
- Treat missing files in the registry as planned architecture, not guaranteed current files
- If a required shared package is missing, scaffold it first or note the dependency explicitly before building on top of it

## Design System & Theme

All visual values should live in `packages/ui-tokens/`. Never hardcode colors, spacing,
font sizes, or radii anywhere in app code once the token package exists. Always import from tokens.
If `packages/ui-tokens/` is not yet scaffolded in the current workspace, create it before adding
new shared UI work instead of scattering one-off values across apps.

### Brand Identity
```
Product name : Beam
Logo         : "beam" coral/pink script wordmark + shooting star + rainbow arc
Personality  : Joyful · Trusted · Nurturing · Safe · Expert-backed · Indian families
```

### Color Palette (exact hex — use these everywhere)
```
Primary Teal      #1787A6   CTAs, active tabs, primary buttons, links, icons
Mint              #E5F7F4   Teal bg fills, selected state bg, tag fills
Warm Yellow       #FCB857   Star ratings, streak badges, highlights, warnings
Coral             #FF7A59   Alerts, SOS button, urgent actions, accent cards
Lavender          #A7BBFA   Secondary badges, skill tags, decorative accents
Navy              #1E293B   Primary headings, body text, dark backgrounds
Medium Gray       #64748B   Secondary text, captions, placeholders, dividers
Light Gray        #F8FAFC   Page backgrounds, input fills, inactive states
White             #FFFFFF   Card surfaces, modal backgrounds, button text
Success Green     #22C55E   Completed sessions, verified badges, success states
Error Red         #EF4444   Cancellations, errors, destructive actions
```

### Semantic Status Colors (use EXACTLY these — consistent across all 5 apps)
```
Upcoming    bg #FEF3C7  text #92400E   (amber — scheduled, not yet confirmed)
Confirmed   bg #DCFCE7  text #166534   (green — teacher accepted)
Completed   bg #E5F7F4  text #0F4C5C   (teal — session done)
Cancelled   bg #FEE2E2  text #991B1B   (red — cancelled)
Rescheduled bg #EDE9FE  text #5B21B6   (lavender — moved)
Pending     bg #FEF3C7  text #92400E   (amber — awaiting action)
```

### Typography
```
Font family  : Nunito Rounded (Google Fonts) — all apps (mobile + web)
Admin only   : DM Sans for UI text + DM Mono for metric numbers

Scale:
  display   36px  700   Hero numbers (earnings, KPI metrics)
  h1        28px  700   Screen/page titles
  h2        22px  700   Section headings
  h3        18px  600   Card titles, modal headers
  body-lg   16px  400   Primary body text, descriptions
  body      14px  400   Secondary text, list items, form labels
  caption   12px  500   Timestamps, metadata, helper text, tags
  micro     11px  400   Footnotes, legal text

Color rules:
  Headings   → Navy (#1E293B)
  Body       → Navy (#1E293B)
  Secondary  → Medium Gray (#64748B)
  Links      → Primary Teal (#1787A6)
  On teal bg → White (#FFFFFF)
  Prices     → Primary Teal, weight 700
  Metrics    → DM Mono (admin), Nunito Rounded (mobile/web)
```

### Spacing System (8pt grid — never go off-grid)
```
4px   xs    Tight internal gaps (icon to label)
8px   sm    Between inline elements, tag padding
12px  md-s  Small component padding
16px  md    Standard component padding, section gaps
24px  lg    Card padding, between cards
32px  xl    Section separations
48px  2xl   Page section separations
64px  3xl   Hero sections
```

### Border Radius
```
4px    Tags, status badges
8px    Input fields, small buttons, chips
12px   Medium buttons, secondary cards
16px   Primary cards, modal content areas
20px   Hero cards, feature cards
24px   Bottom sheets (top corners), large modals
50%    Avatars (always circular)
```

### Shadows
```
card      0 2px 12px rgba(0,0,0,0.08)
modal     0 8px 32px rgba(0,0,0,0.16)
button    0 4px 12px rgba(23,135,166,0.30)
tab-bar   0 -1px 8px rgba(0,0,0,0.06)
```

### Component Rules
```
Buttons
  Primary   : Teal bg, white text, radius 12px, 48px min height (mobile) / 40px (web)
  Secondary : White bg, teal border, teal text
  Ghost     : Transparent, teal text, no border
  Danger    : Coral bg, white text
  Disabled  : Gray bg #E2E8F0, gray text — never fake-active styling

Inputs
  Height    : 48px mobile, 40px web/admin
  Border    : 1px #E2E8F0, focus → 2px teal
  Radius    : 12px mobile, 8px web

Icons
  Style     : Outlined only (Ionicons mobile, Lucide web/admin)
  Active tab: Filled teal
  Size      : 20px inline, 24px navigation, 18px admin sidebar

Bottom Tab Bar (mobile only)
  Height    : 83px safe-area aware
  Tabs      : Home · Explore · Bookings · Kids · Profile (parent)
              Dashboard · Sessions · Checklist · Earnings · Profile (teacher)
  Active    : Filled teal icon + teal label
  Inactive  : Outlined gray icon + gray label

Mobile performance rules
  Lists     : FlashList only (@shopify/flash-list) — never FlatList
  Images    : expo-image only — never React Native Image
  Haptics   : expo-haptics on all primary button presses

Admin layout
  Sidebar   : 220px fixed, bg #0F172A, active item bg #1E3A5F + 3px teal left border
  Content   : bg #F8FAFC, max-width 1440px
  Tables    : 48px row height, alternate white/#F8FAFC, hover #F1F5F9
  Charts    : Recharts — teal primary series, lavender secondary series
```

### Token Import Pattern
```typescript
// Mobile (parent-app, teacher-app)
import { colors, spacing, typography, radius, shadows } from '@beam/ui-tokens'
style={{ color: colors.primary, padding: spacing.md }}

// Web — also exposed as CSS custom properties
var(--color-primary)   → #1787A6
var(--color-mint)      → #E5F7F4
var(--color-coral)     → #FF7A59
var(--color-navy)      → #1E293B
var(--spacing-md)      → 16px
var(--radius-card)     → 16px

// Never:
❌ style={{ color: '#1787A6' }}       // hardcoded hex
❌ style={{ padding: 16 }}            // magic number
❌ className="text-[#1787A6]"         // Tailwind arbitrary brand colors
```

---

## Stack
```
Mobile apps : React Native + Expo SDK 51 + Expo Router
Web apps    : Next.js 14 App Router + React 18
API         : Fastify 4 + Drizzle ORM + PostgreSQL + pgvector
Auth        : Supabase Auth → OTP → JWT (role claim: parent|teacher|admin|super_admin)
Payments    : Razorpay (India/UPI + cards)
Cache       : Redis via Upstash (sessions, slot locks, listing cache)
Jobs        : BullMQ on Redis (reminders, notifications, payouts)
Realtime    : Socket.io (session status, SOS, booking updates)
Monorepo    : Turborepo + pnpm workspaces
Validation  : Zod (shared schemas) + TypeScript strict
Linting     : Biome
Testing     : Vitest + Supertest + Detox (mobile E2E)
```

---

## The 3 Non-Negotiable Rules

**1. Schema first.**
Check `packages/schemas/` before writing any feature. No schema = create it there first.
Never define data types inline in app or service files.

**2. Module boundaries.**
Only import from a module's `index.ts` barrel. Never reach into `.repository.ts` or
internal files from outside the module.

**3. Layer order (API only).**
Route → Service → Repository.
Business logic never in routes. DB queries never in services.

---

## Execution Principles

Use these principles on every non-trivial task. They are meant to improve judgment,
reduce unnecessary churn, and keep Beam changes aligned with product reality.

### 1. Think Before Coding
- Do not silently choose an interpretation when requirements are ambiguous
- State assumptions explicitly when the codebase or docs conflict
- Check the nearest app or module `CLAUDE.md` before inventing patterns
- If root docs and filesystem disagree, trust the filesystem and call out the mismatch
- For cross-app features, identify all affected apps and shared packages before editing

### 2. Simplicity First
- Write the smallest change that satisfies the request
- Do not add speculative abstractions, config, or reuse layers without a second use case
- Prefer boring, readable code over clever architecture
- Match Beam's existing patterns instead of introducing a new local pattern per feature
- If mock data is enough for the current phase, use mocks instead of prematurely wiring live integrations

### 3. Surgical Changes
- Touch only files required for the task
- Do not refactor adjacent code unless the task depends on it
- Do not remove unrelated comments, code, or registry entries just because they look stale
- If you notice drift or dead code outside the task, mention it separately instead of cleaning it opportunistically
- Every changed line should trace back to the user request or a direct dependency of that request

### 4. Goal-Driven Execution
- Turn tasks into clear outcomes with verification steps
- For UI work: define what screen, state, or interaction should exist when done
- For API work: define route, schema, service, and repository success criteria up front
- For bug fixes: reproduce first if possible, then verify the fix explicitly
- For larger work: break delivery into PR-sized slices that can be reviewed independently

### 5. Verify Before Declaring Done
- Run the smallest meaningful verification available: typecheck, test, lint, or visual inspection
- Say clearly what was verified and what was not
- If verification is blocked by missing infrastructure, use mocks or note the blocker explicitly
- Do not claim integration is complete when only scaffolding or mock flows exist

### 6. Keep Docs Honest
- Update the file registry when creating or meaningfully changing significant files
- Mark planned structure as planned if it does not yet exist in the workspace
- Keep app-level `CLAUDE.md` files aligned with root intent, but let app-level docs be more specific
- When docs are wrong, fix them as part of the work or call out the inconsistency clearly

---

## File Registry — Keep This Updated

Every significant file you create or meaningfully modify must have its one-line summary
maintained in the registry below. This lets the agent instantly orient to the codebase
without opening individual files.

**Agent instruction:** When you finish implementing a file, add or update its entry in
the correct section. Format: `path/to/file.ts — what it does (key exports or behavior)`
Do not remove entries. If a file is deleted, mark it `[removed]`.

Important:
- This registry mixes existing files and planned target structure
- Before editing or importing, verify that the file exists in the current workspace
- When creating a planned file for the first time, add it here as part of the same change

### packages/schemas/
```
src/user.schema.ts        — User, Parent, Teacher, Child, UserRole schemas + types
src/activity.schema.ts    — Activity, Category, ActivityFilters, AgeGroup
src/booking.schema.ts     — Booking, BookingStatus, CreateBookingInput, BookingFilters
src/slot.schema.ts        — Slot, SlotInput, SlotWithTeacher, DateRange
src/payment.schema.ts     — Payment, PaymentStatus, RefundInput, PayoutRecord
src/review.schema.ts      — Review, FeedbackInput, Rating, ChildUpdate
src/cart.schema.ts        — CartItem, CartSummary, CheckoutInput
src/discount.schema.ts    — DiscountCode, DiscountType, ApplyDiscountInput
src/notification.schema.ts — NotificationTemplate, NotificationLog
src/ai.schema.ts          — RecommendationInput, RecommendationResult
src/index.ts              — re-exports all schemas
```

### packages/ui-tokens/
```
src/colors.ts     — full color palette (primary, semantic, status colors, grays)
src/spacing.ts    — 8pt grid spacing scale xs→3xl + CSS custom properties
src/typography.ts — font sizes, weights, line heights for all text styles
src/radius.ts     — border radius values keyed by component type
src/shadows.ts    — shadow definitions (card, modal, button, tab-bar)
src/index.ts      — re-exports all tokens
```

### packages/ui-native/
```
components/atoms/Button.tsx          — primary/secondary/ghost/danger, expo-haptics on press
components/atoms/Input.tsx           — text/phone/OTP variants, focus border teal
components/atoms/Badge.tsx           — status badges using semantic status colors
components/atoms/Avatar.tsx          — circular image with fallback initials
components/atoms/Tag.tsx             — category/skill pill (mint bg, teal text)
components/atoms/Spinner.tsx         — teal loading indicator
components/molecules/ClassCard.tsx   — activity card (image, age badge, price, rating, heart)
components/molecules/BookingCard.tsx — booking summary (teacher, date, status badge)
components/molecules/TeacherCard.tsx — teacher info with star rating and skill tags
components/molecules/StarRating.tsx  — interactive + display-only star rating
components/molecules/SlotPicker.tsx  — date calendar + time slot grid selector
components/molecules/SOSButton.tsx   — floating coral emergency button (always visible in session)
components/organisms/ActivityGrid.tsx     — FlashList of ClassCards with pagination
components/organisms/ChildProfileCard.tsx — skills radar chart + badge grid + session count
components/index.ts                  — re-exports all components
```

### packages/ui-web/
```
components/atoms/Button.tsx          — web button, same API as ui-native
components/atoms/Input.tsx           — web input with 2px teal focus ring
components/atoms/Badge.tsx           — status badges (same semantic colors as native)
components/atoms/Avatar.tsx          — circular image with initials fallback
components/molecules/ClassCard.tsx   — web activity card with hover state
components/molecules/BookingCard.tsx — web booking summary card
components/molecules/DataTable.tsx   — TanStack Table v8 wrapper with sort/filter/pagination
components/molecules/StatCard.tsx    — admin KPI metric card (number + delta + label)
components/molecules/ChartCard.tsx   — Recharts card wrapper with title + time selector
components/index.ts                  — re-exports all components
```

### packages/hooks/
```
parent/useActivities.ts      — list + filter activities, staleTime 5min
parent/useActivity.ts        — single activity detail
parent/useSlots.ts           — available slots for activity+date, staleTime 30s
parent/useBookings.ts        — parent's bookings (upcoming + past), staleTime 30s
parent/useBooking.ts         — single booking detail, staleTime 30s
parent/useCart.ts            — cart mutations (add item, apply discount, calculate total)
parent/useChildren.ts        — parent's children list
parent/useChild.ts           — single child profile with skills + badges
parent/useRecommendations.ts — AI-powered next class suggestions
parent/usePayment.ts         — createIntent + confirmPayment mutations
parent/useFeedback.ts        — submit post-session feedback mutation
teacher/useAssignedSessions.ts — teacher's upcoming sessions, staleTime 30s
teacher/useSession.ts          — single session detail + child info + checklist
teacher/useSessionActions.ts   — accept/decline/start/complete mutations
teacher/useEarnings.ts         — payout history + upcoming estimate, staleTime 5min
teacher/useChecklist.ts        — session checklist state (offline-capable)
admin/useAllBookings.ts        — paginated booking list with filters, staleTime 30s
admin/useBookingDetail.ts      — full booking detail for admin view
admin/useTeachers.ts           — teacher list + verification status
admin/useTeacher.ts            — teacher detail + sessions + payouts
admin/useAssignTeacher.ts      — teacher assignment mutation
admin/useAnalytics.ts          — revenue + engagement data, staleTime 10min
admin/usePayments.ts           — payment ledger
admin/usePayouts.ts            — payout queue management
admin/useDiscounts.ts          — discount code management
shared/useProfile.ts           — current user's own profile (any role)
shared/useNotifications.ts     — in-app notification list
```

### packages/api-client/
```
src/client.ts        — Axios instance with auth token interceptor + 401 refresh + error shaping
src/bookings.ts      — api.bookings.create/get/list/cancel/feedback/rebook
src/catalog.ts       — api.catalog.list/get/search/getRecommendations
src/scheduling.ts    — api.scheduling.getSlots/lockSlot/releaseSlot
src/payments.ts      — api.payments.createIntent/confirm/refund
src/users.ts         — api.users.getProfile/updateProfile/getChildren/updateChild
src/admin.ts         — api.admin.* (all admin-only endpoints: assign, bulk, analytics)
src/index.ts         — exports `api` object with all namespaced clients
```

### apps/api/src/lib/
```
result.ts       — Result<T,E> type, ok(value), err(error) — use in ALL service returns
event-bus.ts    — Redis pub/sub: emit(eventName, payload), on(eventName, handler)
slot-lock.ts    — atomic slot locking: acquire(slotId, bookingId, ttlSeconds), release(slotId)
```

### apps/api/src/middleware/
```
auth.ts   — authenticate (verifies JWT, attaches request.user) + authorize(role) preHandler
```

### apps/api/src/modules/auth/
```
index.ts             — exports: verifyToken, getUserFromToken
auth.routes.ts       — POST /auth/otp/send, /auth/otp/verify, /auth/refresh, /auth/logout
auth.service.ts      — OTP generation/verification, JWT issuance, refresh token rotation
auth.repository.ts   — refresh token store + lookup in Redis
```

### apps/api/src/modules/booking/
```
index.ts              — exports: createBooking, getBooking, listBookings, updateBookingStatus, submitFeedback, cancelBooking
booking.routes.ts     — booking CRUD routes (role-scoped: parent/teacher/admin)
booking.service.ts    — booking lifecycle, cart logic, discount application, event emission
booking.repository.ts — Drizzle queries for bookings + cart tables
```

### apps/api/src/modules/catalog/
```
index.ts              — exports: listActivities, getActivity, getRecommendations
catalog.routes.ts     — GET /activities, /activities/:id, /recommendations
catalog.service.ts    — filtering by age/category/price, AI recommendation calls
catalog.repository.ts — Drizzle queries for activities + categories + embeddings
```

### apps/api/src/modules/scheduling/
```
index.ts                  — exports: getAvailableSlots, lockSlot, releaseSlot, createSlot, updateAvailability
scheduling.routes.ts      — slot availability + teacher calendar management routes
scheduling.service.ts     — availability logic, conflict detection, uses slot-lock.ts
scheduling.repository.ts  — Drizzle queries for slots table
```

### apps/api/src/modules/payments/
```
index.ts              — exports: createPaymentIntent, confirmPayment, processRefund, dispatchPayout
payments.routes.ts    — payment initiation + POST /webhooks/razorpay (signature verified)
payments.service.ts   — Razorpay integration, payout calculation (T+2 schedule)
payments.repository.ts — Drizzle queries for payments + payouts tables
```

### apps/api/src/modules/notifications/
```
index.ts                      — exports: send(userId, templateKey, data), scheduleReminder(bookingId, offsetMin)
notifications.service.ts      — push (Expo/FCM), WhatsApp (Meta API), email (Resend) dispatch via BullMQ
notifications.repository.ts   — notification log Drizzle queries
```

### apps/api/src/modules/users/
```
index.ts           — exports: getUser, getChildrenForParent, updateChildSkills, getTeacherProfile
users.routes.ts    — profile routes for parent, teacher, child (role-scoped)
users.service.ts   — profile management, child skill + badge updates post-session
users.repository.ts — Drizzle queries for users, children, teachers tables
```

### apps/api/src/modules/ai/
```
index.ts        — exports: getRecommendations(childId), generateSessionSummary(sessionId)
ai.service.ts   — OpenAI text-embedding-3-small + pgvector cosine similarity search
```

### apps/parent-app/src/features/
```
auth/           — OTP login flow, parent profile setup, child profile setup screens
home/           — Homepage: location bar, age filters, category grid, recommendation feed
explore/        — Category browse, search, activity grid with infinite scroll
booking/        — Activity detail, teacher profile modal, session type toggle, slot picker
cart/           — Cart summary, add-on product toggles, discount code input, price breakdown
payment/        — Razorpay checkout wrapper, booking confirmation celebration screen
dashboard/      — Upcoming sessions list with urgency indicators, past bookings, rebook CTA
kids/           — Child selector tabs, skills progress bars, radar chart, badge grid
profile/        — Parent settings, SOS button (coral floating), contact, FAQ, notifications
```

### apps/parent-web/src/app/
```
(auth)/         — Login + OTP screens, parent + child setup (multi-step, SSR session init)
(main)/         — Homepage RSC, explore page RSC (SEO-optimised activity listings)
activities/[id] — Activity detail RSC (server-side data fetch for SEO)
booking/        — Slot picker, cart, Razorpay checkout, confirmation (client components)
dashboard/      — Upcoming + past bookings with Socket.io live status updates
kids/           — Child profiles, skills, badges (client interactive)
profile/        — Parent settings, notifications preferences (client)
```

### apps/teacher-app/src/features/
```
auth/       — OTP login, teacher profile view (read-only, edit via admin)
dashboard/  — Today's sessions with accept/decline, earnings summary card, quick stats
sessions/   — Session detail (address prominent), materials checklist (offline-cached), start/end marking, offline queue for completions
earnings/   — Payout history timeline, upcoming estimate, trend chart, session breakdown
profile/    — Teacher profile, weekly availability calendar, documents, bank account
```

### apps/teacher-web/src/app/
```
(auth)/         — Login + OTP (SSR Supabase session)
(main)/         — Dashboard overview, sessions list + calendar toggle (react-big-calendar)
sessions/[id]/  — Session detail, pre-session checklist, post-session feedback form
earnings/       — Payout history with Recharts trend chart, session breakdown table
profile/        — Teacher profile, availability, documents, bank account (client)
```

### apps/admin/src/app/
```
(auth)/layout.tsx                      — Auth layout wrapper
(auth)/login/page.tsx                  — Admin login form, SSR session initialization, redirect if no admin role

(dashboard)/layout.tsx                 — Sidebar + topbar + auth/role guard shell
(dashboard)/page.tsx                   — Overview dashboard: KPI cards (5), revenue+bookings chart, donut chart, bar chart, bookings table, teacher performance

(dashboard)/users/page.tsx             — Parent + child user directory, search, filters, and detail entry
(dashboard)/teachers/page.tsx          — Teacher list + verification status, quality monitoring
(dashboard)/teachers/[id]/page.tsx     — [planned] Teacher detail, ratings, sessions, payouts
(dashboard)/teachers/verification/page.tsx — [planned] Pending verification queue

(dashboard)/activities/page.tsx        — Curriculum management: create/edit/publish activities + age groups
(dashboard)/activities/[id]/page.tsx   — [planned] Activity detail/edit
(dashboard)/activities/new/page.tsx    — [planned] Create activity workflow

(dashboard)/bookings/page.tsx          — Paginated filterable bookings table, bulk teacher assignment, booking detail modal
(dashboard)/bookings/[id]/page.tsx     — [planned] Booking detail, assignment, status controls

(dashboard)/payments/page.tsx          — Payment ledger table + payout queue management

(dashboard)/disputes/page.tsx          — Disputes and refund requests triage

(dashboard)/reviews/page.tsx           — Ratings, low-score queue, parent feedback review

(dashboard)/analytics/page.tsx         — Analytics overview dashboards
(dashboard)/analytics/revenue/page.tsx — Revenue trends and payout analytics (Recharts)
(dashboard)/analytics/engagement/page.tsx — Signup, booking funnel, repeat rate metrics
(dashboard)/analytics/reports/page.tsx — Downloadable reports and CSV exports

(dashboard)/coupons/page.tsx           — Coupons, discount codes, and offers management
(dashboard)/notifications/page.tsx     — Notification templates, campaigns, delivery logs
(dashboard)/settings/page.tsx          — System configuration (super_admin only)
(dashboard)/audit-logs/page.tsx        — Audit history and action traceability (super_admin only)
```

---

## Commands
```bash
pnpm dev                          # all 5 apps + API
pnpm dev --filter=parent-app      # parent mobile only
pnpm dev --filter=parent-web      # parent web only
pnpm dev --filter=teacher-app     # teacher mobile only
pnpm dev --filter=teacher-web     # teacher web only
pnpm dev --filter=admin           # admin web only
pnpm dev --filter=api             # API only
pnpm test                         # all tests
pnpm typecheck                    # tsc --noEmit all
pnpm lint                         # biome all
pnpm db:generate                  # drizzle-kit generate
pnpm db:migrate                   # drizzle-kit migrate
pnpm db:studio                    # drizzle studio UI
```

## Package Names (for imports)
`@beam/schemas` · `@beam/ui-native` · `@beam/ui-web` · `@beam/ui-tokens`
`@beam/api-client` · `@beam/hooks` · `@beam/config` · `@beam/types` · `@beam/testing`

---

## Module-Specific Context — Read the Closest CLAUDE.md
```
apps/parent-app/CLAUDE.md              parent mobile: RN patterns, navigation, FlashList, offline
apps/parent-web/CLAUDE.md              parent web: RSC vs client split, Supabase SSR auth
apps/teacher-app/CLAUDE.md             teacher mobile: offline-first session flow, address UX
apps/teacher-web/CLAUDE.md             teacher web: calendar view, session management
apps/admin/CLAUDE.md                   admin: tables, Recharts, role guards, Socket.io SOS
apps/api/CLAUDE.md                     API: auth pattern, service/repo layers, event bus
apps/api/src/modules/{name}/CLAUDE.md  per-module: public API contract, status rules, DO NOTs
packages/schemas/CLAUDE.md            schema writing: 4-type pattern (base/input/filter/update)
packages/ui-native/CLAUDE.md          mobile components: StyleSheet rules, token usage, memo
packages/ui-web/CLAUDE.md             web components: parity rules, admin-only components
packages/hooks/CLAUDE.md              hook patterns, query key constants, stale time table
```

## Subagents
```
security-reviewer   auth bypass, PCI compliance, data leaks, role escalation, webhook sigs
schema-validator    Zod usage, inline types, schema drift, wrong import paths
test-writer         unit + integration + component tests following Beam patterns
boundary-checker    cross-module imports, layer violations, cross-app imports, process.env
```

## Slash Commands
```
/new-feature {desc}   identifies all 5 affected apps, schema check, writes SPEC.md first
/catchup              restores context after /clear (git diff + SPEC.md + TODO.md)
/pr-review            all 4 subagents + cross-app parity check + summary report
```
