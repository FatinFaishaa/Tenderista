-- Daily Financial Record V1 — deliberately separate from the fuller Finance module
-- (income_entries/expenses/accounts/cash_flow_transactions/etc.), which models a
-- richer ledger (accounts, receipts, paid/unpaid status, recurring templates) this V1
-- doesn't need. This is just: one manual daily snapshot per branch (sales copied in
-- from Niagawan, a cash count) plus a flat list of expenses against it, categorized
-- from a fixed list. totalExpenses/netCashFlow/cashDifference are computed at read
-- time, not stored — same "isLow"/"isCompleted" pattern as stock_items/daily_tasks.

-- CreateEnum
CREATE TYPE "daily_expense_category_enum" AS ENUM ('ingredients', 'packaging', 'utilities', 'transport', 'misc');

-- CreateTable
CREATE TABLE "daily_financial_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "total_sales" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "expected_cash" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "actual_cash" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_financial_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "record_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" "daily_expense_category_enum" NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_financial_records_branch_id_date_key" ON "daily_financial_records"("branch_id", "date");

-- CreateIndex
CREATE INDEX "daily_financial_records_branch_id_date_idx" ON "daily_financial_records"("branch_id", "date");

-- CreateIndex
CREATE INDEX "daily_expenses_record_id_idx" ON "daily_expenses"("record_id");

-- CreateIndex
CREATE INDEX "daily_expenses_branch_id_created_at_idx" ON "daily_expenses"("branch_id", "created_at");

-- AddForeignKey
ALTER TABLE "daily_financial_records" ADD CONSTRAINT "daily_financial_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_financial_records" ADD CONSTRAINT "daily_financial_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_financial_records" ADD CONSTRAINT "daily_financial_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_expenses" ADD CONSTRAINT "daily_expenses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_expenses" ADD CONSTRAINT "daily_expenses_record_id_fkey" FOREIGN KEY ("record_id") REFERENCES "daily_financial_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_expenses" ADD CONSTRAINT "daily_expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────── Row-Level Security (same pattern as prior migrations) ───────────
-- Reuses app_is_branch_owner / app_is_branch_staff / app_has_active_grant, the
-- SECURITY DEFINER helper functions created in 20260722031108_init.
-- Read access: owner, staff (any role, including manager — Staff view-only is
-- enforced by the application layer, RLS can't distinguish "manager" from "staff"
-- role), or an active support grant.
-- Write access (INSERT/UPDATE/DELETE via WITH CHECK): owner or staff — the
-- application layer further restricts create/edit/delete to Owner and Manager only,
-- rejecting plain Staff at the API route.

ALTER TABLE "daily_financial_records" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "daily_financial_records"
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

ALTER TABLE "daily_expenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "daily_expenses"
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

GRANT SELECT, INSERT, UPDATE, DELETE ON "daily_financial_records" TO tenderista_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "daily_expenses" TO tenderista_app;
