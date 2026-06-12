# Beam Teacher App

React Native mobile app for teachers. Teachers view their assigned sessions, manage availability, track earnings, run active sessions with a materials checklist, and submit post-session summaries.

- **Bundle ID (iOS):** `com.beam.teacher`
- **Deep link scheme:** `beam://`
- **Platforms:** iOS + Android

## Stack

- **React Native 0.81** + **Expo SDK 54**
- **Expo Router v6** — file-based navigation
- **TanStack Query v5** — data fetching and caching
- **Supabase** — OTP auth, session storage
- **FlashList 2.0.2** — performant lists
- **expo-image** — optimised image rendering
- **socket.io-client** — installed (live session updates not yet wired)

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- iOS: Xcode 15+ and an iOS simulator or physical device
- Android: Android Studio with an emulator or physical device
- A running instance of `apps/api` (see `apps/api/README.md`)
- Supabase project with OTP auth enabled for phone numbers

---

## Installation

```bash
# From monorepo root
pnpm install

# Start the Expo dev server
pnpm --filter=teacher-app start
# or run on a specific platform
pnpm --filter=teacher-app ios
pnpm --filter=teacher-app android
```

---

## Environment Variables

Create `apps/teacher-app/.env` (gitignored):

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

---

## Auth Flow

```
Splash → Phone Entry → OTP Verify → Onboarding → Dashboard
```

1. Teacher enters phone number → Supabase sends OTP SMS
2. OTP verified → Supabase JWT issued with `role: teacher`
3. First-time teachers go through onboarding (bio, skills, availability setup)
4. On subsequent launches: session read from SecureStore → if valid, skip to Dashboard
5. Auth guard lives in `app/(root)/_layout.tsx`

**JWT is stored in `expo-secure-store` — never AsyncStorage.**

---

## Features Implemented

### Navigation
- **Bottom tab bar** (5 tabs): Dashboard · Sessions · Checklist · Earnings · Profile

