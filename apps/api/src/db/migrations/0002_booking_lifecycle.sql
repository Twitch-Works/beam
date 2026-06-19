ALTER TYPE "public"."booking_status" ADD VALUE IF NOT EXISTS 'in_progress';

ALTER TABLE "bookings" ADD COLUMN "confirmed_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN "teacher_otp" text;
ALTER TABLE "bookings" ADD COLUMN "teacher_otp_generated_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN "teacher_otp_verified_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN "completed_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN "parent_completed_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN "payout_queued_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN "payout_released_at" timestamp;
ALTER TABLE "bookings" ADD COLUMN "last_whatsapp_sent_at" timestamp;
