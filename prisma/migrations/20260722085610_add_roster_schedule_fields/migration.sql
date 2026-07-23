-- Hand-authored (see chat: prisma migrate dev's shadow-database replay fails on the
-- pre-existing Opening Checklist migration ordering issue, unrelated to this change).
--
-- Adds per-assignment start/end time (shiftId stays a template reference only, no
-- longer the source of truth for the actual time) and publish tracking to the
-- existing schedules table. Shift (templates) and RLS policies are untouched.

ALTER TABLE "schedules" ADD COLUMN "start_time" TIME;
ALTER TABLE "schedules" ADD COLUMN "end_time" TIME;
ALTER TABLE "schedules" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "schedules" ADD COLUMN "published_at" TIMESTAMPTZ(6);
ALTER TABLE "schedules" ADD COLUMN "published_by" UUID;

ALTER TABLE "schedules" ADD CONSTRAINT "schedules_published_by_fkey"
  FOREIGN KEY ("published_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Replace the old off-day/shift check with one that also covers the new time columns:
-- an off day has no shift and no times; a working day always has explicit times
-- (independent of whether shiftId still matches those times).
ALTER TABLE "schedules" DROP CONSTRAINT "chk_schedule_offday_shift";
ALTER TABLE "schedules" ADD CONSTRAINT "chk_schedule_offday_or_worked" CHECK (
  (is_off_day AND shift_id IS NULL AND start_time IS NULL AND end_time IS NULL)
  OR (NOT is_off_day AND start_time IS NOT NULL AND end_time IS NOT NULL)
);
