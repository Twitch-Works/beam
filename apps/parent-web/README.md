# Beam Parent Web

> **Status: Not yet scaffolded.** This app has a `CLAUDE.md` spec and an empty `src/` directory. No pages, components, or routes have been implemented.

Web version of the parent experience — same flows as `apps/parent-app` but browser-first. Fallback surface for parents without the mobile app. Feature parity with parent-app is the goal; mobile was launched first.

## Intended Stack

- **Next.js 14** (App Router)
- **React 18**
- **Supabase SSR** (`@supabase/ssr`) — cookie-based session handling
- **TanStack Query** — client-side data fetching
- **Tailwind CSS** — styling
- **Razorpay** — browser-based payment checkout

---

## Prerequisites (when scaffolded)

- Node.js 20+
- pnpm 9+
- A running instance of `apps/api` (see `apps/api/README.md`)
- Supabase project with OTP auth enabled for phone numbers

---

## Environment Variables (planned)

Create `apps/parent-web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

---

## Planned Run Commands

```bash
pnpm --filter=parent-web dev        # Next.js dev server
pnpm --filter=parent-web build      # Production build
pnpm --filter=parent-web start      # Run production build
pnpm typecheck --filter=parent-web
```

---

## Planned App Router Structure

```
src/app/
├── (auth)/
│   ├── page.tsx                    # Welcome + phone login
│   ├── otp/page.tsx                # OTP verification
│   └── setup/page.tsx              # Parent + child setup (multi-step form)
└── (main)/
    ├── layout.tsx                  # Top nav + footer shell
    ├── page.tsx                    # Homepage (featured activities + recommendations)
    ├── explore/
    │   ├── page.tsx                # Browse categories + search
    │   └── [category]/page.tsx     # Category listing
    ├── activities/
    │   └── [id]/page.tsx           # Activity detail (RSC — SSR for SEO)
    ├── booking/
    │   ├── page.tsx                # Slot picker + calendar (client component)
    │   ├── cart/page.tsx           # Cart + discount code (client)
    │   ├── payment/page.tsx        # Razorpay checkout (client)
    │   └── confirmation/page.tsx   # Booking success
    ├── dashboard/
    │   ├── page.tsx                # Upcoming + past bookings
    │   └── [bookingId]/page.tsx    # Session detail
    ├── kids/
    │   ├── page.tsx                # Children profiles
    │   └── [childId]/page.tsx      # Child skills + badges + history
    └── profile/
        └── page.tsx                # Parent settings
```

## RSC vs Client Components

| Type | Use for |
|---|---|
| RSC (default) | Data fetching pages, activity listings, static content (SEO-optimized) |
| `'use client'` | Booking flow, payment, cart, forms, any interactivity |

---

## Auth Flow (planned)

- Supabase SSR middleware intercepts all requests
- Phone OTP → JWT with `role: parent`
- Session stored in HTTP-only cookies (not localStorage)
- Unauthenticated users redirected to `/(auth)/`

---

## Shared Packages

- `@beam/hooks/parent` — TanStack Query hooks (same as parent-app)
- `@beam/schemas` — Zod types
- `@beam/api-client` — typed Axios client
- `@beam/ui-web` — web UI components (not `@beam/ui-native`)

---

## What Needs to Be Built

Everything. The app is entirely unscaffolded. Start with:

1. `next.config.js`, `tailwind.config.ts`, `tsconfig.json`
2. Root `layout.tsx` with fonts and providers
3. Supabase SSR `middleware.ts`
4. Auth flow (`/(auth)/`)
5. Homepage and explore (`/(main)/`)
6. Activity detail page (RSC, SEO)
7. Booking + payment flow (client components)
8. Dashboard and kids screens
