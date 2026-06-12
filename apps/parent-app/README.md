# Beam Parent App

React Native mobile app for parents. Parents discover at-home activities, book sessions for their children, pay via Razorpay/UPI, and track their child's skill progress.

- **Bundle ID (iOS + Android):** `com.beam.parent`
- **Deep link scheme:** `beam://`
- **Platforms:** iOS + Android

## Stack

- **React Native 0.81.5** + **Expo SDK 54**
- **Expo Router v6** — file-based navigation
- **TanStack Query v5** — data fetching and caching
- **Supabase** (`@supabase/supabase-js`) — OTP auth, session storage
- **Razorpay** (`react-native-razorpay`) — in-app payment sheet (requires native build, not available in Expo Go)
- **FlashList 2.0.2** (`@shopify/flash-list`) — performant lists (replaces FlatList everywhere)
- **expo-image** — optimised image rendering
- **expo-video** — video playback for the Reels screen
- **expo-location** — location permission + coordinates for "Near Me" filtering
- **react-native-svg** — radar chart on child detail screen
- **socket.io-client** — installed but not wired (live session tracking planned)

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI: `npx expo` (or `npm install -g expo-cli`)
- iOS: Xcode 15+ and an iOS simulator or physical device
- Android: Android Studio with an emulator or physical device
- A running instance of `apps/api` (see `apps/api/README.md`)
- Supabase project with phone OTP auth enabled

---

## Installation

```bash
# From monorepo root
pnpm install

# Start the Expo dev server
pnpm --filter=parent-app start
# or run on a specific platform
pnpm --filter=parent-app ios
pnpm --filter=parent-app android
```

---

## Environment Variables

Create `apps/parent-app/.env` (gitignored):

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the Beam API server |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

> In Expo, all env vars must start with `EXPO_PUBLIC_` to be accessible in client code.
> If `EXPO_PUBLIC_API_URL` is not set, the app falls back to the production API at `https://beam-api-xi.vercel.app`.

---

## Auth Flow

```
Splash → Phone Entry → OTP Verify → Parent Setup → Child Setup → Home
```

1. User enters phone number → Supabase sends OTP SMS
2. OTP verified → Supabase JWT issued with `role: parent`
3. On first login, user completes parent profile (name, city) and child profile (name, DOB, interests)
4. On subsequent launches: session read from `expo-secure-store` → if valid, skip directly to Home
5. Auth guard lives in `app/(root)/_layout.tsx` — unauthenticated users are redirected to `/(auth)/`

**Important:** JWT is stored in `expo-secure-store` — never AsyncStorage.

---

## Features Implemented

### Navigation
- **Bottom tab bar** (5 tabs): Home · Explore · Bookings · Kids · Profile
- Deep link support via `beam://` scheme (e.g. `beam://activity/123`)

### Home (`/`)
- **HomeHeader** with city selector and inline search bar
- **Location sheet** — permission prompt + reverse geocoding to set city
- **Promo banner carousel** with auto-scroll and deep links
- **Category filter chips** (Art, Music, Dance, STEM, Math, Stories, Yoga, Cooking) — tapping navigates to Explore with that filter pre-applied
- **Upcoming session card** — shows next confirmed/pending booking pulled from API
- **Recommended activities** horizontal scroll — filtered by active category, live from API
- **Trending Activities** grid — second page of activity results from API
- **Verified Teachers** section — live from API
- **Class Packs banner** — promotional static card
- **Learning Milestones banner** — promotional static card
- **Watch & Learn row** — links to Reels screen
- Pull-to-refresh via `RefreshControl` — invalidates activities + bookings queries

### Explore (`/explore`)
- Full-text search with 350ms debounce
- Category filter chips (All · Art · Music · Dance · STEM · Math · Stories · Yoga)
- "Near Me" toggle — requests location permission, fetches with `lat`/`lng`/`radiusKm=10` params
- Activity list via FlashList
- Deep-link parameter: navigating from Home category chips pre-selects the correct filter
- Empty state with "Clear filters" CTA

### Activity Detail (`/activity/[id]`)
- Full activity details: title, description, age group, price, session type, duration
- Three tabs: About · Reviews · Teacher
- Teacher info tab with teacher card
- Reviews tab shows "Reviews coming soon" placeholder
- "Book Now" CTA → navigates to slot picker

