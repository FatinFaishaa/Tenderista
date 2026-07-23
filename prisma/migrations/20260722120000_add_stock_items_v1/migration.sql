-- Inventory V1 — a single branch-scoped stock_items table with a directly-editable
-- currentQuantity balance. No stock_transactions ledger yet (see schema.prisma
-- comment); "low stock" is computed at read time, not stored.

-- CreateTable
CREATE TABLE "stock_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20),
    "current_quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "min_alert_level" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "stock_items_current_quantity_check" CHECK ("current_quantity" >= 0),
    CONSTRAINT "stock_items_min_alert_level_check" CHECK ("min_alert_level" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_items_branch_id_name_key" ON "stock_items"("branch_id", "name");

-- CreateIndex
CREATE INDEX "stock_items_branch_id_is_active_idx" ON "stock_items"("branch_id", "is_active");

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────── Row-Level Security (same pattern as prior migrations) ───────────
-- Reuses app_is_branch_owner / app_is_branch_staff / app_has_active_grant, the
-- SECURITY DEFINER helper functions created in 20260722031108_init.
-- Read access: owner, staff (any role — quantity is visible to all branch members
-- since all of them may need to update it), or an active support grant.
-- Write access (INSERT/UPDATE/DELETE via WITH CHECK): owner or staff only — the
-- application layer further restricts item-management fields to Owner and the
-- quantity-only update to any branch member; RLS itself can't distinguish which
-- columns a given UPDATE touches.

ALTER TABLE "stock_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "stock_items"
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

GRANT SELECT, INSERT, UPDATE, DELETE ON "stock_items" TO tenderista_app;
