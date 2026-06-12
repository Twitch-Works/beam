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

## App ↔ Package dependency map
```
parent-app   → @beam/ui-native, @beam/api-client, @beam/hooks/parent, @beam/schemas
parent-web   → @beam/ui-web,    @beam/api-client, @beam/hooks/parent, @beam/schemas
teacher-app  → @beam/ui-native, @beam/api-client, @beam/hooks/teacher, @beam/schemas
teacher-web  → @beam/ui-web,    @beam/api-client, @beam/hooks/teacher, @beam/schemas
admin        → @beam/ui-web,    @beam/api-client, @beam/hooks/admin,   @beam/schemas
api          → @beam/schemas, @beam/config
```

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

## Package names (for imports)
`@beam/schemas` · `@beam/ui-native` · `@beam/ui-web` · `@beam/ui-tokens`
`@beam/api-client` · `@beam/hooks` · `@beam/config` · `@beam/types` · `@beam/testing`

## Module-specific context — read the closest AGENTS.md
```
apps/parent-app/AGENTS.md           parent mobile screens, RN patterns, navigation
apps/parent-web/AGENTS.md           parent web flows, Next.js RSC patterns
apps/teacher-app/AGENTS.md          teacher mobile, session flow, RN patterns
apps/teacher-web/AGENTS.md          teacher web, session management
apps/admin/AGENTS.md                admin dashboard, tables, analytics, Next.js
apps/api/AGENTS.md                  API patterns, auth middleware, events, errors
apps/api/src/modules/{x}/AGENTS.md  per-module contracts, public API, rules
packages/schemas/AGENTS.md          how to write schemas correctly
packages/ui-native/AGENTS.md        mobile component patterns + tokens
packages/ui-web/AGENTS.md           web component patterns + tokens
```

## Subagents
```
security-reviewer   auth, payments, PCI, data leaks, role bypass
schema-validator    Zod usage, inline types, schema drift, import paths
test-writer         unit + integration tests for services and routes
boundary-checker    module imports, layer violations, process.env leaks
```

## Slash commands
```
/new-feature {desc}   schema-first spec before any implementation
/catchup              restore context after /clear (reads git diff + SPEC.md)
/pr-review            runs all 4 subagents, produces report
```
