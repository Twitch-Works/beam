# Beam

Three-sided ed-tech marketplace connecting Parents with verified Teachers for at-home children's activities. India-first.

## Apps

| App | Stack | Description |
|---|---|---|
| `apps/parent-app` | React Native + Expo | Parent mobile app (iOS + Android) |
| `apps/parent-web` | Next.js 14 | Parent web app |
| `apps/teacher-app` | React Native + Expo | Teacher mobile app (iOS + Android) |
| `apps/teacher-web` | Next.js 14 | Teacher web app |
| `apps/admin` | Next.js 14 | Admin + Ops dashboard |
| `apps/api` | Fastify 4 | Backend API + BullMQ workers |

## Quick Start

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker (for Postgres + Redis)

pnpm install
pnpm dev                        # all apps + API
pnpm dev --filter=parent-app    # single app
pnpm dev --filter=api           # API only
```

## Key Commands

```bash
pnpm typecheck    # tsc --noEmit across all packages
pnpm lint         # Biome lint + format check
pnpm test         # Vitest unit + integration tests
pnpm db:migrate   # run pending Drizzle migrations
pnpm db:studio    # open Drizzle Studio UI
```

## Documentation

- **Architecture & conventions**: [`CLAUDE.md`](./CLAUDE.md)
- **Per-app context**: `apps/{name}/CLAUDE.md`
- **Per-package context**: `packages/{name}/CLAUDE.md`
- **Architecture decisions**: [`docs/ADR/`](./docs/ADR/)
- **Agent subagents & commands**: `.claude/`
