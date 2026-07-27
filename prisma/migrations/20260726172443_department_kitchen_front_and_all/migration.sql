/*
  Warnings:

  - The values [cashier,dining,cleaning] on the enum `checklist_department_enum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `assigned_job_position` on the `daily_tasks` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "checklist_department_enum_new" AS ENUM ('kitchen', 'front', 'front_kitchen', 'all');
ALTER TABLE "staff" ALTER COLUMN "department" TYPE "checklist_department_enum_new" USING ("department"::text::"checklist_department_enum_new");
ALTER TABLE "opening_checklist_items" ALTER COLUMN "department" TYPE "checklist_department_enum_new" USING ("department"::text::"checklist_department_enum_new");
ALTER TABLE "closing_checklist_items" ALTER COLUMN "department" TYPE "checklist_department_enum_new" USING ("department"::text::"checklist_department_enum_new");
ALTER TABLE "closing_checklist_submissions" ALTER COLUMN "department" TYPE "checklist_department_enum_new" USING ("department"::text::"checklist_department_enum_new");
ALTER TYPE "checklist_department_enum" RENAME TO "checklist_department_enum_old";
ALTER TYPE "checklist_department_enum_new" RENAME TO "checklist_department_enum";
DROP TYPE "public"."checklist_department_enum_old";
COMMIT;

-- AlterTable
ALTER TABLE "daily_tasks" DROP COLUMN "assigned_job_position",
ADD COLUMN     "department" "checklist_department_enum" NOT NULL DEFAULT 'all';
