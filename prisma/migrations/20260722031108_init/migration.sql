-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "admin_status_enum" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "branch_status_enum" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "grant_status_enum" AS ENUM ('pending', 'approved', 'denied', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "actor_type_enum" AS ENUM ('platform_admin', 'user');

-- CreateEnum
CREATE TYPE "user_status_enum" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "staff_role_enum" AS ENUM ('manager', 'staff');

-- CreateEnum
CREATE TYPE "employment_status_enum" AS ENUM ('probation', 'active', 'on_leave', 'resigned', 'terminated');

-- CreateEnum
CREATE TYPE "salary_type_enum" AS ENUM ('monthly', 'hourly');

-- CreateEnum
CREATE TYPE "staff_status_enum" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "attendance_status_enum" AS ENUM ('present', 'late', 'absent', 'on_leave');

-- CreateEnum
CREATE TYPE "leave_type_enum" AS ENUM ('annual', 'medical', 'unpaid', 'other');

-- CreateEnum
CREATE TYPE "leave_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "checklist_type_enum" AS ENUM ('opening', 'closing', 'kitchen', 'weekly_cleaning', 'monthly_audit', 'custom');

-- CreateEnum
CREATE TYPE "recurrence_type_enum" AS ENUM ('daily', 'weekly', 'monthly');

-- CreateEnum
CREATE TYPE "assigned_type_enum" AS ENUM ('staff', 'role', 'shift');

-- CreateEnum
CREATE TYPE "checklist_instance_status_enum" AS ENUM ('pending', 'in_progress', 'pending_review', 'approved');

-- CreateEnum
CREATE TYPE "attachment_type_enum" AS ENUM ('image', 'document', 'video');

-- CreateEnum
CREATE TYPE "announcement_target_enum" AS ENUM ('branch', 'role', 'individual');

-- CreateEnum
CREATE TYPE "income_type_enum" AS ENUM ('sales', 'other');

-- CreateEnum
CREATE TYPE "income_channel_enum" AS ENUM ('walk_in', 'foodpanda', 'grabfood', 'other');

-- CreateEnum
CREATE TYPE "income_status_enum" AS ENUM ('received', 'pending');

-- CreateEnum
CREATE TYPE "expense_status_enum" AS ENUM ('paid', 'unpaid');

-- CreateEnum
CREATE TYPE "account_type_enum" AS ENUM ('cash', 'bank', 'ewallet');

-- CreateEnum
CREATE TYPE "cash_flow_type_enum" AS ENUM ('income', 'expense', 'transfer', 'withdrawal', 'capital_injection', 'refund', 'adjustment');

-- CreateEnum
CREATE TYPE "payroll_status_enum" AS ENUM ('draft', 'finalized', 'paid');

-- CreateEnum
CREATE TYPE "closing_status_enum" AS ENUM ('draft', 'locked', 'reopened');

-- CreateTable
CREATE TABLE "platform_admins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" "admin_status_enum" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "address" TEXT,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Asia/Kuala_Lumpur',
    "currency" CHAR(3) NOT NULL DEFAULT 'MYR',
    "status" "branch_status_enum" NOT NULL DEFAULT 'active',
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_access_grants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "grant_status_enum" NOT NULL DEFAULT 'pending',
    "approved_by" UUID,
    "granted_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_access_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID,
    "actor_type" "actor_type_enum" NOT NULL,
    "actor_platform_admin_id" UUID,
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB,
    "grant_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(30),
    "password_hash" TEXT NOT NULL,
    "status" "user_status_enum" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch_owners" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "is_primary_owner" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "branch_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "staff_role_enum" NOT NULL,
    "job_position" VARCHAR(100) NOT NULL,
    "employment_status" "employment_status_enum" NOT NULL DEFAULT 'active',
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "salary_type" "salary_type_enum" NOT NULL,
    "basic_salary" DECIMAL(12,2),
    "hourly_rate" DECIMAL(12,2),
    "status" "staff_status_enum" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "type" VARCHAR(50),
    "note" TEXT,
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "role" "staff_role_enum" NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT false,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "shift_id" UUID,
    "date" DATE NOT NULL,
    "is_off_day" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "schedule_id" UUID,
    "date" DATE NOT NULL,
    "clock_in_at" TIMESTAMPTZ(6),
    "clock_out_at" TIMESTAMPTZ(6),
    "worked_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "status" "attendance_status_enum" NOT NULL DEFAULT 'present',
    "edited_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "break_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "attendance_id" UUID NOT NULL,
    "break_start" TIMESTAMPTZ(6) NOT NULL,
    "break_end" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "break_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "type" "leave_type_enum" NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT,
    "status" "leave_status_enum" NOT NULL DEFAULT 'pending',
    "approved_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "type" "checklist_type_enum" NOT NULL,
    "recurrence_type" "recurrence_type_enum" NOT NULL,
    "weekdays" SMALLINT[],
    "day_of_month" SMALLINT,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_template_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "requires_photo" BOOLEAN NOT NULL DEFAULT false,
    "requires_note" BOOLEAN NOT NULL DEFAULT false,
    "sop_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_template_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "template_id" UUID,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "assigned_type" "assigned_type_enum" NOT NULL,
    "assigned_ref" UUID,
    "assigned_role" "staff_role_enum",
    "assigned_shift_id" UUID,
    "status" "checklist_instance_status_enum" NOT NULL DEFAULT 'pending',
    "submitted_by" UUID,
    "submitted_at" TIMESTAMPTZ(6),
    "approved_by" UUID,
    "approved_at" TIMESTAMPTZ(6),
    "reopen_requested_by" UUID,
    "reopen_requested_at" TIMESTAMPTZ(6),
    "reopen_request_reason" TEXT,
    "reopened_by" UUID,
    "reopened_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_instance_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "instance_id" UUID NOT NULL,
    "template_item_id" UUID,
    "description" TEXT NOT NULL,
    "requires_photo" BOOLEAN NOT NULL DEFAULT false,
    "requires_note" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_by" UUID,
    "completed_at" TIMESTAMPTZ(6),
    "photo_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_instance_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sops" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_attachments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "sop_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "type" "attachment_type_enum" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sop_acknowledgements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "sop_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "acknowledged_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_acknowledgements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "target_type" "announcement_target_enum" NOT NULL,
    "target_role" "staff_role_enum",
    "target_staff_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_reads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "read_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "type" "income_type_enum" NOT NULL,
    "channel" "income_channel_enum" NOT NULL DEFAULT 'walk_in',
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "income_status_enum" NOT NULL DEFAULT 'received',
    "account_id" UUID NOT NULL,
    "reference_number" VARCHAR(100),
    "receipt_image_url" TEXT,
    "notes" TEXT,
    "entered_by" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deleted_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "income_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "account_id" UUID NOT NULL,
    "reference_number" VARCHAR(100),
    "receipt_image_url" TEXT,
    "status" "expense_status_enum" NOT NULL DEFAULT 'unpaid',
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "source_template_id" UUID,
    "entered_by" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deleted_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "day_of_month" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "account_type_enum" NOT NULL,
    "current_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_flow_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "type" "cash_flow_type_enum" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "related_income_id" UUID,
    "related_expense_id" UUID,
    "counterpart_account_id" UUID,
    "is_auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "reference_number" VARCHAR(100),
    "receipt_image_url" TEXT,
    "date" DATE NOT NULL,
    "notes" TEXT,
    "entered_by" UUID NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),
    "deleted_by" UUID,
    "deleted_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "standard_hours_per_day" DECIMAL(4,2) NOT NULL DEFAULT 8.00,
    "standard_days_per_week" SMALLINT NOT NULL DEFAULT 6,
    "overtime_multiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.50,
    "pay_period" VARCHAR(20) NOT NULL DEFAULT 'monthly',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "basic_salary" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "computed_regular_hours" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "computed_overtime_hours" DECIMAL(7,2) NOT NULL DEFAULT 0,
    "computed_hourly_wages" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "computed_overtime" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonuses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "allowances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_salary" DECIMAL(12,2) NOT NULL,
    "status" "payroll_status_enum" NOT NULL DEFAULT 'draft',
    "finalized_by" UUID,
    "finalized_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_closings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "month" DATE NOT NULL,
    "status" "closing_status_enum" NOT NULL DEFAULT 'draft',
    "total_sales" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "other_income" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cogs" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "payroll_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "operating_expenses_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "platform_commissions_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gross_profit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_profit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "closing_balances" JSONB NOT NULL DEFAULT '{}',
    "unpaid_expenses_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "owner_withdrawals_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "checklist_status_summary" JSONB NOT NULL DEFAULT '{}',
    "locked_by" UUID,
    "locked_at" TIMESTAMPTZ(6),
    "reopened_by" UUID,
    "reopened_at" TIMESTAMPTZ(6),
    "reopen_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_closing_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "closing_id" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "locked_by" UUID NOT NULL,
    "locked_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_closing_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_closing_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "branch_id" UUID NOT NULL,
    "closing_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "type" VARCHAR(50),
    "uploaded_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_closing_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "branches_slug_key" ON "branches"("slug");

