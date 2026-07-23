# Tenderista — Application Plan

Status: **planning only — no code written yet**
Stack baseline: Next.js 16.2.10 (App Router), React 19.2.4, TypeScript, Tailwind v4 (already scaffolded)

> **Scope:** Tenderista is a **staff operations and financial management platform** for restaurant branches — attendance, scheduling, checklists, SOPs, announcements, plus Owner-facing income/expense tracking, cash flow, payroll, and monthly financial closing. It is **not** a POS, ordering, or payment-processing system.

---

## 1. Business Model Summary

Tenderista is a **multi-branch staff-operations and financial-management platform**. Each branch is an independent workspace (own staff, tasks, financial records) provisioned by a Platform Admin. Branch data is private by default. One Owner account can manage multiple branches; Platform Admin has no access to any branch's operational data unless that branch's Owner grants temporary support access.

| Area | Decision |
|---|---|
| Purpose | Daily staff operations (attendance, scheduling, checklists, SOPs, announcements) + Owner financial management and monthly closing |
| Explicitly out of scope | POS/order entry, KDS, customer storefront/accounts, GrabFood/Foodpanda order integration, payment gateways, delivery management, promotions/loyalty, receipt/payment hardware, menu ordering/checkout |
| Branches | Multiple independent branches/workspaces; Platform Admin creates them; private by default |
| Branch ownership | **One Owner account can manage multiple branches under a single login**, switching between them; each branch's data stays isolated |
| Platform Admin access | **Zero standing access** to any branch's operational data; only temporary, Owner-granted, time-limited, fully audited support access |
| Staff records | Job position, employment status, start date, salary type (monthly/hourly), basic salary/hourly rate, documents/notes, active/inactive |
| Attendance | Clock in/out, breaks, schedules/shifts, off days, leave requests + approval, late/absence tracking, monthly summary — **always-online, no offline requirement** |
| Checklists | Opening/closing/kitchen/weekly-cleaning/monthly-audit, assignable to staff/role/shift, photo proof, approval workflow, recurring generation, overdue tracking |
| SOPs | Categorized, text/image/document/video content, staff read-acknowledgement tracking, linkable to checklist tasks |
| Announcements | Owner/Manager post, targeted by branch/role/individual, read/acknowledgement tracking |
| Financials | Presented as a **simple business money tracker, not accounting software** — no debit/credit/ledger/journal terminology anywhere. Manual "Money In" entry (channel totals only — no order-level detail) and "Money Out" (expense) tracking, each with Edit/Duplicate/Delete and plain-language fields (date, amount, category, paid/unpaid, account, reference number, receipt). **Full cash flow module in Phase 1**, auto-synced from Money In/Money Out (never entered twice) plus a small set of plain manual entry types (Owner Capital, Owner Withdrawal, Transfer, Refund, Correction). **Semi-automatic payroll** (attendance drives hours/overtime, Owner edits bonuses/allowances/deductions before finalizing). All financial edits/deletes are soft, reason-required, and fully audited. |
| Monthly closing | Guided month-end close: P&L rollup, cash flow, closing balances, comparison to prior month, lock + audited reopen, PDF/CSV export |
| Owner dashboard | Attendance today, checklist completion/overdue, month sales/expenses/profit, balances, outstanding payments, payroll status, closing status — aggregated per branch, with a branch switcher for multi-branch owners |
| Roles | Platform Admin, Branch Owner, Manager, Staff — permissions configurable per branch; salary/profit data restricted to authorized users |
| Audit | All sensitive actions logged, including support-access grant lifecycle |
| Design | Mobile-first; staff UI simple with large touch targets; Owner dashboard responsive across phone/tablet/desktop; English first, Bahasa Malaysia i18n-ready |

---

## 2. Architecture Overview

### 2.1 Identity model: users, branch ownership, and staff
Three distinct concepts, kept separate so one person can own several branches without duplicating logins:
- **`users`** — a platform-wide login identity (email/phone/password). Every human who accesses the system — Owner, Manager, or Staff — has exactly one `users` row, regardless of how many branches they're involved with.
- **`branch_owners`** — a join table (`user_id`, `branch_id`) granting Owner-level access to a branch. A single user can appear here for multiple branches — that's what "one login, multiple branches" means in practice. Owner access is always full access within that branch; it isn't subject to the configurable permission matrix.
- **`staff`** — branch-specific employment records (job position, salary, employment status, attendance/payroll linkage) for Managers and Staff, each tied to one branch. A `staff` row references a `users` row for login.

