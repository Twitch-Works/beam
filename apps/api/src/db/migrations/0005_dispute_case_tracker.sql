CREATE TYPE "session_issue_desired_outcome" AS ENUM ('refund', 'credit', 'rebooking', 'support');

ALTER TABLE "session_issues"
  ADD COLUMN "case_reference" text,
  ADD COLUMN "desired_outcome" "session_issue_desired_outcome" DEFAULT 'support',
  ADD COLUMN "next_action" text,
  ADD COLUMN "sla_target_at" timestamp,
  ADD COLUMN "attachment_urls" text[] DEFAULT '{}'::text[] NOT NULL,
  ADD COLUMN "intake_answers" jsonb DEFAULT '[]'::jsonb NOT NULL;

UPDATE "session_issues"
SET
  "case_reference" = 'CASE-' || upper(substr(replace("id"::text, '-', ''), 1, 8)),
  "desired_outcome" = CASE
    WHEN "resolution" = 'refund' THEN 'refund'::session_issue_desired_outcome
    WHEN "resolution" = 'credit' THEN 'credit'::session_issue_desired_outcome
    ELSE 'support'::session_issue_desired_outcome
  END,
  "next_action" = 'Beam support will review this case and update you in the app.',
  "sla_target_at" = COALESCE("reported_at", now()) + interval '1 day';

ALTER TABLE "session_issues"
  ALTER COLUMN "case_reference" SET NOT NULL,
  ALTER COLUMN "desired_outcome" SET NOT NULL;

ALTER TABLE "session_issues"
  ADD CONSTRAINT "session_issues_case_reference_unique" UNIQUE ("case_reference");