-- CreateIndex
CREATE INDEX "support_access_grants_branch_id_status_idx" ON "support_access_grants"("branch_id", "status");

-- CreateIndex
CREATE INDEX "support_access_grants_requested_by_status_idx" ON "support_access_grants"("requested_by", "status");

-- CreateIndex
CREATE INDEX "support_access_grants_expires_at_idx" ON "support_access_grants"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_branch_id_created_at_idx" ON "audit_logs"("branch_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "branch_owners_branch_id_idx" ON "branch_owners"("branch_id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_owners_user_id_branch_id_key" ON "branch_owners"("user_id", "branch_id");

-- CreateIndex
CREATE INDEX "staff_branch_id_status_idx" ON "staff"("branch_id", "status");

-- CreateIndex
CREATE INDEX "staff_user_id_idx" ON "staff"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_branch_id_user_id_key" ON "staff"("branch_id", "user_id");

-- CreateIndex
CREATE INDEX "staff_documents_staff_id_idx" ON "staff_documents"("staff_id");

-- CreateIndex
CREATE INDEX "role_permissions_branch_id_role_idx" ON "role_permissions"("branch_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_branch_id_role_module_action_key" ON "role_permissions"("branch_id", "role", "module", "action");

-- CreateIndex
CREATE INDEX "shifts_branch_id_idx" ON "shifts"("branch_id");

-- CreateIndex
CREATE INDEX "schedules_branch_id_date_idx" ON "schedules"("branch_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_staff_id_date_key" ON "schedules"("staff_id", "date");

-- CreateIndex
CREATE INDEX "attendance_records_branch_id_date_idx" ON "attendance_records"("branch_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_staff_id_date_key" ON "attendance_records"("staff_id", "date");

-- CreateIndex
CREATE INDEX "break_records_attendance_id_idx" ON "break_records"("attendance_id");

-- CreateIndex
CREATE INDEX "leave_requests_branch_id_status_idx" ON "leave_requests"("branch_id", "status");

-- CreateIndex
CREATE INDEX "leave_requests_staff_id_start_date_idx" ON "leave_requests"("staff_id", "start_date");

-- CreateIndex
CREATE INDEX "checklist_templates_branch_id_is_active_idx" ON "checklist_templates"("branch_id", "is_active");

-- CreateIndex
CREATE INDEX "checklist_templates_branch_id_recurrence_type_idx" ON "checklist_templates"("branch_id", "recurrence_type");

-- CreateIndex
CREATE INDEX "checklist_template_items_template_id_sort_order_idx" ON "checklist_template_items"("template_id", "sort_order");

-- CreateIndex
CREATE INDEX "checklist_instances_branch_id_status_due_at_idx" ON "checklist_instances"("branch_id", "status", "due_at");

-- CreateIndex
CREATE INDEX "checklist_instances_assigned_ref_idx" ON "checklist_instances"("assigned_ref");

-- CreateIndex
CREATE INDEX "checklist_instances_template_id_idx" ON "checklist_instances"("template_id");

-- CreateIndex
CREATE INDEX "checklist_instances_branch_id_reopen_requested_at_idx" ON "checklist_instances"("branch_id", "reopen_requested_at");

-- CreateIndex
CREATE INDEX "checklist_instance_items_instance_id_idx" ON "checklist_instance_items"("instance_id");

-- CreateIndex
CREATE UNIQUE INDEX "sop_categories_branch_id_name_key" ON "sop_categories"("branch_id", "name");

-- CreateIndex
CREATE INDEX "sops_branch_id_category_id_idx" ON "sops"("branch_id", "category_id");

-- CreateIndex
CREATE INDEX "sop_attachments_sop_id_idx" ON "sop_attachments"("sop_id");

-- CreateIndex
CREATE UNIQUE INDEX "sop_acknowledgements_sop_id_staff_id_key" ON "sop_acknowledgements"("sop_id", "staff_id");

-- CreateIndex
CREATE INDEX "announcements_branch_id_created_at_idx" ON "announcements"("branch_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "announcement_reads_announcement_id_staff_id_key" ON "announcement_reads"("announcement_id", "staff_id");

-- CreateIndex
CREATE INDEX "income_entries_branch_id_date_idx" ON "income_entries"("branch_id", "date");

-- CreateIndex
CREATE INDEX "income_entries_branch_id_status_idx" ON "income_entries"("branch_id", "status");

-- CreateIndex
CREATE INDEX "income_entries_branch_id_deleted_at_idx" ON "income_entries"("branch_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_branch_id_name_key" ON "expense_categories"("branch_id", "name");

-- CreateIndex
CREATE INDEX "expenses_branch_id_date_idx" ON "expenses"("branch_id", "date");

-- CreateIndex
CREATE INDEX "expenses_branch_id_status_idx" ON "expenses"("branch_id", "status");

-- CreateIndex
CREATE INDEX "expenses_branch_id_deleted_at_idx" ON "expenses"("branch_id", "deleted_at");

-- CreateIndex
CREATE INDEX "expense_templates_branch_id_is_active_idx" ON "expense_templates"("branch_id", "is_active");

-- CreateIndex
CREATE INDEX "accounts_branch_id_idx" ON "accounts"("branch_id");

-- CreateIndex
CREATE INDEX "cash_flow_transactions_branch_id_date_idx" ON "cash_flow_transactions"("branch_id", "date");

-- CreateIndex
CREATE INDEX "cash_flow_transactions_account_id_date_idx" ON "cash_flow_transactions"("account_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "cash_flow_transactions_related_income_id_key" ON "cash_flow_transactions"("related_income_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_flow_transactions_related_expense_id_key" ON "cash_flow_transactions"("related_expense_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_settings_branch_id_key" ON "payroll_settings"("branch_id");

-- CreateIndex
CREATE INDEX "payroll_records_branch_id_month_status_idx" ON "payroll_records"("branch_id", "month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_records_staff_id_month_key" ON "payroll_records"("staff_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_closings_branch_id_month_key" ON "monthly_closings"("branch_id", "month");

-- CreateIndex
CREATE INDEX "monthly_closing_snapshots_closing_id_locked_at_idx" ON "monthly_closing_snapshots"("closing_id", "locked_at");

-- CreateIndex
CREATE INDEX "monthly_closing_documents_closing_id_idx" ON "monthly_closing_documents"("closing_id");

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_access_grants" ADD CONSTRAINT "support_access_grants_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_access_grants" ADD CONSTRAINT "support_access_grants_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "platform_admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_access_grants" ADD CONSTRAINT "support_access_grants_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_access_grants" ADD CONSTRAINT "support_access_grants_revoked_by_fkey" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_platform_admin_id_fkey" FOREIGN KEY ("actor_platform_admin_id") REFERENCES "platform_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "support_access_grants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_owners" ADD CONSTRAINT "branch_owners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch_owners" ADD CONSTRAINT "branch_owners_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "break_records" ADD CONSTRAINT "break_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "break_records" ADD CONSTRAINT "break_records_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "attendance_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_templates" ADD CONSTRAINT "checklist_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_template_items" ADD CONSTRAINT "checklist_template_items_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "sops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_assigned_ref_fkey" FOREIGN KEY ("assigned_ref") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_assigned_shift_id_fkey" FOREIGN KEY ("assigned_shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_reopen_requested_by_fkey" FOREIGN KEY ("reopen_requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instances" ADD CONSTRAINT "checklist_instances_reopened_by_fkey" FOREIGN KEY ("reopened_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instance_items" ADD CONSTRAINT "checklist_instance_items_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instance_items" ADD CONSTRAINT "checklist_instance_items_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "checklist_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instance_items" ADD CONSTRAINT "checklist_instance_items_template_item_id_fkey" FOREIGN KEY ("template_item_id") REFERENCES "checklist_template_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_instance_items" ADD CONSTRAINT "checklist_instance_items_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_categories" ADD CONSTRAINT "sop_categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "sop_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sops" ADD CONSTRAINT "sops_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_attachments" ADD CONSTRAINT "sop_attachments_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_attachments" ADD CONSTRAINT "sop_attachments_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "sops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_acknowledgements" ADD CONSTRAINT "sop_acknowledgements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_acknowledgements" ADD CONSTRAINT "sop_acknowledgements_sop_id_fkey" FOREIGN KEY ("sop_id") REFERENCES "sops"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sop_acknowledgements" ADD CONSTRAINT "sop_acknowledgements_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_target_staff_id_fkey" FOREIGN KEY ("target_staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_categories" ADD CONSTRAINT "expense_categories_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_source_template_id_fkey" FOREIGN KEY ("source_template_id") REFERENCES "expense_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_templates" ADD CONSTRAINT "expense_templates_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_templates" ADD CONSTRAINT "expense_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_templates" ADD CONSTRAINT "expense_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_counterpart_account_id_fkey" FOREIGN KEY ("counterpart_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_related_income_id_fkey" FOREIGN KEY ("related_income_id") REFERENCES "income_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_related_expense_id_fkey" FOREIGN KEY ("related_expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "cash_flow_transactions_deleted_by_fkey" FOREIGN KEY ("deleted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_settings" ADD CONSTRAINT "payroll_settings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_records" ADD CONSTRAINT "payroll_records_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closings" ADD CONSTRAINT "monthly_closings_reopened_by_fkey" FOREIGN KEY ("reopened_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closing_snapshots" ADD CONSTRAINT "monthly_closing_snapshots_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closing_snapshots" ADD CONSTRAINT "monthly_closing_snapshots_closing_id_fkey" FOREIGN KEY ("closing_id") REFERENCES "monthly_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closing_snapshots" ADD CONSTRAINT "monthly_closing_snapshots_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closing_documents" ADD CONSTRAINT "monthly_closing_documents_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closing_documents" ADD CONSTRAINT "monthly_closing_documents_closing_id_fkey" FOREIGN KEY ("closing_id") REFERENCES "monthly_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_closing_documents" ADD CONSTRAINT "monthly_closing_documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ============================================================
-- Hand-authored additions (not expressible in schema.prisma):
--   1) pgcrypto extension for gen_random_uuid() defaults
--   2) CHECK constraints
--   3) Row-Level Security policies
-- See docs/DATABASE_SCHEMA.md for the source-of-truth design.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────── CHECK constraints ───────────────────────

ALTER TABLE "support_access_grants" ADD CONSTRAINT "chk_grant_expiry" CHECK (expires_at IS NULL OR expires_at > granted_at);

ALTER TABLE "audit_logs" ADD CONSTRAINT "chk_audit_actor" CHECK (
  (actor_type = 'platform_admin' AND actor_platform_admin_id IS NOT NULL AND actor_user_id IS NULL)
  OR (actor_type = 'user' AND actor_user_id IS NOT NULL AND actor_platform_admin_id IS NULL)
);

ALTER TABLE "users" ADD CONSTRAINT "chk_user_contact" CHECK (email IS NOT NULL OR phone IS NOT NULL);

ALTER TABLE "staff" ADD CONSTRAINT "chk_staff_salary" CHECK (
  (salary_type = 'monthly' AND basic_salary IS NOT NULL) OR (salary_type = 'hourly' AND hourly_rate IS NOT NULL)
);

ALTER TABLE "schedules" ADD CONSTRAINT "chk_schedule_offday_shift" CHECK (NOT is_off_day OR shift_id IS NULL);

ALTER TABLE "attendance_records" ADD CONSTRAINT "chk_attendance_times" CHECK (clock_out_at IS NULL OR clock_out_at > clock_in_at);

ALTER TABLE "break_records" ADD CONSTRAINT "chk_break_times" CHECK (break_end IS NULL OR break_end > break_start);

ALTER TABLE "leave_requests" ADD CONSTRAINT "chk_leave_dates" CHECK (end_date >= start_date);

ALTER TABLE "checklist_templates" ADD CONSTRAINT "chk_checklist_weekly_days" CHECK (recurrence_type != 'weekly' OR weekdays IS NOT NULL);
ALTER TABLE "checklist_templates" ADD CONSTRAINT "chk_checklist_monthly_day" CHECK (recurrence_type != 'monthly' OR day_of_month IS NOT NULL);
ALTER TABLE "checklist_templates" ADD CONSTRAINT "chk_checklist_day_of_month_range" CHECK (day_of_month IS NULL OR (day_of_month BETWEEN 1 AND 31));
ALTER TABLE "checklist_templates" ADD CONSTRAINT "chk_checklist_dates" CHECK (end_date IS NULL OR end_date >= start_date);

ALTER TABLE "checklist_instances" ADD CONSTRAINT "chk_checklist_instance_assignment" CHECK (
  (assigned_type = 'staff' AND assigned_ref IS NOT NULL)
  OR (assigned_type = 'role' AND assigned_role IS NOT NULL)
  OR (assigned_type = 'shift' AND assigned_shift_id IS NOT NULL)
);

ALTER TABLE "checklist_instance_items" ADD CONSTRAINT "chk_item_photo_required" CHECK (NOT requires_photo OR NOT is_completed OR photo_url IS NOT NULL);
ALTER TABLE "checklist_instance_items" ADD CONSTRAINT "chk_item_note_required" CHECK (NOT requires_note OR NOT is_completed OR notes IS NOT NULL);

ALTER TABLE "announcements" ADD CONSTRAINT "chk_announcement_target" CHECK (
  (target_type = 'branch')
  OR (target_type = 'role' AND target_role IS NOT NULL)
  OR (target_type = 'individual' AND target_staff_id IS NOT NULL)
);

ALTER TABLE "income_entries" ADD CONSTRAINT "chk_income_amount" CHECK (amount >= 0);

ALTER TABLE "expenses" ADD CONSTRAINT "chk_expense_amount" CHECK (amount >= 0);

ALTER TABLE "expense_templates" ADD CONSTRAINT "chk_expense_template_day" CHECK (day_of_month BETWEEN 1 AND 28);
ALTER TABLE "expense_templates" ADD CONSTRAINT "chk_expense_template_amount" CHECK (amount >= 0);

ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "chk_cash_flow_amount" CHECK (amount > 0);
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "chk_cash_flow_transfer_counterpart" CHECK (type != 'transfer' OR counterpart_account_id IS NOT NULL);
ALTER TABLE "cash_flow_transactions" ADD CONSTRAINT "chk_cash_flow_counterpart_distinct" CHECK (counterpart_account_id IS NULL OR counterpart_account_id != account_id);

ALTER TABLE "payroll_settings" ADD CONSTRAINT "chk_payroll_hours" CHECK (standard_hours_per_day > 0);
ALTER TABLE "payroll_settings" ADD CONSTRAINT "chk_payroll_overtime_multiplier" CHECK (overtime_multiplier >= 1);

ALTER TABLE "monthly_closings" ADD CONSTRAINT "chk_closing_locked_at" CHECK (status != 'locked' OR locked_at IS NOT NULL);

-- ═══════════════════════ Row-Level Security ═══════════════════════
-- Session context (set per-request by the app via `SET LOCAL` inside a transaction):
--   app.current_user_id           -- the logged-in Owner/Manager/Staff (users.id)
--   app.current_branch_id         -- the active branch context for this request
--   app.current_platform_admin_id -- the logged-in Platform Admin (platform_admins.id)
--
-- Membership checks below are wrapped in SECURITY DEFINER functions rather than inline
-- EXISTS subqueries for two reasons: (1) policies on "staff" and "branch_owners" would
-- otherwise query themselves, causing infinite recursion; (2) an inline subquery against
-- any RLS-protected table would itself be filtered by that table's own policy, which can
-- silently produce wrong (empty) results depending on the caller's session context.
-- SECURITY DEFINER functions, owned by the table-owning (migration) role, read straight
-- past RLS internally, avoiding both problems.

CREATE OR REPLACE FUNCTION app_is_branch_owner(p_branch_id uuid, p_user_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM branch_owners WHERE branch_id = p_branch_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION app_is_branch_staff(p_branch_id uuid, p_user_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM staff WHERE branch_id = p_branch_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION app_has_active_grant(p_branch_id uuid, p_platform_admin_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM support_access_grants
    WHERE branch_id = p_branch_id
      AND requested_by = p_platform_admin_id
      AND status = 'approved'
      AND now() < expires_at
  );
$$;

CREATE OR REPLACE FUNCTION app_shares_branch(p_user_a uuid, p_user_b uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT branch_id, user_id FROM branch_owners
      UNION ALL
      SELECT branch_id, user_id FROM staff
    ) a
    JOIN (
      SELECT branch_id, user_id FROM branch_owners
      UNION ALL
      SELECT branch_id, user_id FROM staff
    ) b ON a.branch_id = b.branch_id
    WHERE a.user_id = p_user_a AND b.user_id = p_user_b
  );
$$;

CREATE OR REPLACE FUNCTION app_platform_admin_can_see_user(p_target_user_id uuid, p_platform_admin_id uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM branch_owners bo
    JOIN support_access_grants g ON g.branch_id = bo.branch_id
    WHERE bo.user_id = p_target_user_id AND g.requested_by = p_platform_admin_id
      AND g.status = 'approved' AND now() < g.expires_at
  ) OR EXISTS (
    SELECT 1 FROM staff s
    JOIN support_access_grants g ON g.branch_id = s.branch_id
    WHERE s.user_id = p_target_user_id AND g.requested_by = p_platform_admin_id
      AND g.status = 'approved' AND now() < g.expires_at
  );
$$;

-- ─────────────────────── Special-case tables ───────────────────────

ALTER TABLE "platform_admins" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_admin_self" ON "platform_admins"
  USING (NULLIF(current_setting('app.current_platform_admin_id', true), '') IS NOT NULL)
  WITH CHECK (NULLIF(current_setting('app.current_platform_admin_id', true), '') IS NOT NULL);

ALTER TABLE "branches" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branch_visibility" ON "branches"
  USING (
    NULLIF(current_setting('app.current_platform_admin_id', true), '') IS NOT NULL
    OR app_is_branch_owner(id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR app_is_branch_staff(id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  )
  WITH CHECK (
    NULLIF(current_setting('app.current_platform_admin_id', true), '') IS NOT NULL
    OR app_is_branch_owner(id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_visibility" ON "users"
  USING (
    id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR app_shares_branch(id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR (
      NULLIF(current_setting('app.current_platform_admin_id', true), '') IS NOT NULL
      AND app_platform_admin_can_see_user(id, NULLIF(current_setting('app.current_platform_admin_id', true), '')::uuid)
    )
  )
  WITH CHECK (id = NULLIF(current_setting('app.current_user_id', true), '')::uuid);

ALTER TABLE "support_access_grants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grant_visibility" ON "support_access_grants"
  USING (
    app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR requested_by = NULLIF(current_setting('app.current_platform_admin_id', true), '')::uuid
  )
  WITH CHECK (
    app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR requested_by = NULLIF(current_setting('app.current_platform_admin_id', true), '')::uuid
  );

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_visibility" ON "audit_logs"
  USING (
    (branch_id IS NULL AND NULLIF(current_setting('app.current_platform_admin_id', true), '') IS NOT NULL)
    OR app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    OR app_has_active_grant(branch_id, NULLIF(current_setting('app.current_platform_admin_id', true), '')::uuid)
  )
  WITH CHECK (
    branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::uuid
    OR (branch_id IS NULL AND NULLIF(current_setting('app.current_platform_admin_id', true), '') IS NOT NULL)
  );

-- ─────────────── Standard branch-scoped tables ───────────────
-- (includes staff and branch_owners themselves — safe now since the helper
-- functions above bypass RLS internally rather than re-querying these tables
-- through their own policy)

-- branch_owners and staff get a bespoke policy rather than the standard one below:
-- "which branches am I part of" (login, the branch switcher) is inherently a
-- cross-branch lookup for the current user with no branch context chosen yet,
-- so seeing one's own membership row must not require app.current_branch_id.
ALTER TABLE "branch_owners" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "branch_owners"
  USING (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR (
      branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::uuid
      AND (
        app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        OR app_is_branch_staff(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        OR app_has_active_grant(branch_id, NULLIF(current_setting('app.current_platform_admin_id', true), '')::uuid)
      )
    )
  )
  WITH CHECK (
    branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::uuid
    AND app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
  );

ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "staff"
  USING (
    user_id = NULLIF(current_setting('app.current_user_id', true), '')::uuid
    OR (
      branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::uuid
      AND (
        app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        OR app_is_branch_staff(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
        OR app_has_active_grant(branch_id, NULLIF(current_setting('app.current_platform_admin_id', true), '')::uuid)
      )
    )
  )
  WITH CHECK (
    branch_id = NULLIF(current_setting('app.current_branch_id', true), '')::uuid
    AND (
      app_is_branch_owner(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
      OR app_is_branch_staff(branch_id, NULLIF(current_setting('app.current_user_id', true), '')::uuid)
    )
  );

ALTER TABLE "staff_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "staff_documents"
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

ALTER TABLE "role_permissions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "role_permissions"
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

ALTER TABLE "shifts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "shifts"
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

ALTER TABLE "schedules" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "schedules"
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

ALTER TABLE "attendance_records" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "attendance_records"
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

ALTER TABLE "break_records" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "break_records"
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

ALTER TABLE "leave_requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "leave_requests"
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

ALTER TABLE "checklist_templates" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "checklist_templates"
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

ALTER TABLE "checklist_template_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "checklist_template_items"
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

ALTER TABLE "checklist_instances" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "checklist_instances"
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

ALTER TABLE "checklist_instance_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "checklist_instance_items"
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

ALTER TABLE "sop_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sop_categories"
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

ALTER TABLE "sops" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sops"
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

ALTER TABLE "sop_attachments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sop_attachments"
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

ALTER TABLE "sop_acknowledgements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sop_acknowledgements"
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

ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "announcements"
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

ALTER TABLE "announcement_reads" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "announcement_reads"
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

ALTER TABLE "income_entries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "income_entries"
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

ALTER TABLE "expense_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "expense_categories"
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

ALTER TABLE "expenses" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "expenses"
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

ALTER TABLE "expense_templates" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "expense_templates"
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

ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "accounts"
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

ALTER TABLE "cash_flow_transactions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "cash_flow_transactions"
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

ALTER TABLE "payroll_settings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "payroll_settings"
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

ALTER TABLE "payroll_records" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "payroll_records"
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

ALTER TABLE "monthly_closings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "monthly_closings"
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

ALTER TABLE "monthly_closing_snapshots" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "monthly_closing_snapshots"
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

ALTER TABLE "monthly_closing_documents" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "monthly_closing_documents"
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

-- ─────────────── Least-privilege application role ───────────────
-- Postgres superusers (and table owners, by default) bypass Row-Level Security
-- entirely. The migration above runs as the superuser/owner, so a dedicated,
-- non-superuser role is required for the app's *runtime* queries — otherwise
-- every policy defined above would be silently ignored.
--
-- This role is created with no login password here on purpose. Set one manually
-- after this migration runs:
--   ALTER ROLE tenderista_app WITH PASSWORD '<choose one>';
-- then point the app's runtime connection string (not the migration one) at it.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'tenderista_app') THEN
    CREATE ROLE tenderista_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO tenderista_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tenderista_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO tenderista_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tenderista_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO tenderista_app;

-- ─────────────── Pre-authentication lookup functions ───────────────
-- Login must look a user up by email/phone before any session context exists to
-- satisfy the users/platform_admins RLS policies. These two functions are the only
-- sanctioned bypass, and only return what a login form needs (id, password hash,
-- status) — never used for anything but the login route handler.

CREATE OR REPLACE FUNCTION app_authenticate_user_lookup(p_identifier text)
RETURNS TABLE(id uuid, password_hash text, status text)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id, password_hash, status::text
  FROM users
  WHERE email = p_identifier OR phone = p_identifier
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_authenticate_admin_lookup(p_email text)
RETURNS TABLE(id uuid, password_hash text, status text)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id, password_hash, status::text
  FROM platform_admins
  WHERE email = p_email
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION app_authenticate_user_lookup(text) TO tenderista_app;
GRANT EXECUTE ON FUNCTION app_authenticate_admin_lookup(text) TO tenderista_app;