At request time, given a logged-in user and a selected branch, access is resolved as: Owner (via `branch_owners`) → full access; else Manager/Staff (via `staff.role`) → access per that branch's `role_permissions`; else denied.

### 2.2 Multi-tenancy & data privacy model
- **Tenant = Branch.** Every operational table carries a `branch_id`. PostgreSQL Row-Level Security (RLS) enforces branch isolation on all of them.
- **Platform Admin has zero standing access.** There is no blanket bypass policy. Support access works as an explicit, temporary grant:
  - Platform Admin requests access to a branch, stating a reason.
  - The branch **Owner approves**, choosing a duration.
  - While the grant is `approved` and unexpired, RLS additionally allows *that specific* Platform Admin to read *that specific* branch's rows — checked via an `EXISTS` clause against `support_access_grants`, not a role-wide bypass.
  - The Owner can **revoke** at any time; grants also **auto-expire**.
  - Every request, approval, denial, revocation, expiry, and action taken during an active grant is written to the audit log, tagged with the grant id.
- Application-layer queries are additionally scoped by session `branch_id`/grant context as defense in depth alongside RLS.

### 2.3 Tenant resolution via Proxy (Next.js 16)
Next.js 16 renamed Middleware to **Proxy** (`proxy.ts` at the project root, one file only, same semantics as old middleware). This resolves the branch from the URL/session (or the active support-access grant), attaches it to request context, and gates route groups by role/permission before the page renders.

### 2.4 Responsive & mobile-first design
- **Staff-facing surface** (clock in/out, my schedule, my checklists, SOP library, announcements): mobile-first, large touch targets, minimal navigation depth.
- **Owner/Manager back-office** (staff management, scheduling admin, checklist/SOP administration, financials, monthly closing, dashboard): fully responsive across desktop, tablet, and phone, with a **branch switcher** for Owners managing multiple branches.
- **Language**: English at launch; UI strings and data model structured for adding Bahasa Malaysia without rework.

### 2.5 Tech stack
| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router (already scaffolded) | Given |
| Database | PostgreSQL | RLS for strict branch isolation + grant-scoped access, relational fit for attendance/financial records |
| ORM | Prisma or Drizzle (decide at implementation time) | Type-safe schema, migrations |
| Auth | Auth.js (NextAuth) or Clerk, with custom RBAC + per-branch permission overrides | One login across owned branches; role + branch scoping per session |
| File storage | S3-compatible bucket | Checklist photo proof, staff documents, SOP attachments, receipt images, closing documents |
| Background jobs | Scheduled functions/queue | Recurring checklist generation, recurring expense generation, overdue-task sweeps, attendance-driven payroll calculation, grant expiry sweeps |
| PDF/CSV export | Server-side generation | Monthly closing report export |

No payment gateway, POS hardware, delivery-webhook, or realtime KDS layer is needed — all removed from scope.

---

## 3. User Roles & Permissions

**Platform level**
- **Platform Admin** — creates/suspends branches, platform settings, audit log. No default visibility into any branch's data; must request and receive a time-limited, Owner-approved support-access grant to view anything branch-specific.

**Branch level**
- **Branch Owner** (via `branch_owners`, one login can hold this for multiple branches) — full control per branch: staff, scheduling, checklists/SOPs, announcements, all financials, permission configuration, approving/revoking Platform Admin support access.
- **Manager** — day-to-day operations by default: staff scheduling, checklist/SOP administration, announcements, attendance approvals. **No financial visibility by default** — the Owner must explicitly grant it, and salary/profit detail can be withheld separately from general expense visibility.
- **Staff** — clock in/out, view own schedule, complete assigned checklists (photo proof where required), read/acknowledge SOPs and announcements, submit leave requests. No access to other staff's records or any financial module.

**Configurable permissions:** the roles above are fixed defaults for Manager/Staff (Owner access is always full within a branch); each branch Owner can adjust module- and action-level permissions per role. Financial data is gated as a distinct permission group (income/expenses vs. payroll/salary vs. profit figures), not a single on/off switch.

