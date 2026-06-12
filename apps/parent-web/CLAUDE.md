# Parent Web — Next.js 14

Web version of the parent experience. Same flows as parent-app but browser-first.
Shares `@beam/hooks/parent` and `@beam/schemas` with parent-app. Different UI layer.

## When to use web vs app
Web is the fallback surface for parents without the mobile app.
Feature parity with parent-app is the goal. Launch mobile-first, web follows.

## App Router structure
```
src/app/
  (auth)/
    page.tsx              welcome + login
    otp/page.tsx
    setup/page.tsx        parent + child setup (multi-step form)
  (main)/
    layout.tsx            top nav + footer shell
    page.tsx              homepage (featured + recommendations)
    explore/
      page.tsx            browse categories + search
      [category]/page.tsx category listing
    activities/
      [id]/page.tsx       class detail (RSC — SSR for SEO)
    booking/
      page.tsx            slot picker + calendar (client component)
      cart/page.tsx       cart + add-ons + discount (client)
      payment/page.tsx    Razorpay checkout (client)
      confirmation/page.tsx booking success
    dashboard/
      page.tsx            upcoming + past bookings
      [bookingId]/page.tsx session detail
    kids/
      page.tsx            children profiles
      [childId]/page.tsx  child skills + badges + history
    profile/
      page.tsx            parent settings
```

## RSC vs Client component rule
```
RSC (default)    → data fetching pages, static content, activity listings
'use client'     → forms, booking flow, payment, cart, any interactivity
```

## Data fetching pattern
```typescript
// RSC — direct API call, no useEffect
async function ActivityPage({ params }) {
  const activity = await api.catalog.get(params.id)  // server-side
  return <ActivityDetail activity={activity} />
}

// Client component — TanStack Query
'use client'
function SlotPicker({ activityId }) {
  const { data: slots } = useSlots(activityId, selectedDate)  // from @beam/hooks/parent
}
```

## Shared with parent-app
- `@beam/hooks/parent` — all TanStack Query hooks (same hooks, both platforms)
- `@beam/schemas` — all Zod schemas and TypeScript types
- `@beam/api-client` — same API client

## NOT shared with parent-app
- UI components: use `@beam/ui-web` (not `@beam/ui-native`)
- Navigation: Next.js router (not Expo Router)
- Auth session: next-auth or Supabase SSR client (not AsyncStorage)

## Auth (web-specific)
Supabase SSR client for server-side session. Cookie-based.
```typescript
import { createServerClient } from '@supabase/ssr'
// In RSC: createServerClient() to read session
// In middleware.ts: redirect to /auth if no session
```

## Components — from @beam/ui-web
```typescript
import { Button, ClassCard, TeacherCard, StarRating, SlotPicker } from '@beam/ui-web'
// These are React (web) versions — same API as ui-native where possible
```