### Slots / Booking (`/slots/[id]`)
- `BookingWizardHeader` showing step 1/2 progress
- `ActivitySummaryBar` with activity thumbnail, title, price
- `MonthCalendar` — scrollable date strip showing available dates
- Available time slots grouped by Morning / Afternoon / Evening
- "Confirm Slot" → navigates to payment, passing `slotId`, `date`, `time`, `price`

### Payment (`/payment/[id]`)
- `BookingWizardHeader` showing step 3/3 progress
- `ActivitySummaryBar`
- **Booking summary**: date, time, session mode, child name
- **Coupon code input** — validates against API (`POST /coupons/validate`), supports flat and percent codes, shows error messages
- **Payment method selector** (UPI / Card) — visual toggle; actual payment handled by Razorpay
- **Price breakdown**: session fee, discount, platform fee (₹0), total
- **Razorpay payment sheet** (`react-native-razorpay`) — creates booking via `POST /bookings`, creates Razorpay order via `POST /payments/orders`, opens native Razorpay sheet, verifies signature via `POST /payments/:id/verify`
- **Success / confirmation screen** — receipt card with booking details, "View My Bookings" CTA
- Note: Razorpay requires a native development build — shows a fallback Alert in Expo Go

### Bookings (`/bookings`)
- Three tabs: Upcoming · Completed · Cancelled
- Live count badges on each tab from API
- **Live session banner** — appears when a confirmed booking is within 1 hour of start time; "Track" button shows Alert stub (live tracking not wired)
- Per-card actions by status:
  - **Upcoming**: "Reschedule" (Alert stub) + "Support" (shows support email)
  - **Completed**: **"Rate"** (opens star-rating bottom sheet → `POST /bookings/:id/feedback`) + **"Book Again"** (navigates to `/slots/:activityId`)
  - **Cancelled**: "Refund Status" (shows static message — not a real API call)

### Booking Detail (`/booking/[id]`)
- Fetches single booking from API
- Hero image with activity thumbnail, title, status badge
- Session details: teacher, child, date/time, mode, amount
- "Rebook this activity" button for completed bookings
- **Cancel Booking** button for pending/confirmed bookings — shows native Alert confirmation → `POST /bookings/:id/cancel`

### Kids (`/kids`)
- Child selector (avatar tabs, one per child)
- Progress card showing level (Starter → Champion based on session count), Creativity and Focus skill labels
- Session count + streak stat band
- "View Radar" → child detail screen
- Latest teacher note card (from API)
- Badge grid (from API)
- Recommended activities 2×2 grid for selected child

### Child Detail (`/child/[id]`)
- Radar chart (SVG, 5 axes: Creativity, Motor, Language, Social, Focus) from API skill scores
- Level badge + session count
- All milestone badges
- Sessions section with completed session count

### Profile (`/profile`)
- User card with name, city, phone (from Supabase session)
- Stats: sessions completed, unique activities, children registered (all live from API)
- "Edit Profile" → `/profile/edit`
- "Delivery Address" info Alert (city-only, no separate address field)
- "Payment Methods" info Alert (explains Razorpay checkout)
- "Refer & Earn" → native share sheet
- Push notifications toggle (local state only — no backend registration)
- Privacy, FAQ, Terms links (static)
- Logout

### Profile Edit (`/profile/edit`)
- Edit first name, last name, city
- Phone is read-only (set at OTP login)
- Saves via `PATCH /users/profile`

### Teacher Profile (`/teacher/[id]`)
- Teacher bio, specializations, city, verified badge
- Activities list with price and age group
- Reviews section — shows "Reviews coming soon" placeholder

### Reels / Watch & Learn (`/reels`)
- TikTok-style vertical video feed using `expo-video`
- Videos sourced from `WatchAndLearnRow` static data (not API-driven)
- Story progress bars at top
- Mute / unmute toggle
- Back navigation
- Teacher avatar + follow button (visual only, no API call)
- Like button (local state only — not persisted)
- Save/Bookmark button (local state only — not persisted)
- Dot position indicator
- Comments button → Alert stub ("Coming soon")
- **Share button** → native `Share.share()` with activity title + teacher name + `beam://explore` deep link
- **"Book Now" CTA** → navigates to Explore screen

---

## Features NOT Yet Implemented (TODO)

