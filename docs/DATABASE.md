# Database

PostgreSQL via Supabase. Schema is defined with Drizzle ORM in `apps/api/src/db/schema.ts`. Migrations are managed by `drizzle-kit`.

## Tables

| Table | Description |
|---|---|
| `users` | All users — parent, teacher, admin, super_admin (role enum) |
| `children` | Children belonging to a parent user |
| `teachers` | Teacher profile data (extends `users`) |
| `categories` | Activity categories (Art, Music, Dance, STEM, etc.) |
| `activities` | Bookable activity listings |
| `slots` | Time slots for a specific activity + teacher combination |
| `bookings` | A parent booking a slot for a child |
| `payments` | Payment record linked 1:1 to a booking |
| `payouts` | Teacher payout batches (aggregates multiple bookings) |
| `reviews` | Post-session review by parent, linked to booking |
| `discount_codes` | Coupon codes with flat or percent discount |
| `notifications` | In-app notification log per user |
| `audit_logs` | Admin action audit trail |

## Key Relationships

```
users ──< children          (parent has many children)
users ──── teachers         (1:1 — teacher profile row extends user row)
users ──< bookings          (as parentId or teacherId)
children ──< bookings
activities ──< slots
slots ──< bookings          (one slot per booking)
bookings ──── payments      (1:1)
bookings ──── reviews       (1:1, optional)
users ──< payouts           (teacher receives many payouts)
users ──< notifications
users ──< audit_logs        (as actorId)
```

## Enums

| Enum | Values |
|---|---|
| `user_role` | `parent`, `teacher`, `admin`, `super_admin` |
| `verification_status` | `pending`, `verified`, `rejected` |
| `booking_status` | `pending`, `confirmed`, `completed`, `cancelled`, `rescheduled` |
| `payment_status` | `pending`, `success`, `failed`, `refunded` |
| `payout_status` | `queued`, `dispatched`, `settled`, `failed` |
| `activity_status` | `draft`, `published`, `archived` |
| `session_type` | `1:1`, `group` |
| `payment_gateway` | `razorpay`, `upi`, `card`, `netbanking`, `wallet` |
| `discount_type` | `flat`, `percent` |
| `notification_channel` | `push`, `whatsapp`, `email`, `in_app` |

## Commands

```bash
# Generate migration files from schema changes
pnpm --filter=api db:generate

# Apply pending migrations
pnpm --filter=api db:migrate

# Seed demo data (dev only)
pnpm --filter=api db:seed

# Open Drizzle Studio (visual DB browser)
pnpm --filter=api db:studio
```

## Adding a New Table

1. Add the table definition to `apps/api/src/db/schema.ts`
2. Add the corresponding Zod schema to `packages/schemas/src/`
3. Run `pnpm --filter=api db:generate` to create the migration file
4. Commit both the schema change and the migration file together
5. Run `db:migrate` before deploying to production
