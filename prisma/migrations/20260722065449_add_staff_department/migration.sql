-- Hand-authored (see chat: prisma migrate dev's shadow-database replay fails on the
-- pre-existing Opening Checklist migration ordering issue, unrelated to this change).
-- Adds a nullable department classification to staff, reusing the existing
-- checklist_department_enum (kitchen/cashier/dining/cleaning) rather than a new enum.
-- No RLS change needed — "staff" already has RLS from the initial migration, and this
-- is just a new column on that same table.

ALTER TABLE "staff" ADD COLUMN "department" "checklist_department_enum";
