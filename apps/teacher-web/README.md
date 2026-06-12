# Beam Teacher Web

> **Status: Not yet scaffolded.** This app has a `CLAUDE.md` spec and an empty `src/` directory. No pages, components, or routes have been implemented.

Web version of the teacher experience — same flows as `apps/teacher-app` but browser-based. Useful for teachers on desktop, especially for reviewing session schedules and earnings. The web version adds a calendar view and Recharts-based earnings charts.

## Intended Stack

- **Next.js 14** (App Router)
- **React 18**
- **Supabase SSR** (`@supabase/ssr`) — cookie-based session handling
- **TanStack Query** — client-side data fetching
- **Tailwind CSS** — styling
- **Recharts** — earnings trend charts
- **react-big-calendar** (via `@beam/ui-web`'s `SessionCalendar` component) — calendar view

---

## Prerequisites (when scaffolded)

- Node.js 20+
- pnpm 9+
- A running instance of `apps/api` (see `apps/api/README.md`)
- Supabase project with OTP auth enabled for phone numbers

---

## Environment Variables (planned)

Create `apps/teacher-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Planned Run Commands

```bash
pnpm --filter=teacher-web dev        # Next.js dev server
pnpm --filter=teacher-web build      # Production build
pnpm --filter=teacher-web start      # Run production build
pnpm typecheck --filter=teacher-web
```

---

## Planned App Router Structure

```
src/app/
├── (auth)/
│   ├── page.tsx                        # Login (phone entry)
│   └── otp/page.tsx                    # OTP verification
└── (main)/
    ├── layout.tsx                      # Sidebar navigation shell
    ├── page.tsx                        # Dashboard (today + this week)
    ├── sessions/
    │   ├── page.tsx                    # All sessions — list view with filters + calendar toggle
    │   └── [bookingId]/
    │       ├── page.tsx                # Session detail
    │       ├── checklist/page.tsx      # Pre-session checklist
    │       └── complete/page.tsx       # Post-session summary form
    ├── earnings/
    │   └── page.tsx                    # Payout history + upcoming estimate (Recharts charts)
    └── profile/
        └── page.tsx                    # Teacher profile (read-only view)
```

---

## Auth Flow (planned)

- Supabase SSR middleware intercepts all requests
- Phone OTP → JWT with `role: teacher`
- Session stored in HTTP-only cookies
- Unauthenticated users redirected to `/(auth)/`

---

## Key Differences vs Teacher App (Mobile)

| Feature | teacher-app (mobile) | teacher-web |
|---|---|---|
| Offline support | Not yet (planned) | Not needed |
| Session calendar | List only | Calendar view + list toggle |
| Earnings view | Simple list | Recharts trend charts |
| Auth storage | SecureStore | HTTP-only cookies (SSR) |
| UI layer | `@beam/ui-native` | `@beam/ui-web` |

---

## Shared Packages

- `@beam/hooks/teacher` — TanStack Query hooks (same data, different UI)
- `@beam/schemas` — Zod types
- `@beam/api-client` — typed Axios client
- `@beam/ui-web` — web UI components (includes `SessionCalendar` wrapping react-big-calendar)

> Do **not** import `react-big-calendar` directly — use `SessionCalendar` from `@beam/ui-web`.

## Calendar Color Semantics

| Status | Color |
|---|---|
| Accepted / Confirmed | Teal |
| Pending | Amber |
| Completed | Gray |
| Cancelled | Red |

---

## What Needs to Be Built

Everything. The app is entirely unscaffolded. Start with:

1. `next.config.js`, `tailwind.config.ts`, `tsconfig.json`
2. Root `layout.tsx` with fonts and providers
3. Supabase SSR `middleware.ts`
4. Auth flow (`/(auth)/`)
5. Dashboard with today's sessions
6. Sessions list with calendar toggle
7. Session detail + checklist + complete flow
8. Earnings page with Recharts
