# Teacher Web — Next.js 14

Web version of the teacher experience. Same flows as teacher-app but browser-based.
Useful for teachers on desktop, especially for reviewing session schedules and earnings.

## App Router structure
```
src/app/
  (auth)/
    page.tsx              login
    otp/page.tsx
  (main)/
    layout.tsx            sidebar navigation shell
    page.tsx              dashboard (today + this week)
    sessions/
      page.tsx            all sessions (list view with filters)
      [bookingId]/
        page.tsx          session detail
        checklist/page.tsx pre-session checklist
        complete/page.tsx  post-session form
    earnings/
      page.tsx            payout history + upcoming estimate
    profile/
      page.tsx            teacher profile (read-only)
```

## Key differences from teacher-app
- No offline support needed (web assumes connectivity)
- Session start/end also available on web for teachers who prefer desktop
- Larger screen → show session calendar view in addition to list view
- Earnings page shows charts (Recharts) — app shows simple list

## Shared with teacher-app
- `@beam/hooks/teacher` — all TanStack Query hooks
- `@beam/schemas` — types and validation
- `@beam/api-client` — same typed client

## NOT shared
- UI: `@beam/ui-web` (not ui-native)
- Auth: Supabase SSR cookie session (not AsyncStorage)
- No offline queue

## Session management (web-specific addition)
Calendar view in `sessions/page.tsx` using the **shared `SessionCalendar` component from `@beam/ui-web`**
(which wraps `react-big-calendar` — do not import react-big-calendar directly).
Client component with month/week toggle.
Shows accepted sessions in teal, pending in amber, completed in gray.
See `docs/ADR/002-calendar-component.md` for color semantics and shared props.

## Auth
Same Supabase SSR pattern as parent-web.
Middleware redirects `/main/*` to `/auth` if no valid teacher session.
