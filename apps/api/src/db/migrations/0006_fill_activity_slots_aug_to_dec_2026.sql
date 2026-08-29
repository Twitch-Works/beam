-- Fill activity availability for testing from August 2026 through December 2026.
-- This creates recurring slots for every activity and rotates them across
-- multiple teachers when more than one teacher exists.

WITH teacher_pool AS (
  SELECT
    "users"."id" AS "teacher_id",
    row_number() OVER (ORDER BY "users"."created_at", "users"."id") AS "teacher_rank",
    count(*) OVER () AS "teacher_count"
  FROM "users"
  INNER JOIN "teachers" ON "teachers"."user_id" = "users"."id"
  WHERE "users"."role" = 'teacher'
),
activity_pool AS (
  SELECT
    "activities"."id" AS "activity_id",
    "activities"."session_duration_mins" AS "session_duration_mins",
    row_number() OVER (ORDER BY "activities"."created_at", "activities"."id") AS "activity_rank"
  FROM "activities"
),
slot_days AS (
  SELECT "slot_date"
  FROM generate_series(date '2026-08-01', date '2026-12-31', interval '1 day') AS "series"("slot_date")
  WHERE extract(isodow FROM "slot_date") IN (2, 4, 6)
),
slot_templates AS (
  SELECT *
  FROM (
    VALUES
      (1, time '09:00'),
      (2, time '11:30'),
      (3, time '16:00')
  ) AS "template"("slot_index", "start_time")
),
teacher_offsets AS (
  SELECT *
  FROM (
    VALUES (0), (1)
  ) AS "offsets"("teacher_offset")
),
generated_slots AS (
  SELECT DISTINCT
    "teacher_pool"."teacher_id",
    "activity_pool"."activity_id",
    "slot_days"."slot_date" AS "date",
    "slot_templates"."start_time",
    (
      "slot_templates"."start_time"
      + make_interval(mins => "activity_pool"."session_duration_mins")
    )::time AS "end_time"
  FROM "activity_pool"
  CROSS JOIN "slot_days"
  CROSS JOIN "slot_templates"
  CROSS JOIN "teacher_offsets"
  INNER JOIN "teacher_pool"
    ON "teacher_pool"."teacher_count" > 0
   AND mod(
     ("activity_pool"."activity_rank" - 1)
     + "teacher_offsets"."teacher_offset"
     + "slot_templates"."slot_index"
     + extract(doy FROM "slot_days"."slot_date")::int,
     "teacher_pool"."teacher_count"
   ) = "teacher_pool"."teacher_rank" - 1
)
INSERT INTO "slots" (
  "teacher_id",
  "activity_id",
  "date",
  "start_time",
  "end_time",
  "is_available"
)
SELECT
  "generated_slots"."teacher_id",
  "generated_slots"."activity_id",
  "generated_slots"."date",
  "generated_slots"."start_time",
  "generated_slots"."end_time",
  true
FROM "generated_slots"
WHERE NOT EXISTS (
  SELECT 1
  FROM "slots"
  WHERE "slots"."teacher_id" = "generated_slots"."teacher_id"
    AND "slots"."activity_id" = "generated_slots"."activity_id"
    AND "slots"."date" = "generated_slots"."date"
    AND "slots"."start_time" = "generated_slots"."start_time"
    AND "slots"."end_time" = "generated_slots"."end_time"
);