| Feature | Notes |
|---|---|
| **Live session tracking** | `socket.io-client` is installed but no connection is established anywhere. The "Track" banner in Bookings shows an Alert stub. |
| **Reschedule flow** | "Reschedule" button shows an Alert stub — no screen or API call |
| **Refund status** | "Refund Status" on cancelled bookings shows a static Alert message — not a real API call |
| **Reels — comments** | Comments button shows Alert stub; no backend for comments |
| **Reels — video content from API** | Videos are hardcoded static data in `WatchAndLearnRow.tsx`, not fetched from API |
| **Teacher profile — reviews** | Reviews tab shows "Reviews coming soon" placeholder; no API call |
| **Push notification handling** | `expo-notifications` is installed; token registration and deep-link routing from notifications not wired |
| **Notification toggle persistence** | Push notification toggle on Profile is local state only — not saved to backend |
| **Slot locking** | `lockSlot` / `releaseSlot` API calls are not made from the slot picker screen |
| **SOS button** | Specified in architecture docs but not present in any screen |
| **Offline mode** | No offline detection or stale-data indicators |
| **EAS build config** | `app.json` has `eas.projectId: "beam-parent-app"` but no `eas.json` file — `eas build` will not work without it |

---

## Folder Structure

```
apps/parent-app/
├── app/
│   ├── _layout.tsx                  # Root: fonts, QueryClient, AuthProvider
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # Splash screen
│   │   ├── login.tsx                # Phone number entry
│   │   ├── otp.tsx                  # OTP verification
│   │   ├── parent-setup.tsx         # Name + city setup (first login)
│   │   └── child-setup.tsx          # Child name + DOB + interests (first login)
│   └── (root)/
│       ├── _layout.tsx              # Bottom tab navigator + auth guard
│       ├── index.tsx                # Home feed
│       ├── explore.tsx              # Search + category browse (FlashList)
│       ├── bookings.tsx             # Upcoming/Completed/Cancelled tabs
│       ├── kids.tsx                 # Child selector + skills + badges
│       ├── profile.tsx              # Parent settings menu
│       ├── reels.tsx                # Vertical video feed (expo-video)
│       ├── activity/[id].tsx        # Activity detail (3 tabs: About, Reviews, Teacher)
│       ├── booking/[id].tsx         # Booking detail with status and info cards
│       ├── child/[id].tsx           # Child detail + SVG radar chart
│       ├── child/edit.tsx           # Edit child name, last name, DOB
│       ├── payment/[id].tsx         # Checkout: coupon + Razorpay + confirmation
│       ├── profile/
│       │   └── edit.tsx             # Edit name, city
│       ├── slots/[id].tsx           # Slot picker: MonthCalendar + time grid
│       └── teacher/[id].tsx         # Teacher profile + activities list
├── src/
│   ├── components/
│   │   ├── activity/
│   │   │   ├── ActivityAboutTab.tsx
│   │   │   ├── ActivityReviewsTab.tsx
│   │   │   └── ActivityTeacherTab.tsx
│   │   ├── booking/
│   │   │   ├── ActivitySummaryBar.tsx   # Activity thumbnail + title + price strip
│   │   │   ├── BookingWizardHeader.tsx  # Step indicator (1/2, 2/2, 3/3)
│   │   │   └── MonthCalendar.tsx        # Horizontal scrollable date strip
│   │   ├── bookings/
│   │   │   └── BookingCard.tsx          # Card with status-specific action row
│   │   ├── explore/
│   │   │   ├── ActivityRow.tsx          # List row for FlashList in Explore
│   │   │   └── ExploreSkeleton.tsx
│   │   ├── home/
│   │   │   ├── ActivityCard.tsx         # Vertical card for horizontal scroll
│   │   │   ├── ClassPacksBanner.tsx
│   │   │   ├── HomeHeader.tsx           # City selector + search bar
│   │   │   ├── LearningMilestonesBanner.tsx
│   │   │   ├── PromoBannerCarousel.tsx  # Auto-scrolling promo banners
│   │   │   ├── TrendingGrid.tsx
│   │   │   ├── UpcomingSessionCard.tsx  # Next booking mini-card
│   │   │   ├── VerifiedTeachersSection.tsx
│   │   │   └── WatchAndLearnRow.tsx     # Static video data + link to Reels
│   │   ├── kids/
│   │   │   └── ChildSelector.tsx        # Avatar row tab selector
│   │   ├── payment/
│   │   │   ├── PaymentMethodSelector.tsx
│   │   │   ├── PaymentSkeleton.tsx
│   │   │   ├── PaymentSummaryCard.tsx
│   │   │   └── PriceBreakdown.tsx
│   │   ├── profile/
│   │   │   ├── ProfileSkeleton.tsx
│   │   │   ├── ProfileStats.tsx
│   │   │   └── ProfileUserCard.tsx
│   │   ├── teacher/
│   │   │   ├── TeacherClassCard.tsx
│   │   │   └── TeacherSkeleton.tsx
│   │   ├── slots/
│   │   │   ├── DateStrip.tsx
│   │   │   └── SlotGrid.tsx
│   │   ├── Avatar.tsx
│   │   ├── Button.tsx
│   │   ├── EmptyState.tsx
│   │   ├── InfoRow.tsx
│   │   ├── LocationSheet.tsx            # Location permission + reverse geocode sheet
│   │   ├── ScreenHeader.tsx
│   │   ├── ScreenLoader.tsx
│   │   ├── Skeleton.tsx
│   │   └── StatusBadge.tsx
│   ├── hooks/
│   │   ├── useActivities.ts     # Activity list with filters (category, search, location)
│   │   ├── useBookings.ts       # Bookings by status (pending,confirmed / completed / cancelled)
│   │   ├── useChildProgress.ts  # Child skills, badges, teacher note via API
│   │   ├── useChildren.ts       # Parent's children list
│   │   ├── useDeepLink.ts       # Deep link routing helper
│   │   ├── useSlots.ts          # Available slots for an activity (30-day window)
│   │   └── useTeacher.ts        # Single teacher profile
│   ├── lib/
│   │   ├── api.ts               # Typed fetch client — parentApi.* (no Axios, uses fetch)
│   │   ├── AuthContext.tsx      # Supabase session + signOut context
│   │   └── supabase.ts          # Supabase client instance
│   ├── constants/
│   │   └── theme.ts             # colors, spacing, radius, fontSize, fontWeight, shadows
│   └── types/
│       └── react-native-razorpay.d.ts  # Type declaration for Razorpay native module
├── app.json                     # Expo config: bundle ID, scheme, plugins, EAS project ID
└── .env                         # (gitignored) — see env vars section
```

