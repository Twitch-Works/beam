CREATE TYPE "session_issue_type" AS ENUM ('no_show', 'venue_issue', 'safety_issue', 'schedule_issue', 'other');
CREATE TYPE "session_issue_status" AS ENUM ('reported', 'reviewing', 'resolved');
CREATE TYPE "session_issue_resolution" AS ENUM ('none', 'refund', 'credit', 'support_only');

CREATE TABLE "session_issues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "booking_id" uuid NOT NULL,
  "parent_id" uuid NOT NULL,
  "teacher_id" uuid,
  "issue_type" "session_issue_type" NOT NULL,
  "description" text,
  "status" "session_issue_status" NOT NULL DEFAULT 'reported',
  "resolution" "session_issue_resolution" NOT NULL DEFAULT 'none',
  "reported_at" timestamp NOT NULL DEFAULT now(),
  "resolved_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "session_issues"
  ADD CONSTRAINT "session_issues_booking_id_bookings_id_fk"
  FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "session_issues"
  ADD CONSTRAINT "session_issues_parent_id_users_id_fk"
  FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "session_issues"
  ADD CONSTRAINT "session_issues_teacher_id_users_id_fk"
  FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
