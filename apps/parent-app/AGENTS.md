```markdown
# apps/parent-app/CLAUDE.md

## What This App Is
Parent-facing React Native mobile app. Parents discover activities, book sessions, pay, track their child's progress, and rebook. iOS + Android via Expo.

## Stack
- React Native + Expo SDK 54 + Expo Router v6
- @beam/ui-native (components + tokens)
- @beam/hooks/parent (all data fetching)
- @beam/api-client (typed API calls)
- @beam/schemas (Zod types — source of truth)

---

## Folder Structure

```
apps/parent-app/
├── app/
│   ├── _layout.tsx              # Root: fonts, auth provider, Socket.io init
│   ├── (auth)/
│   │   ├── index.tsx            # Splash screen
│   │   ├── login.tsx            # Phone number entry
│   │   ├── otp.tsx              # OTP verification
│   │   ├── parent-profile.tsx   # Name + location setup
│   │   └── child-profile.tsx    # Child name + age + interests
│   └── (root)/
│       ├── _layout.tsx          # Bottom tab navigator + auth guard
│       ├── index.tsx            # Home feed
│       ├── explore.tsx          # Category browse + search
│       ├── bookings.tsx         # Upcoming + past sessions
│       ├── kids.tsx             # Child profiles + skills
│       ├── profile.tsx          # Parent settings + SOS
│       ├── activity/[id].tsx    # Activity detail
│       ├── teacher/[id].tsx     # Teacher profile modal
│       ├── slots/[id].tsx       # Slot picker + cart
│       └── payment/[id].tsx     # Razorpay checkout
├── src/features/
│   ├── auth/
│   ├── home/
│   ├── explore/
│   ├── booking/
│   ├── cart/
│   ├── payment/
│   ├── dashboard/
│   ├── kids/
│   └── profile/
└── src/components/              # App-specific only — shared goes in @beam/ui-native
```

---

## Bottom Tabs

```
Home · Explore · Bookings · Kids · Profile
```

- Height: 83px, safe-area aware
- Active: filled teal icon + teal label
- Inactive: outlined gray icon + gray label
- Icons: Ionicons (outlined default, filled when active)

---

## Auth Flow

```
Splash → Phone Entry → OTP Verify → Parent Profile → Child Profile → Home
```

- Auth handled by Supabase Auth (OTP → JWT with role: parent)
- JWT stored in SecureStore (never AsyncStorage)
- On cold start: check SecureStore → if valid token → skip to Home
- Auth guard lives in app/(root)/_layout.tsx

---

## Data Fetching Rules

Always use hooks from @beam/hooks/parent. Never call api-client directly in screen files.

```typescript
// CORRECT
import { useActivities } from '@beam/hooks/parent'
import { useBookings } from '@beam/hooks/parent'
import { useChild } from '@beam/hooks/parent'

// WRONG
import { api } from '@beam/api-client'  // not in screen files
```

Stale times (do not override without reason):
- Activities list: 5 min
- Slots: 30s (volatile)
- Bookings: 30s
- Child profile: 2 min

---

## Performance Rules (non-negotiable)

- Lists: FlashList only (@shopify/flash-list) — never FlatList
- Images: expo-image only — never React Native <Image>
- Haptics: expo-haptics on every primary button press
- Memoize list item components with React.memo
- No inline functions in FlashList renderItem

```typescript
// CORRECT
const renderItem = React.useCallback(
  ({ item }: { item: Activity }) => <ClassCard activity={item} />,
  []
)
<FlashList data={activities} renderItem={renderItem} estimatedItemSize={200} />

// WRONG
<FlatList renderItem={({ item }) => <ClassCard activity={item} />} />
```

---

## Token Usage

Never hardcode colors, spacing, or font sizes. Always import from @beam/ui-tokens.

```typescript
// CORRECT
import { colors, spacing, radius } from '@beam/ui-tokens'
style={{ backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.card }}

// WRONG
style={{ backgroundColor: '#1787A6', padding: 16, borderRadius: 16 }}
```

---

## Component Rules

Use @beam/ui-native atoms/molecules wherever possible. Only create app-specific components in src/components/ if the component is truly parent-app-only and will never be reused.

```typescript
// Use these from @beam/ui-native
import { Button, Input, Badge, Avatar, Tag, ClassCard, BookingCard, SlotPicker, SOSButton } from '@beam/ui-native'

