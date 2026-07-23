-- Daily Closing V1 — deliberately separate from the fuller MonthlyClosing module
-- (COGS, payroll, platform commissions, gross/net profit, checklist-status
-- aggregation, lock/reopen with immutable snapshots, document attachments). This is
-- just a record of whether a given day's daily_financial_records row has been
-- reviewed and closed, by whom, and when — no financial figures are stored here.
-- Soft close only: closing a day does not block further edits to that day's
-- financial record or expenses in V1.

-- CreateTable
CREATE TABLE "daily_closings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "closed_by" UUID,
    "closed_at" TIMESTAMPTZ(6),
    "reopened_by" UUID,
    "reopened_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_closings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- No separate (branch_id, date) index — the unique index below already covers it.
CREATE UNIQUE INDEX "daily_closings_branch_id_date_key" ON "daily_closings"("branch_id", "date");

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_reopened_by_fkey" FOREIGN KEY ("reopened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────── Row-Level Security (same pattern as prior migrations) ───────────
-- Reuses app_is_branch_owner / app_is_branch_staff / app_has_active_grant, the
-- SECURITY DEFINER helper functions created in 20260722031108_init.
-- Read access: owner, staff (any role), or an active support grant — same breadth as
-- daily_financial_records, so the Dashboard's closing-status card works for anyone
-- who can already see the branch.
-- Write access (INSERT/UPDATE/DELETE via WITH CHECK): owner or staff at the RLS
-- layer — the application layer narrows "close" to Owner/Manager and "reopen" to
-- Owner only; RLS itself can't distinguish those roles.

ALTER TABLE "daily_closings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "daily_closings"
  USING (
    branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::uuid
    AND (
      app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
      OR app_is_branch_staff(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
      OR app_has_active_grant(branch_id, NULLIF(current_setting('app.current_platform_admin_id', true), '')::uuid)
    )
  )
  WITH CHECK (
    branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::uuid
    AND (
      app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
      OR app_is_branch_staff(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON "daily_closings" TO tenderista_app;
