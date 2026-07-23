-- Leave Management V1 — extends the leave_requests table/enums already created in
-- 20260722031108_init. Existing column names (type, approved_by, decided_at) are kept
-- as-is; this only adds what V1's approve/reject flow needs that wasn't there yet: a
-- freeform note the reviewer can leave, and an "emergency" leave type. No RLS or grant
-- changes — leave_requests already has its tenant_isolation policy and table grants
-- from the init migration, and those aren't column-specific.

-- AlterEnum
ALTER TYPE "leave_type_enum" ADD VALUE 'emergency';

-- AlterTable
ALTER TABLE "leave_requests" ADD COLUMN "review_notes" TEXT;
