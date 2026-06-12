# Environment Variables

All env vars used across the Beam monorepo, organized by service.

## API (`apps/api/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (`postgresql://user:pass@host:5432/beam`) |
| `SUPABASE_URL` | **Yes** | Supabase project URL |
| `SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role key — bypasses RLS, never expose to clients |
| `JWT_SECRET` | **Yes** | ≥32 chars — used to verify Supabase JWTs |
| `PORT` | No | HTTP port (default: `3000`) |
| `UPSTASH_REDIS_URL` | No* | Redis URL for Upstash (preferred for prod) |
| `REDIS_URL` | No* | Local Redis URL (fallback if Upstash not set) |
| `RAZORPAY_KEY_ID` | Payments | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Payments | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Payments | Used to verify Razorpay webhook signatures |
| `RESEND_API_KEY` | Email | Resend transactional email |
| `EXPO_ACCESS_TOKEN` | Push | Expo push notification service token |
| `META_WHATSAPP_TOKEN` | WhatsApp | Meta WhatsApp Business API token |

*Redis is needed for slot locking and BullMQ job queues. App runs without it but those features will not work.

## Parent App (`apps/parent-app/.env`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | **Yes** | Base URL of the Beam API (falls back to production URL if unset) |
| `EXPO_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |

All Expo env vars must be prefixed `EXPO_PUBLIC_` to be accessible in client code.

## Teacher App (`apps/teacher-app/.env`)

| Variable | Required | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | **Yes** | Base URL of the Beam API |
| `EXPO_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |

## Admin (`apps/admin/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Base URL of the Beam API |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |

## Parent Web (`apps/parent-web/.env.local`) — not yet scaffolded

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Base URL of the Beam API |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |

## Teacher Web (`apps/teacher-web/.env.local`) — not yet scaffolded

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Base URL of the Beam API |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anon/public key |

## Getting Values

- **Supabase URL + keys:** Supabase dashboard → Project Settings → API
- **Razorpay keys:** Razorpay dashboard → Settings → API Keys
- **JWT_SECRET:** Generate with `openssl rand -hex 32`
- **Upstash Redis URL:** Upstash console → Redis database → REST URL
- **Resend API key:** Resend dashboard → API Keys
