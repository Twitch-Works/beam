-- Temporary ("provisional") parent accounts created by the landing-page guest
-- booking flow, and the permanent link to the Supabase login that claims them.

CREATE TYPE "account_status" AS ENUM ('provisional', 'active');

ALTER TABLE "users"
  ADD COLUMN "account_status" "account_status" DEFAULT 'active' NOT NULL,
  ADD COLUMN "auth_user_id" uuid,
  ADD COLUMN "created_via" text,
  ADD COLUMN "claimed_at" timestamp;

ALTER TABLE "users"
  ADD CONSTRAINT "users_auth_user_id_unique" UNIQUE ("auth_user_id");

-- Existing landing-page guests (placeholder email) become provisional
UPDATE "users"
SET "account_status" = 'provisional', "created_via" = 'landing'
WHERE "role" = 'parent' AND "email" LIKE 'guest.%@guest.beamkids.in';
