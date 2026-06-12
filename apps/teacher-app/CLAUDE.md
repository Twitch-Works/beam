# apps/teacher-app/CLAUDE.md

## What This App Is
Teacher-facing React Native mobile app. Teachers manage onboarding, availability,
accepted sessions, pre-session checklists, live session status, completion notes,
earnings, and profile details. iOS + Android via Expo.

This app is operational and session-first. Optimize for teachers who are moving
between homes, checking what is next, and completing required actions quickly.

## Stack
- React Native + Expo SDK 51 + Expo Router v3
- @beam/ui-native (components + tokens)
- @beam/hooks/teacher (all data fetching)
- @beam/api-client (typed API calls, only inside hooks/services)
- @beam/schemas (Zod types - source of truth)

---

## Workspace Reality Check

If this folder still contains copied parent-app routes such as `explore`, `kids`,
`slots`, `payment`, or `activity`, treat them as scaffold leftovers. Replace them
with teacher flows before adding new teacher features on top of them.

Trust the actual filesystem when navigating, but use this document as the target
contract for teacher-app architecture.

---

## Intended Folder Structure

```
apps/teacher-app/
|-- app/
|   |-- _layout.tsx                    # Root: fonts, auth provider, query client, Socket.io init
|   |-- (auth)/
|   |   |-- index.tsx                  # Splash / auth resolver
|   |   |-- login.tsx                  # Phone number entry
|   |   |-- otp.tsx                    # OTP verification
|   |   `-- onboarding/
|   |       |-- profile.tsx            # Name, city, languages
|   |       |-- verification.tsx       # KYC, background check, documents
|   |       |-- skills.tsx             # Activity categories, age groups
|   |       `-- availability.tsx       # Weekly availability setup
|   `-- (root)/
|       |-- _layout.tsx                # Bottom tab navigator + teacher auth guard
|       |-- index.tsx                  # Dashboard: today, pending actions, next session
|       |-- sessions.tsx               # Upcoming + past sessions
|       |-- checklist.tsx              # Pre-session checklist queue
|       |-- earnings.tsx               # Payout summary + history
|       |-- profile.tsx                # Teacher profile + settings
|       `-- session/
|           |-- [bookingId].tsx        # Session detail
|           |-- start/[bookingId].tsx  # Start session, OTP/location confirmation
|           |-- complete/[bookingId].tsx # Completion notes + child progress
|           `-- sos/[bookingId].tsx    # Emergency / support actions
|-- src/features/
|   |-- auth/
|   |-- onboarding/
|   |-- dashboard/
|   |-- sessions/
|   |-- checklist/
|   |-- availability/
|   |-- earnings/
|   `-- profile/
`-- src/components/                    # App-specific only - shared goes in @beam/ui-native
```

---

## Bottom Tabs

```
Dashboard | Sessions | Checklist | Earnings | Profile
```

- Height: 83px, safe-area aware
- Active: filled teal icon + teal label
- Inactive: outlined gray icon + gray label
- Icons: Ionicons (outlined default, filled when active)
- Keep tab labels short; teacher workflows happen in busy contexts

---

## Auth Flow

```
Splash -> Phone Entry -> OTP Verify -> Teacher Onboarding -> Dashboard
```

- Auth handled by Supabase Auth (OTP -> JWT with role: teacher)
- JWT stored in SecureStore, never AsyncStorage
- On cold start: check SecureStore, validate role claim, then route
- Auth guard lives in `app/(root)/_layout.tsx`
- Do not let parent/admin role tokens enter teacher screens

Onboarding is incomplete until required teacher verification fields are present:
- Basic profile
- KYC / identity documents
- Background verification status
- Skill categories and supported child age ranges
- Availability
- Bank or payout details, when required by the backend schema

---

## Data Fetching Rules

Always use hooks from `@beam/hooks/teacher`. Never call api-client directly in
screen files.

```typescript
// CORRECT
import { useTeacherSessions } from '@beam/hooks/teacher'
import { useTeacherAvailability } from '@beam/hooks/teacher'
import { useTeacherEarnings } from '@beam/hooks/teacher'

// WRONG
import { api } from '@beam/api-client'
```

Stale times (do not override without reason):
- Today dashboard: 30s
- Upcoming sessions: 30s
- Checklist queue: 30s
- Availability: 2 min
- Earnings summary: 2 min
- Profile and verification status: 5 min

Use optimistic updates only for low-risk local actions such as checklist item
completion. Do not optimistic-update session start, session completion, payout,
or verification state unless the shared hook already owns that behavior.

---

## Performance Rules

- Lists: FlashList only (`@shopify/flash-list`) - never FlatList
- Images: `expo-image` only - never React Native `Image`
- Haptics: `expo-haptics` on every primary button press
- Memoize list item components with `React.memo`
- No inline functions in FlashList `renderItem`

```typescript
const renderItem = React.useCallback(
  ({ item }: { item: TeacherSession }) => <SessionCard session={item} />,
  []
)

