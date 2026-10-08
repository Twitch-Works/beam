-- Teacher-initiated booking change requests (reschedule / cancel) that an
-- admin must approve before the booking itself is touched.

CREATE TYPE "booking_change_request_type" AS ENUM ('reschedule', 'cancel');
CREATE TYPE "booking_change_request_status" AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

CREATE TABLE "booking_change_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
  "teacher_id" uuid NOT NULL REFERENCES "users"("id"),
  "type" "booking_change_request_type" NOT NULL,
  "status" "booking_change_request_status" DEFAULT 'pending' NOT NULL,
  "reason" text NOT NULL,
  "proposed_slot_id" uuid REFERENCES "slots"("id") ON DELETE SET NULL,
  "admin_note" text,
  "reviewed_by" uuid REFERENCES "users"("id"),
  "reviewed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- At most one open request per booking
CREATE UNIQUE INDEX "booking_change_requests_one_pending_per_booking"
  ON "booking_change_requests" ("booking_id")
  WHERE "status" = 'pending';

CREATE INDEX "booking_change_requests_teacher_idx" ON "booking_change_requests" ("teacher_id");
CREATE INDEX "booking_change_requests_status_idx" ON "booking_change_requests" ("status");
