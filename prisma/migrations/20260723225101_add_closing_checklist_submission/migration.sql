-- DropForeignKey
ALTER TABLE "daily_closings" DROP CONSTRAINT "daily_closings_closed_by_fkey";

-- DropForeignKey
ALTER TABLE "daily_closings" DROP CONSTRAINT "daily_closings_reopened_by_fkey";

-- DropForeignKey
ALTER TABLE "daily_financial_records" DROP CONSTRAINT "daily_financial_records_updated_by_fkey";

-- DropForeignKey
ALTER TABLE "stock_items" DROP CONSTRAINT "stock_items_updated_by_fkey";

-- CreateTable
CREATE TABLE "closing_checklist_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "department" "checklist_department_enum" NOT NULL,
    "date" DATE NOT NULL,
    "photo_url" TEXT NOT NULL,
    "submitted_by" UUID NOT NULL,
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closing_checklist_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "closing_checklist_submissions_branch_id_date_idx" ON "closing_checklist_submissions"("branch_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "closing_checklist_submissions_branch_id_department_date_key" ON "closing_checklist_submissions"("branch_id", "department", "date");

-- AddForeignKey
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_financial_records" ADD CONSTRAINT "daily_financial_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closings" ADD CONSTRAINT "daily_closings_reopened_by_fkey" FOREIGN KEY ("reopened_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closing_checklist_submissions" ADD CONSTRAINT "closing_checklist_submissions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "closing_checklist_submissions" ADD CONSTRAINT "closing_checklist_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
