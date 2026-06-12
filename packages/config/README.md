# @beam/config

Environment variable validation for the API server. Parses `process.env` through a Zod schema at startup and exits with a clear error if any required variable is missing or malformed.

## Usage

```typescript
import { config } from '@beam/config'

// Use structured config — never read process.env directly in app code
config.db.url
config.supabase.url
config.supabase.anonKey
config.supabase.serviceRoleKey
config.jwt.secret
config.redis.url
config.razorpay.keyId
config.razorpay.keySecret
config.razorpay.webhookSecret
config.notifications.resendApiKey
config.notifications.expoAccessToken
config.notifications.metaWhatsappToken
config.port
config.isProduction
```

## What it validates

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (bypasses RLS) |
| `JWT_SECRET` | Yes | ≥32 chars — used to verify JWTs |
| `PORT` | No | Default: 3000 |
| `UPSTASH_REDIS_URL` or `REDIS_URL` | No | Redis for queues and slot locking |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | Payment flows | Razorpay credentials |
| `RESEND_API_KEY` | Email | Resend transactional email |
| `EXPO_ACCESS_TOKEN` | Push | Expo push notifications |
| `META_WHATSAPP_TOKEN` | WhatsApp | Meta WhatsApp Business API |

## Notes

This package is **API-only** — it reads `process.env` and will crash in browser environments. Mobile and web apps set their own env vars via `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` prefixes and do not use this package.