---

## 4. Pages / Screens by Surface

### A. Platform Admin Portal
- Dashboard (branch count, platform health — aggregate/operational only)
- Branch list & creation
- **Support access requests** (request access with a reason, view pending/active/expired grants, countdown to expiry)
- Branch detail (visible only while a grant is active for that branch)
- Platform settings
- Audit log

### B. Staff App (mobile-first)
- Clock in/out (with break start/end)
- My schedule (upcoming shifts, off days)
- Leave request submission
- My checklists (assigned tasks, mark complete, attach photo proof/notes)
- SOP library (browse by category, mark as read/acknowledged)
- Announcements (view, acknowledge)

### C. Branch Back-Office (Owner / Manager) — responsive
- **Branch switcher / portfolio view** — for Owners managing multiple branches, a landing view listing their branches to enter one
- **Dashboard** (per branch):
  - Staff clocked in today
  - Staff absent or late
  - Today's checklist completion
  - Overdue tasks
  - This month's sales
  - This month's expenses
  - Estimated monthly profit
  - Current cash and bank balances
  - Outstanding payments
  - Payroll status
  - Monthly closing status
- Staff management (add/edit staff, position, employment status, salary type/rate, documents/notes, active/inactive)
- Attendance & scheduling (shift templates, staff schedules, off days, leave approvals, late/absence records, monthly attendance summary)
- Checklists (template builder, assignment rules, recurrence, review/approve completed tasks with photo proof, overdue view)
- SOPs (category & content management, attach text/image/document/video, acknowledgement tracking, link to checklist tasks)
- Announcements (compose, target by branch/role/individual, read-status tracking)
- **Financials** *(Owner + explicitly authorized Managers only)*:
  - Income (manual daily/monthly entry, other income, channel totals only)
  - Expenses (categorized, receipt/invoice attachment, paid/unpaid, recurring templates)
  - **Cash flow** (cash/bank/e-wallet accounts, balances, transfers between accounts, owner withdrawals, capital injections, outstanding payments)
  - Payroll (auto-calculated hours/overtime from attendance, Owner-editable bonuses/allowances/deductions/advances, finalize → net salary, paid/unpaid)
- **Monthly Closing** (guided flow: review totals → payroll → expenses → cash flow → balances → comparison to prior month → notes/attachments → checklist-status confirmation → lock; reopen restricted to Owner, logged)
- **Support Access** panel (approve/deny/revoke Platform Admin requests, view history)
- Staff permissions editor
- Branch settings
- Audit log (branch-level actions)

---

## 5. Audit Trail

A unified, append-only audit log spans platform and branch actions. At minimum:

- Attendance edits (manual clock-in/out corrections)
- Checklist task completion and approval/rejection
- Salary or pay-rate changes
- Payroll finalization (including any bonus/allowance/deduction overrides applied)
- Financial entries and edits (income, expenses, cash flow, transfers)
- Deleted expenses
- Monthly closing approval (lock) and reopening
- Permission changes
- Branch creation/suspension (platform level)
- Support-access requests, approvals, denials, revocations, expiries, and any action taken during an active grant

