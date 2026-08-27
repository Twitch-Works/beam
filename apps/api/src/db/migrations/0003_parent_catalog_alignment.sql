ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "latitude" real;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longitude" real;

ALTER TABLE "children" ADD COLUMN IF NOT EXISTS "gender" text;

ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "languages" text[] NOT NULL DEFAULT ARRAY['English']::text[];

ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "delivery_mode" text NOT NULL DEFAULT 'at_home';
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "venue_type" text NOT NULL DEFAULT 'at_home';
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "activity_format" text NOT NULL DEFAULT 'one_time';
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "trial_available" boolean NOT NULL DEFAULT false;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "locality" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "city" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "parent_value" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "session_flow" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "parent_waiting_policy" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "accessibility_notes" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "what_to_bring" text;
ALTER TABLE "activities" ADD COLUMN IF NOT EXISTS "cancellation_policy" text;