<FlashList data={sessions} renderItem={renderItem} estimatedItemSize={160} />
```

---

## Token Usage

Never hardcode colors, spacing, font sizes, shadows, or radii. Always import from
`@beam/ui-tokens`.

```typescript
import { colors, radius, spacing } from '@beam/ui-tokens'

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
  },
})
```

Use `StyleSheet.create` for screen and component styles. Inline styles are only
acceptable for dynamic one-off values that cannot be represented cleanly in a
StyleSheet.

---

## Component Rules

Use `@beam/ui-native` atoms, molecules, and organisms wherever possible. Only
create app-specific components in `src/components/` when they are truly
teacher-app-only.

```typescript
import {
  Avatar,
  Badge,
  BookingCard,
  Button,
  ChecklistGroup,
  EmptyState,
  ErrorState,
  Input,
  SOSButton,
  Spinner,
  Tag,
} from '@beam/ui-native'
```

Teacher-app-specific candidates:
- `TodaySessionCard`
- `AvailabilityEditor`
- `EarningsSummaryCard`
- `VerificationStatusPanel`
- `SessionStartSheet`
- `CompletionNotesForm`

If a component could be shared with parent-app or teacher-web equivalents, add it
to the appropriate shared package instead of burying it here.

---

## Session Lifecycle

```
Pending/Accepted -> Pre-session Checklist -> Travel/Ready -> Start -> In Progress -> Complete -> Notes Submitted
```

Teacher app responsibilities:
- Show today's next session prominently on the dashboard
- Surface required checklist items before session start
- Confirm teacher arrival/start using backend-approved checks
- Keep active session state visible until completion
- Submit completion notes, attendance, progress tags, and optional follow-up
- Show SOS/support actions during the active session window

Never put session lifecycle business rules directly in screens. Screens should
call teacher hooks, render states, and navigate based on typed responses.

---

## Pre-Session Checklist

Checklist is required for upcoming sessions when the backend marks items as
mandatory.

- Use `ChecklistGroup` from `@beam/ui-native` when available
- Persist item completion through `@beam/hooks/teacher`
- Render cached checklist data offline with a clear sync indicator
- Disable session start if mandatory checklist items are incomplete and schema
  says they are blocking

Do not invent checklist item shapes locally. Add or update schemas in
`packages/schemas/` first.

---

## Availability

Availability editing belongs in teacher-app, but the canonical data shape belongs
in `@beam/schemas`.

- Weekly recurring availability uses schema types
- Exceptions and blackout dates use schema types
- Validate overlaps before submit when the shared hook exposes helpers
- Server remains source of truth for final availability acceptance

Avoid screen-local date/time parsing hacks. Use shared schema transforms or a
date utility already present in the repo.

---

## Earnings

Earnings screens show payout-oriented information, not accounting internals.

Required states:
- Upcoming estimate
- Completed sessions awaiting payout
- Paid payouts
- Failed or held payouts, with support CTA

Never display raw Razorpay or banking error payloads to users. Map errors to
safe, teacher-readable messages.

---

## Offline Behavior

Teacher app must be useful with weak connectivity.

- Dashboard and sessions: render cached data with last-updated indicator
- Checklist: allow local completion only if the hook supports queued sync
- Start/complete session: require fresh server confirmation
- Earnings: render cached read-only data
- Profile edits and KYC upload: require connectivity

Show clear sync states. Never imply a session has started or completed until the
server confirms it.

---

## Push Notifications

Handled by Expo Notifications + FCM. Token registered on login and stored
server-side through the teacher profile/update hook.

Teacher notification types:
```
booking.assigned          -> dashboard
booking.cancelled         -> sessions
session.reminder_24h      -> session detail
session.reminder_1h       -> session detail + checklist
session.reminder_5min     -> session start screen
session.parent_sos        -> session SOS/support screen
payout.processed          -> earnings
payout.failed             -> earnings
verification.approved     -> profile
verification.rejected     -> profile verification
```

Deep link format:
```
beam://teacher/session/{bookingId}
beam://teacher/checklist/{bookingId}
beam://teacher/earnings
beam://teacher/profile
```

---

## Error Handling

Every screen must handle loading, error, empty, and offline/cached states.

```typescript
if (isLoading) return <Spinner />
if (isError) {
  return <ErrorState onRetry={refetch} message="Couldn't load sessions" />
}
if (!sessions?.length) {
  return <EmptyState message="No sessions yet" cta="Review availability" />
}
```

Use `ErrorState` and `EmptyState` from `@beam/ui-native`. Never show raw API,
database, Razorpay, Supabase, or verification-provider errors to users.

---

## Security and Safety

- Teacher screens require JWT role claim `teacher`
- Never expose parent personal details beyond what the session schema permits
- Mask phone numbers unless calling is explicitly allowed for that session state
- Use `Linking.openURL('tel:...')` only when the backend/session state allows it
- SOS and support flows must remain reachable during active sessions
- Never store KYC documents or sensitive uploads outside approved upload flows

---

## DO NOTs

- Never import from `@beam/hooks/parent` or `@beam/hooks/admin`
- Never call `api-client` directly in screen or component files
- Never define teacher/session data types inline; use `@beam/schemas`
- Never use FlatList; use FlashList
- Never use React Native `Image`; use `expo-image`
- Never hardcode colors, spacing, font sizes, shadows, or radii
- Never put business rules in route files
- Never display raw backend/provider error messages to teachers