Each entry captures: actor, branch (nullable for platform-level actions), action type, affected entity, before/after or relevant metadata, grant id (when applicable), and timestamp. Viewable by the Branch Owner (their branches) and Platform Admin (platform-level entries; branch entries only for branches where they've held a support grant).

---

## 6. Database Structure (entity-level)

**Platform-level**
- `platform_admins`
- `branches` — id, name, slug, address, timezone, currency (MYR), status, created_at
- `support_access_grants` — branch_id, requested_by (platform_admin), reason, status (pending/approved/denied/revoked/expired), approved_by (user), granted_at, expires_at, revoked_at
- `audit_logs` — id, branch_id (nullable), actor_type, actor_id, action, entity_type, entity_id, metadata (json), grant_id (nullable), created_at

**Identity**
- `users` — id, name, email, phone, password_hash, status (one login identity, spans branches)
- `branch_owners` — user_id, branch_id, is_primary_owner (enables one Owner login to manage multiple branches)

**Branch-scoped — Staff**
- `staff` — branch_id, user_id, role (manager/staff), job_position, employment_status, start_date, salary_type (monthly/hourly), basic_salary, hourly_rate, status (active/inactive), notes
- `staff_documents` — staff_id, file_url, type, note, uploaded_at
- `role_permissions` — branch_id, role, module, action, allowed

**Branch-scoped — Attendance & scheduling**
- `shifts` — branch_id, name, start_time, end_time
- `schedules` — branch_id, staff_id, shift_id, date, is_off_day
- `attendance_records` — staff_id, date, clock_in_at, clock_out_at, worked_hours (derived), status (present/late/absent), edited_by (nullable)
- `break_records` — attendance_id, break_start, break_end
- `leave_requests` — staff_id, type, start_date, end_date, status (pending/approved/rejected), approved_by

**Branch-scoped — Checklists & SOPs**
- `checklist_templates` — branch_id, name, type, frequency, recurrence_rule
- `checklist_template_items` — template_id, description, requires_photo, sop_id (nullable)
- `checklist_instances` — template_id, branch_id, due_at, assigned_type (staff/role/shift), assigned_ref, status (pending/in_progress/completed/overdue)
- `checklist_instance_items` — instance_id, template_item_id, is_completed, completed_by, completed_at, photo_url, notes, approval_status, approved_by, approved_at
- `sop_categories` — branch_id, name
- `sops` — category_id, title, content, created_by, updated_at
- `sop_attachments` — sop_id, file_url, type (image/document/video)
- `sop_acknowledgements` — sop_id, staff_id, acknowledged_at

**Branch-scoped — Announcements**
- `announcements` — branch_id, title, body, created_by, target_type (branch/role/individual), target_ref, created_at
- `announcement_reads` — announcement_id, staff_id, read_at

**Branch-scoped — Financials**
- `income_entries` — branch_id, date, type (sales/other), channel (walk-in/foodpanda/grabfood/other — label only), amount, status (received/pending), notes, entered_by
- `expense_categories` — branch_id, name, is_system (rent/utilities/salaries/ingredients/packaging/maintenance/marketing/platform-commissions/misc, plus custom)
- `expenses` — branch_id, category_id, date, amount, description, receipt_image_url, status (paid/unpaid), is_recurring, entered_by
- `expense_templates` — branch_id, category_id, description, amount, day_of_month, is_active
- `accounts` — branch_id, name, type (cash/bank/ewallet), current_balance
- `cash_flow_transactions` — branch_id, account_id, type (income/expense/transfer/withdrawal/capital_injection), amount, related_income_id, related_expense_id, counterpart_account_id, date, notes, entered_by
- `payroll_settings` — branch_id, standard_hours_per_day, standard_days_per_week, overtime_multiplier, pay_period
- `payroll_records` — staff_id, month, basic_salary, computed_hourly_wages, computed_overtime, bonuses, allowances, deductions, advances, net_salary, status (draft/finalized/paid), finalized_by, finalized_at

**Branch-scoped — Monthly closing**
- `monthly_closings` — branch_id, month, status (draft/locked/reopened), total_sales, other_income, cogs, payroll_total, operating_expenses_total, platform_commissions_total, gross_profit, net_profit, closing_balances (json), unpaid_expenses_total, owner_withdrawals_total, notes, checklist_status_summary (json), locked_by, locked_at, reopened_by, reopened_at, reopen_reason
- `monthly_closing_documents` — closing_id, file_url, type

---

## 7. Folder Structure

```
tenderista-app/
├── proxy.ts                          # branch resolution + role/permission gating + grant-context injection
├── app/
│   ├── (platform)/                   # Platform Admin — no branch scope
│   │   └── admin/
│   │       ├── branches/
│   │       ├── support-access/       # request/view support-access grants
│   │       ├── audit-log/
│   │       └── settings/
│   ├── (staff)/[branchSlug]/          # Mobile-first staff app
│   │   ├── attendance/
│   │   ├── schedule/
│   │   ├── leave/
│   │   ├── checklists/
│   │   ├── sops/
│   │   └── announcements/
│   ├── (backoffice)/
│   │   ├── branches/                 # branch switcher / portfolio for multi-branch Owners
│   │   └── [branchSlug]/             # Owner/Manager — responsive
│   │       ├── dashboard/
│   │       ├── staff/
│   │       │   └── permissions/
│   │       ├── attendance/
│   │       ├── checklists/
│   │       ├── sops/
│   │       ├── announcements/
│   │       ├── financials/
│   │       │   ├── income/
│   │       │   ├── expenses/
│   │       │   ├── cash-flow/
│   │       │   └── payroll/
│   │       ├── closing/
│   │       ├── support-access/       # approve/revoke Platform Admin grants
│   │       ├── audit-log/
│   │       └── settings/
│   └── api/
│       ├── attendance/
│       ├── checklists/
│       ├── financials/
│       ├── closing/
│       ├── support-access/           # grant request/approve/revoke/expire
│       └── auth/
├── lib/
│   ├── db/                            # schema + client, RLS policy definitions
│   ├── auth/                          # session, RBAC + permission-matrix helpers
│   ├── tenancy/                       # branch resolution + grant-context helpers used by proxy.ts
│   ├── audit/                         # audit log write helpers
│   ├── payroll/                       # attendance → hours/overtime calculation helpers
│   └── files/                         # upload handling for photos/documents/receipts
├── components/                        # shared, responsive UI
├── public/
└── docs/
    └── PLANNING.md
```

---

## 8. Phasing

### Phase 1 — MVP
- Authentication and branch access (Platform Admin, Owner — incl. multi-branch login, Manager, Staff)
- Staff management (profiles, position, employment status, salary type/rate, documents, active/inactive)
- Attendance (clock in/out, breaks, late/absence tracking) — always-online
- Scheduling (shifts, staff schedules, off days, leave requests + approval)
- Recurring checklists (templates, auto-generation, assignment to staff/role/shift, overdue tracking)
- Photo proof on checklist completion + approval/rejection workflow
- SOPs (categories, content, attachments, acknowledgement tracking) and targeted announcements
- Income and expense records (manual entry, categories, receipts, recurring expense templates)
- **Full cash flow module** (multi-account balances, transfers, withdrawals, capital injections, outstanding payments)
- **Semi-automatic payroll** (attendance auto-calculates hours/overtime; Owner edits bonuses/allowances/deductions/advances before finalizing)
- Owner dashboard (all KPIs in §4), with branch switcher for multi-branch Owners
- Monthly financial closing (full guided flow, lock/reopen with audit, PDF/CSV export)
- Roles, configurable permissions, and audit logs
- **Support-access management** (Platform Admin request → Owner approve/revoke → auto-expiry, fully audited)

### Phase 2 — Expansion
- Deeper payroll rule configuration (e.g. tiered overtime, shift-differential pay)
- Monthly attendance summary reporting refinements, exportable staff reports
- Richer SOP media handling (in-app video playback vs. linked hosting)
- Bahasa Malaysia translation

### Phase 3 — Scale
- Advanced platform-level analytics for Platform Admin (aggregate, anonymized — never a bypass of the grant-based access model)
- Possible future POS/sales-integration hooks (explicitly not built now, but the financial model — manual channel totals — should not block wiring in real transaction data later if ever desired)

---

## 9. Extensibility for Future Modules

- **Payroll/accounting integrations** (e.g. e-invoicing, bank feed reconciliation) — `payroll_records` and `cash_flow_transactions` are structured as clean, exportable ledgers.
- **Workforce analytics/forecasting** — `attendance_records` and `schedules` are consistently timestamped so future staffing-prediction tooling can read them directly.
- **Multi-branch ownership** is already modeled (`branch_owners`), so richer cross-branch owner reporting (e.g. a combined dashboard across all owned branches) can be added additively later.
- **General principle**: additive migrations over structural rewrites; new modules subscribe to existing records (e.g. a closing-complete event) rather than being woven into core attendance/financial flows.

---

## 10. Open Decisions for Implementation Time
- ORM: Prisma vs Drizzle
- Exact recurrence-rule format for checklist templates and recurring expenses (e.g. cron-like vs simple frequency enum)
- PDF generation library for monthly closing export
- Default overtime rule assumptions for `payroll_settings` (e.g. standard 8h/day, 1.5x overtime multiplier) — confirm against actual Malaysian labor norms/Employment Act expectations before finalizing
- Whether monthly attendance/financial summaries are computed on read or materialized into cache tables for performance