---

## Performance Rules (enforced in this codebase)

- **Lists:** FlashList only (`@shopify/flash-list`) — no FlatList anywhere (Explore screen uses FlashList; other screens use ScrollView for non-infinite lists)
- **Images:** `expo-image` only — no React Native `<Image>`
- **Haptics:** `expo-haptics` called on all primary button presses
- **List items:** `React.memo` used on `BookingCard`, `ReelItem`, and other list item components
- **No inline functions** in FlashList `renderItem` — `useCallback` used in Explore

---

## Key Patterns

### API calls

All API calls go through `src/lib/api.ts` via the `parentApi` object (uses `fetch`, not Axios):

```typescript
import { parentApi } from '@/lib/api'

await parentApi.activities.list({ category: 'Music', limit: 20 })
await parentApi.coupons.validate('BEAM10', 1500)
await parentApi.bookings.create({ parentId, childId, activityId, slotId, totalAmount })
await parentApi.payments.createOrder(bookingId)
await parentApi.payments.verifyPayment(bookingId, { razorpayPaymentId, razorpayOrderId, razorpaySignature })
```

### Data fetching

All data fetching uses TanStack Query hooks in `src/hooks/`:

```typescript
import { useActivities } from '@/hooks/useActivities'
import { useChildProgress } from '@/hooks/useChildProgress'

const { data, isLoading } = useActivities({ category: 'Art & Craft' })
const { data: progress } = useChildProgress(child.id)
```

---

## Run Commands

```bash
pnpm --filter=parent-app start     # Expo dev server (tunnel/LAN/localhost)
pnpm --filter=parent-app ios       # iOS simulator
pnpm --filter=parent-app android   # Android emulator
pnpm typecheck --filter=parent-app
pnpm lint --filter=parent-app
```

---

## Known Issues

- **Razorpay requires a native build** — `react-native-razorpay` is not available in Expo Go. The payment screen shows a fallback Alert instead of the Razorpay sheet. Use `npx expo run:ios` or `npx expo run:android` for a development build.
- **Socket.io not connected** — `socket.io-client` is in dependencies but no connection is established anywhere. Live tracking and real-time booking updates will not work.
- **No EAS build config** — `eas.json` does not exist. Production builds via `eas build` require it to be created and configured.
- **Slot locking not called** — The slot picker fetches availability but does not call `lockSlot` before proceeding to payment. Concurrent bookings for the same slot are not prevented client-side.
