-- CreateEnum
CREATE TYPE "checklist_department_enum" AS ENUM ('kitchen', 'cashier', 'dining', 'cleaning');

-- CreateTable
CREATE TABLE "opening_checklist_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "department" "checklist_department_enum" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opening_checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opening_checklist_completions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "completed_by" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opening_checklist_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opening_checklist_items_branch_id_department_sort_order_idx" ON "opening_checklist_items"("branch_id", "department", "sort_order");

-- CreateIndex
CREATE INDEX "opening_checklist_completions_branch_id_date_idx" ON "opening_checklist_completions"("branch_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "opening_checklist_completions_item_id_date_key" ON "opening_checklist_completions"("item_id", "date");

-- AddForeignKey
ALTER TABLE "opening_checklist_items" ADD CONSTRAINT "opening_checklist_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_checklist_items" ADD CONSTRAINT "opening_checklist_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_checklist_completions" ADD CONSTRAINT "opening_checklist_completions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_checklist_completions" ADD CONSTRAINT "opening_checklist_completions_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "opening_checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_checklist_completions" ADD CONSTRAINT "opening_checklist_completions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────── Row-Level Security (same pattern as the initial migration) ───────────
-- Reuses app_is_branch_owner / app_is_branch_staff / app_has_active_grant, the
-- SECURITY DEFINER helper functions created in 20260722031108_init — see that
-- migration for why direct EXISTS subqueries against staff/branch_owners aren't used.

ALTER TABLE "opening_checklist_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "opening_checklist_items"
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

ALTER TABLE "opening_checklist_completions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "opening_checklist_completions"
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

GRANT SELECT, INSERT, UPDATE, DELETE ON "opening_checklist_items" TO tenderista_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "opening_checklist_completions" TO tenderista_app;
