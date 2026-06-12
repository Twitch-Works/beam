# Deployment

## Production URLs

| Service | Platform | URL |
|---|---|---|
| API | Render | `https://beam-api-xi.vercel.app` (set as `EXPO_PUBLIC_API_URL` / `NEXT_PUBLIC_API_URL`) |
| Admin dashboard | Vercel | Configured in Vercel project settings |
| Parent web | Vercel | Configured in Vercel project settings (not yet scaffolded) |

## API — Render

The `apps/api` Fastify server deploys to Render as a web service.

**Deploy trigger:** Push to `main` branch (auto-deploy enabled in Render).

**Build command:**
```bash
pnpm install && pnpm --filter=api build
```

**Start command:**
```bash
node apps/api/dist/app.js
```

**Required environment variables** (set in Render dashboard):
```
DATABASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
RESEND_API_KEY
UPSTASH_REDIS_URL
```

## Admin — Vercel

The `apps/admin` Next.js app deploys to Vercel.

**Deploy trigger:** Push to `main` branch (auto-deploy enabled in Vercel).

**Required environment variables** (set in Vercel dashboard):
```
NEXT_PUBLIC_API_URL=https://beam-api-xi.vercel.app
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Database Migrations

Run migrations against the production database before deploying API changes that add or alter tables:

```bash
# Point to production DB
DATABASE_URL=<production-url> pnpm --filter=api db:migrate
```

Always run `db:migrate` before the new API version starts serving traffic.

## Mobile Apps — EAS Build

Parent app and teacher app are built via Expo Application Services (EAS).

> **Note:** `eas.json` does not yet exist in either app. Production builds require it to be created and configured before `eas build` will work.

```bash
# Once eas.json is configured:
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

## Checklist Before Deploying

- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] Database migrations run (if schema changed)
- [ ] New environment variables added to Render / Vercel dashboards
- [ ] Razorpay webhook URL updated if API URL changed
