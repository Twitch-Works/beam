# ADR 001 — Authentication Architecture

**Date:** 2026-05  
**Status:** Accepted  
**Deciders:** Beam team

---

## Context

Beam needs authentication across five apps (two React Native, two Next.js, one admin Next.js) and a Fastify API. Users fall into four roles: `parent`, `teacher`, `admin`, `super_admin`.

India-first product → OTP via SMS is the dominant auth UX pattern, preferred over passwords by Indian mobile users. Email is a fallback, not the primary.

---

## Decision

**Supabase Auth** for OTP delivery and session management, with a custom JWT role claim.

### Flow
1. User enters phone number → Supabase sends OTP via SMS
2. User verifies OTP → Supabase issues session (access token + refresh token)
3. Access token carries a custom `role` claim (`parent | teacher | admin | super_admin`) set by a Supabase Auth hook on first login
4. All API routes verify the JWT via `src/middleware/auth.ts` — never trust role from request body
5. Refresh tokens are rotated on every use and stored in Redis (`auth.repository.ts`)

### Mobile auth storage
- Expo SecureStore (never AsyncStorage for tokens)

### Web auth storage  
- Cookie-based via `@supabase/ssr` — `createServerClient()` in RSC and middleware

---

## Alternatives Considered

| Option | Reason Rejected |
|---|---|
| Firebase Auth | Supabase gives Postgres-native row-level security and self-hostability — better long-term fit |
| Custom JWT server | More maintenance overhead with no benefit at this scale |
| Clerk | Pricing model scales poorly for Indian market; less control over OTP provider |
| Passwords | OTP is the dominant and expected flow for Indian mobile apps |

---

## Consequences

- **Good:** Single auth provider across all 5 apps; OTP-native; Postgres RLS compatible
- **Good:** `@supabase/ssr` gives correct cookie handling for Next.js RSC without workarounds
- **Watch:** Supabase SMS OTP has regional rate limits — monitor for production volume
- **Watch:** Refresh token rotation in Redis means Redis downtime = forced re-login; acceptable trade-off

---

## Implementation References

- `apps/api/src/middleware/auth.ts` — JWT verification + role extraction
- `apps/api/src/modules/auth/` — OTP routes, service, refresh rotation
- `apps/parent-web/src/app/(auth)/` — web OTP flow
- `apps/parent-app/src/features/auth/` — mobile OTP flow
