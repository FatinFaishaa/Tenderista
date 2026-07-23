-- Daily Task V1 — a separate module from Opening/Closing Checklist, same "flat
-- per-branch item list + daily completion" shape, no department split, no
-- recurrence rule: tasks are assigned by branch only, every active staff member
-- sees every active task.

-- CreateTable
CREATE TABLE "daily_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_task_completions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "completed_by" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_task_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_tasks_branch_id_sort_order_idx" ON "daily_tasks"("branch_id", "sort_order");

-- CreateIndex
CREATE INDEX "daily_task_completions_branch_id_date_idx" ON "daily_task_completions"("branch_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_task_completions_task_id_date_key" ON "daily_task_completions"("task_id", "date");

-- AddForeignKey
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task_completions" ADD CONSTRAINT "daily_task_completions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task_completions" ADD CONSTRAINT "daily_task_completions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "daily_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task_completions" ADD CONSTRAINT "daily_task_completions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────── Row-Level Security (same pattern as prior migrations) ───────────
-- Reuses app_is_branch_owner / app_is_branch_staff / app_has_active_grant, the
-- SECURITY DEFINER helper functions created in 20260722031108_init.

ALTER TABLE "daily_tasks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "daily_tasks"
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

ALTER TABLE "daily_task_completions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "daily_task_completions"
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

GRANT SELECT, INSERT, UPDATE, DELETE ON "daily_tasks" TO tenderista_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "daily_task_completions" TO tenderista_app;