// App-specific only (src/components/)
LocationBar         // sticky city selector header
AgeFilterChips      // age group toggle row
SessionUrgencyBadge // "starts in 2h" indicator
```

---

## Booking Flow (screen order)

```
Activity Detail → Teacher Profile (modal) → Slot Picker → Cart → Payment → Confirmation
```

Slot locking: When parent opens SlotPicker, call api.scheduling.lockSlot. Release on back navigation or timeout (5 min TTL). Never hold a lock without releasing.

```typescript
// On mount
await api.scheduling.lockSlot(slotId, bookingId)

// On unmount / back press
await api.scheduling.releaseSlot(slotId)
```

---

## SOS Button

Visible on every session-day screen (dashboard and session detail).

- Component: SOSButton from @beam/ui-native
- Color: Coral (#FF7A59)
- Position: floating bottom-right, above tab bar
- Action: calls parent → teacher direct call via Linking.openURL(`tel:${teacher.phone}`)
- Always visible during active session window (±30 min of session time)

---

## Offline Behavior

- Bookings list: cached in TanStack Query, renders stale data with "last updated" indicator
- Session checklist: not applicable (parent-side)
- Payment: never offline — show clear error if no connection at checkout
- Slot picker: show "checking availability..." on refetch, disable confirm if stale > 30s

---

## Push Notifications

Handled by Expo Notifications + FCM. Token registered on login and stored server-side via api.users.updateProfile.

Notification types parent-app handles:
```
booking.confirmed       → navigate to bookings tab
session.reminder_24h    → navigate to booking detail
session.reminder_1h     → navigate to booking detail
session.reminder_5min   → navigate to booking detail + show SOS
session.completed       → navigate to post-session feedback screen
payment.failed          → navigate to payment retry screen
recommendation.new      → navigate to home feed
```

Deep link format: `beam://booking/{id}` · `beam://activity/{id}`

---

## Post-Session Feedback

Triggered automatically after session.completed notification or after session end time passes.

Screen: Modal overlay on dashboard  
Required fields: star rating (1-5), skill tags (multi-select)  
Optional: written review  
On submit: useFeedback().submitFeedback() → dismiss modal → show rebook CTA  
Skip allowed: once only (prompts again next open)

---

## Child Profile + Skills

Source of truth: @beam/hooks/parent → useChild(childId)

Skills displayed as radar chart (5 axes):
```
Creativity · Motor Skills · Language · Social Skills · Focus
```

Badges: grid display, locked badges shown as grayscale  
Sessions count: total completed sessions  
Milestones: fetched from child.milestones array in schema

---

## Error Handling

Every screen must handle 3 states: loading, error, empty.

```typescript
if (isLoading) return <Spinner />
if (isError) return <ErrorState onRetry={refetch} message="Couldn't load activities" />
if (!data?.length) return <EmptyState message="No classes found" cta="Explore all" />
```

Use ErrorState and EmptyState from @beam/ui-native. Never show raw error messages to users.

---

## DO NOTs

- ❌ Never import from @beam/hooks/teacher or @beam/hooks/admin
- ❌ Never call api-client directly in screen or component files
- ❌ Never use FlatList — FlashList only
- ❌ Never use React Native Image — expo-image only
- ❌ Never hardcode colors, spacing, or radii
- ❌ Never store JWT or sensitive data in AsyncStorage — SecureStore only
- ❌ Never hold a slot lock without releasing on unmount
- ❌ Never skip haptics on primary button presses
- ❌ Never define Zod schemas inline — always from @beam/schemas
- ❌ Never import from another app (parent-web, teacher-app, admin)

---

## Key Dependencies

```json
"expo": "~54.0.0",
"expo-router": "^6.0.0",
"expo-image": "^1.0.0",
"expo-haptics": "^13.0.0",
"expo-secure-store": "^13.0.0",
"expo-notifications": "^0.28.0",
"@shopify/flash-list": "^1.6.0",
"@tanstack/react-query": "^5.0.0",
"socket.io-client": "^4.7.0",
"@supabase/supabase-js": "^2.0.0"
```

---

## Commands

```bash
pnpm dev --filter=parent-app       # start dev build
pnpm typecheck --filter=parent-app # type check only
pnpm lint --filter=parent-app      # biome lint
pnpm test --filter=parent-app      # vitest
eas build --platform ios           # EAS iOS build
eas build --platform android       # EAS Android build
```
```