### Dashboard (`/`)
- Personalized greeting with teacher's first name (from API)
- Earnings preview card (this month's estimate from API)
- Today's sessions list with Accept / Decline actions for pending sessions
- Quick stats

### Sessions (`/sessions`)
- Full sessions list grouped by status (upcoming, completed, cancelled)
- Accept / Decline buttons on pending sessions
- Tap a session → Session Detail screen

### Session Detail (`/session/[bookingId]`)
- Child name, activity title, scheduled time
- Navigate to Active session or Complete session

### Active Session (`/session/active/[bookingId]`)
- Live session view (wired to real booking data)
- Materials checklist

### Complete Session (`/session/complete/[bookingId]`)
- Post-session summary form
- Notes field
- Submit → marks booking as `completed` via `PATCH /admin/bookings/:id/assign` equivalent

### Checklist (`/checklist`)
- Full pre-session checklist across all upcoming sessions

### Earnings (`/earnings`)
- Payout history
- Current month estimate
- Session-level breakdown

### Notifications (`/notifications`)
- In-app notification list from API
- "Mark all read" button (only shown when unread notifications exist)
- Relative timestamps (e.g., "2h ago", "just now")

### Profile (`/profile`)
- Teacher profile card (name, bio, specializations, rating)
- Edit Profile → `/(root)/profile/edit`

### Profile Edit (`/profile/edit`)
- Edit bio, specializations/languages
- Saves via `PATCH /teacher/profile`

### Availability (`/availability`)
- Weekly availability grid (Mon–Sun, morning/afternoon/evening slots)
- Loads current availability from API (`GET /teacher/availability`)
- Saves changes via `PATCH /teacher/availability`
- Stored as `Record<string, string[]>` in the `teachers.availability_json` DB column

### Onboarding (`/(auth)/onboarding/`)
- Multi-step first-login flow: skills, bio, availability

---

## Features NOT Yet Implemented (TODO)

| Feature | Notes |
|---|---|
| **Live session updates** | `socket.io-client` is installed but no connection or handlers are wired |
| **SOS response** | No screen or flow for teachers to respond to SOS alerts from parents |
| **Offline session completion** | Completing sessions requires API connectivity; no offline queue |
| **Session address display** | Parent's address should be prominently shown before and during session; not yet surfaced in UI |
| **Push notification handling** | `expo-notifications` is installed; token registration and routing from notifications not wired |
| **Payout detail screen** | Earnings screen shows totals; individual payout receipts not implemented |
| **Teacher verification status** | Verification pending/rejected state not surfaced in the app |
| **Document upload** | Teachers cannot upload verification documents from the mobile app |
| **Bank account management** | Payout bank account setup not implemented |
| **Calendar view** | Sessions are list-only; no calendar/month view |
| **EAS / production build config** | `eas.json` is not configured |

---

## Folder Structure

```
apps/teacher-app/
├── app/
│   ├── _layout.tsx                         # Root: fonts, QueryClient, AuthProvider
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                       # Splash screen
│   │   ├── login.tsx                       # Phone entry
│   │   ├── otp.tsx                         # OTP verification
│   │   └── onboarding/                     # First-login multi-step setup
│   └── (root)/
│       ├── _layout.tsx                     # Bottom tab navigator + auth guard
│       ├── index.tsx                       # Dashboard
│       ├── sessions.tsx                    # Sessions list
│       ├── checklist.tsx                   # Pre-session checklist
│       ├── earnings.tsx                    # Payout + earnings
│       ├── notifications.tsx               # In-app notifications
│       ├── availability.tsx                # Weekly availability editor
│       ├── profile.tsx                     # Profile menu
│       ├── profile/
│       │   ├── edit.tsx                    # Edit bio, specializations
│       │   ├── availability.tsx            # (alternate availability route)
│       │   ├── skills.tsx                  # Skills display
│       │   └── verification.tsx            # Verification status
│       └── session/
│           ├── [bookingId].tsx             # Session detail
│           ├── active/[bookingId].tsx      # Active session view
│           └── complete/[bookingId].tsx    # Post-session summary form
├── src/
│   ├── components/
│   │   ├── StatusBadge.tsx                 # Booking status badge (uses local DisplayStatus type)
│   │   └── (other app-specific components)
│   ├── hooks/
│   │   ├── useAvailability.ts              # GET + PATCH /teacher/availability
│   │   ├── useMockQuery.ts                 # Dev helper for mock data queries
│   │   ├── useNotifications.ts             # GET /notifications + mark-all-read
│   │   ├── useTeacherChecklist.ts          # Pre-session checklist state
│   │   ├── useTeacherDashboard.ts          # Dashboard summary data
│   │   ├── useTeacherEarnings.ts           # GET /teacher/earnings
│   │   ├── useTeacherProfile.ts            # GET + PATCH /teacher/profile
│   │   └── useTeacherSessions.ts           # Session list + accept/decline/status mutations
│   ├── lib/
│   │   ├── api.ts                          # Axios client + teacherApi.* typed calls
│   │   ├── AuthContext.tsx                 # Supabase session + signOut
│   │   └── supabase.ts                     # Supabase client instance
│   └── constants/
│       └── theme.ts                        # colors, spacing, radius, fontSize, etc.
├── app.json                                # Expo config
└── .env                                    # (gitignored) — see env vars section
```

---

## Key Patterns

### API calls
All API calls go through `src/lib/api.ts` via the `teacherApi` object:
```typescript
import { teacherApi } from '@/lib/api'

await teacherApi.profile.get(userId)
await teacherApi.profile.update(userId, { bio, specializations })
await teacherApi.availability.get(userId)
await teacherApi.availability.update(userId, { Mon: ['morning'], Tue: ['afternoon'] })
await teacherApi.sessions.list(userId)
await teacherApi.sessions.updateStatus(bookingId, 'confirmed')
```

### StatusBadge
Uses a local `DisplayStatus` type (not imported from `@beam/schemas`) to support the `'rescheduled'` status which is not part of the API enum:
```typescript
export type DisplayStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
```

---

## Run Commands

```bash
pnpm --filter=teacher-app start     # Expo dev server
pnpm --filter=teacher-app ios       # iOS simulator
pnpm --filter=teacher-app android   # Android emulator
pnpm typecheck --filter=teacher-app
pnpm lint --filter=teacher-app
```

---

## Known Issues

- **Socket.io not connected** — live session tracking and real-time updates are not functional.
- **No EAS build config** — production builds require `eas.json` to be set up.
- **`DisplayStatus` diverges from API** — the `'rescheduled'` badge status is handled locally and has no API backing; if the API adds this status in the future, the local type should be replaced with the schema import.
