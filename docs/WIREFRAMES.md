# Tenderista — Wireframes & User Flows

Status: **planning only — no code written yet.** Companion to [PLANNING.md](PLANNING.md) and [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

Legend: `[ Button ]` = tappable/clickable action. `( )` = radio/checkbox. `[____]` = text input. `▓▓▓░░` = progress bar. `>` = navigates forward.

---

# PART A — STAFF APP (mobile-first, large touch targets)

The Staff App has no desktop layout by design — it's used on personal phones during a shift. A persistent bottom nav bar keeps navigation to one tap: **Home · Checklist · Schedule · More**. "More" opens SOP Library, Announcements, and Leave Request.

---

## 1. Staff Home

**Access:** Staff, Manager, Owner (anyone logging into the Staff App)
**Purpose:** Single-glance landing screen — today's status and the fastest path to clock in/out.

**Information shown:**
- Greeting + current date/time
- Clock status: "Not clocked in" / "Clocked in since 9:02 AM" / "On break since 1:05 PM"
- Today's scheduled shift (e.g. 9:00 AM–5:00 PM) or "Off today"
- Today's checklist progress (e.g. "3/8 tasks done")
- Unread announcements badge
- Pending leave request badge (if any)

**Main actions:** `[ Clock In ]` / `[ Clock Out ]` (primary button, state-dependent), `[ My Checklist ]`, `[ My Schedule ]`, announcement bell icon

**Mobile layout:**
```
+-----------------------------------+
|  Hi, Aisyah          🔔 2         |
|  Tue, 22 Jul  •  10:41 AM         |
+-----------------------------------+
|                                   |
|   Not clocked in                  |
|   Shift today: 9:00 AM–5:00 PM    |
|                                   |
|   +---------------------------+   |
|   |      CLOCK IN             |   |
|   +---------------------------+   |
|                                   |
+-----------------------------------+
|  Today's Checklist   ▓▓▓░░  3/8   |
|  [ View My Checklist ]            |
+-----------------------------------+
|  My Schedule: Wed off, Thu 9-5    |
|  [ View My Schedule ]             |
+-----------------------------------+
|  🏠 Home | ✅ Checklist | 📅 Sched | ☰ More |
+-----------------------------------+
```

**Navigation flow:** `Clock In/Out` → confirms inline, stays on Home with updated status → `My Checklist` tile → screen 4 → `My Schedule` tile → screen 3 → 🔔 → screen 7 → `☰ More` → screens 6/7/8.

---

## 2. Clock In / Clock Out

**Access:** Staff, Manager, Owner
**Purpose:** One-tap attendance action, with break tracking.

**Information shown:** live current time, current status, today's scheduled shift for comparison, elapsed worked time (if clocked in), elapsed break time (if on break)

**Main actions:** `[ Clock In ]` (not clocked in) → `[ Start Break ]` + `[ Clock Out ]` (clocked in) → `[ End Break ]` (on break); confirmation step before Clock Out

**Mobile layout:**
```
+-----------------------------------+
|  <  Clock In / Out                |
+-----------------------------------+
|                                   |
|         10:41:07 AM               |
|                                   |
|   Clocked in since 9:02 AM        |
|   Worked so far: 1h 39m           |
|   Shift: 9:00 AM–5:00 PM          |
|                                   |
|   +---------------------------+   |
|   |     START BREAK           |   |
|   +---------------------------+   |
|   +---------------------------+   |
|   |     CLOCK OUT             |   |
|   +---------------------------+   |
|                                   |
+-----------------------------------+
```
Clock Out tap → confirmation sheet: "Clock out at 10:41 AM? [ Cancel ] [ Confirm ]"

**Navigation flow:** Confirm → returns to Staff Home with "Not clocked in" state. Start/End Break → stays on this screen, status label updates.

---

## 3. My Schedule

**Access:** Staff, Manager, Owner
**Purpose:** View upcoming shifts/off days; entry point for leave requests.

**Information shown:** week list (day, date, shift time or "Off"), today highlighted, approved-leave days marked, week/month toggle

**Main actions:** `[ Request Leave ]`, `Week`/`Month` toggle, tap a day for shift detail

**Mobile layout:**
```
+-----------------------------------+
|  My Schedule        [Week|Month]  |
+-----------------------------------+
|  Mon 21   9:00 AM – 5:00 PM       |
|  Tue 22   9:00 AM – 5:00 PM  ●Today|
|  Wed 23   Off                     |
|  Thu 24   9:00 AM – 5:00 PM       |
|  Fri 25   1:00 PM – 9:00 PM       |
|  Sat 26   On Leave (Approved)     |
|  Sun 27   Off                     |
+-----------------------------------+
|   [ Request Leave ]               |
+-----------------------------------+
|  🏠 Home | ✅ Checklist | 📅 Sched | ☰ More |
+-----------------------------------+
```

**Navigation flow:** `Request Leave` → screen 8. Tapping a day → small detail popup (shift time, notes), no separate screen.

---

## 4. My Checklist

**Access:** Staff, Manager, Owner
**Purpose:** List checklist instances assigned to this person today (and overdue).

**Information shown:** cards per checklist (name, progress e.g. "4/6", status badge: Pending / In Progress / Pending Review / Approved, plus a red "Overdue" label when `due_at` has passed and it isn't Approved yet, due time), filter tabs

**Main actions:** filter tabs `Today / Overdue / Approved`, tap a card → Task Details (screen 5)

**Mobile layout:**
```
+-----------------------------------+
|  My Checklist                     |
|  [ Today ] [ Overdue ] [Approved] |
+-----------------------------------+
|  Opening Checklist        ⏰ 9 AM |
|  ▓▓▓▓░░  4/6            Pending > |
+-----------------------------------+
|  Kitchen Prep                     |
|  ▓▓▓▓▓▓  6/6      Pending Review >|
+-----------------------------------+
|  Closing Checklist        ⏰ 9 PM |
|  ▓▓▓▓▓▓  5/5           Approved > |
+-----------------------------------+
|  🏠 Home | ✅ Checklist | 📅 Sched | ☰ More |
+-----------------------------------+
```

**Navigation flow:** tap any card → screen 5 (Checklist Task Details) for that instance.

---

## 5. Checklist Task Details (photo proof + notes)

**Access:** Staff, Manager, Owner
**Purpose:** Complete individual checklist items, attach photo/notes, submit for approval — with a workflow that keeps the checklist accountable without adding extra taps for the common case.

**Status flow shown on this screen:** `In Progress` (working through items) → `Pending Review` (submitted; editable) → `Approved` (locked; staff can only request a reopen)

**Information shown:** checklist name + overall progress bar + status badge, item rows (description, checkbox, "photo required"/"note required" icon if applicable, linked SOP icon if applicable), a missing-items summary when the checklist can't yet be completed, locked banner + approver/date once approved

**Main actions:**
- **While In Progress:** tap checkbox to mark done, `[ 📷 Add Photo ]` (for photo-required items), `[ + Note ]` (for note-required items). `[ Complete Checklist ]` is **disabled and greyed out** until every required item has its photo/note — a line under the button states exactly what's missing (e.g. "2 items still need a photo"). The moment the last required item is satisfied, the button **enables automatically** — no separate "check if ready" step.
- **While Pending Review:** everything stays editable (checkboxes, photos, notes) — no un-submit/re-submit step needed; a small "Pending Review — you can still make changes" banner is shown.
- **Once Approved:** all controls are disabled; a banner reads "Approved by Hafiz M. · 22 Jul, 9:14 AM"; the only action left is `[ Request Reopen ]`.

**Mobile layout (In Progress, button disabled):**
```
+-----------------------------------+
|  <  Opening Checklist   ▓▓▓▓░░ 4/6|
|      Status: In Progress          |
+-----------------------------------+
|  ( ✓ ) Turn on all lights          |
|  ( ✓ ) Check fridge temperature    |
|  ( ✓ ) Restock napkins             |
|  ( ✓ ) Wipe down counters          |
|  (   ) Take opening photo  📷Req'd |
|        [ 📷 Add Photo ] [ + Note ] |
|        📄 Linked SOP: Opening Prep |
|  (   ) Count float cash    📝Req'd |
|        [ + Note ]                  |
+-----------------------------------+
|   [ Complete Checklist ]  (greyed)|
|   Missing: 1 photo, 1 note        |
+-----------------------------------+
```

**Once all required items are done (button auto-enables):**
```
+-----------------------------------+
|  <  Opening Checklist   ▓▓▓▓▓▓ 6/6|
|      Status: In Progress          |
+-----------------------------------+
|  ( ✓ ) ... all items checked ...   |
+-----------------------------------+
|      [ Complete Checklist ]        |
+-----------------------------------+
```

**Pending Review (still editable):**
```
+-----------------------------------+
|  <  Opening Checklist   ▓▓▓▓▓▓ 6/6|
|  Status: Pending Review            |
|  You can still make changes        |
+-----------------------------------+
|  ( ✓ ) ...items, all editable...   |
+-----------------------------------+
```

**Approved (locked):**
```
+-----------------------------------+
|  <  Opening Checklist   ▓▓▓▓▓▓ 6/6|
|  ✅ Approved by Hafiz M.           |
|     22 Jul, 9:14 AM                |
+-----------------------------------+
|  ( ✓ ) ...items, all read-only...  |
+-----------------------------------+
|      [ Request Reopen ]            |
+-----------------------------------+
```
Tapping `Request Reopen` opens one small prompt: "Why does this need to reopen? [___________]" → `[ Send Request ]`. After sending: the banner changes to "Reopen requested — waiting for Manager/Owner."

**Navigation flow:** `Complete Checklist` → status becomes `Pending Review`, back to screen 4 with updated badge. A Manager/Owner approves it from screen 13 → status becomes `Approved`, this screen locks. `Request Reopen` → Manager/Owner sees it in screen 13's reopen queue → once they reopen it, status returns to `Pending Review` and this screen unlocks again. Every submit, approve, reopen-request, and reopen is audit-logged (screen 22). Tapping "Linked SOP" → screen 6, that SOP's detail view.

---

## 6. SOP Library

**Access:** Staff, Manager, Owner
**Purpose:** Browse SOP categories/documents, read and acknowledge.

**Information shown:** category list → SOP list per category → SOP detail (text/image/document/video) with acknowledgement status

**Main actions:** tap category → SOP list; tap SOP → detail view; `[ Mark as Read ]`

**Mobile layout (list → detail):**
```
+-----------------------------------+      +-----------------------------------+
|  SOP Library                      |      |  <  Opening Prep                  |
+-----------------------------------+      +-----------------------------------+
|  📁 Opening Procedures      3 SOPs|      |  Category: Opening Procedures     |
|  📁 Food Safety             5 SOPs|  >   |  [ image ]  [ image ]             |
|  📁 Closing Procedures      2 SOPs|      |                                    |
|  📁 Equipment Handling      4 SOPs|      |  1. Turn on all equipment...      |
+-----------------------------------+      |  2. Check walk-in chiller...      |
                                            |  📄 Attached: prep-checklist.pdf  |
                                            |                                    |
                                            |  Status: Not yet read              |
                                            |  [ Mark as Read ]                  |
                                            +-----------------------------------+
```

**Navigation flow:** accessed from bottom nav `☰ More`, or a linked SOP inside screen 5. `Mark as Read` → badge updates, returns to list.

---

## 7. Announcements

**Access:** Staff, Manager, Owner
**Purpose:** View announcements targeted at this person/role/branch.

**Information shown:** list (title, sender, date, unread dot), full content on tap

**Main actions:** filter `Unread / All`, tap to expand (auto marks as read)

**Mobile layout:**
```
+-----------------------------------+
|  Announcements     [Unread | All] |
+-----------------------------------+
|  ● New closing time from 1 Aug     |
|    Owner • 2 hours ago            >|
+-----------------------------------+
|  ● Staff meeting this Friday       |
|    Manager • Yesterday            >|
+-----------------------------------+
|    Public holiday schedule         |
|    Owner • 3 days ago             >|
+-----------------------------------+
|  🏠 Home | ✅ Checklist | 📅 Sched | ☰ More |
+-----------------------------------+
```

**Navigation flow:** tap item → full-text detail view (in place), marks `announcement_reads`, no further navigation.

---

## 8. Leave Request

**Access:** Staff, Manager, Owner
**Purpose:** Submit and track leave requests.

**Information shown:** list of past/pending requests (type, dates, status), new-request form

**Main actions:** `[ + New Request ]`, form fields (type, start date, end date, reason), `[ Submit ]`, `[ Cancel Request ]` on pending items

**Mobile layout:**
```
+-----------------------------------+      +-----------------------------------+
|  Leave Requests   [ + New ]       |      |  <  New Leave Request              |
+-----------------------------------+      +-----------------------------------+
|  Annual • 26–27 Jul   Approved    |      |  Type:   [ Annual        v ]      |
|  Medical • 10 Jul     Rejected    |      |  Start:  [ 26 Jul 2026    ]        |
|  Unpaid • 2 Aug       Pending  [x]|      |  End:    [ 27 Jul 2026    ]        |
+-----------------------------------+      |  Reason: [_____________]          |
                                            |                                    |
                                            |          [ Submit Request ]        |
                                            +-----------------------------------+
```

**Navigation flow:** accessed from screen 3 (`Request Leave`) or `☰ More`. `Submit` → confirmation → back to list with new "Pending" row → routed to Attendance Overview (screen 11) for Manager/Owner approval.

---

# PART B — OWNER / MANAGER BACK-OFFICE (fully responsive)

Shell: **desktop** — left sidebar (Dashboard, Staff, Attendance, Schedule, Checklists, SOPs, Announcements, Financials ▸ Income/Expenses/Cash Flow/Payroll, Closing, Permissions, Audit Log) with a branch switcher at the top. **Mobile/tablet** — the same sections collapse behind a hamburger menu / bottom nav, screens stack into single-column cards.

---

## 9. Owner Dashboard

**Access:** Owner (full); Manager (only the KPIs their `role_permissions` grant — financial KPIs hidden by default)
**Purpose:** Prioritized daily/monthly health check, in this order: attendance today → checklist completion → overdue tasks → sales this month → expenses this month → estimated profit → cash/bank balances → unpaid items → payroll status → closing status.

**Information shown:** exactly the 10 KPIs above, each as a card; branch switcher if the Owner manages multiple branches

**Main actions:** branch switcher dropdown, each KPI card is clickable through to its module, `[ Start Monthly Closing ]` banner near month-end

**Mobile layout:**
```
+-----------------------------------+
|  ▾ Branch: Tenderista Cheras       |
+-----------------------------------+
|  👥 Staff Today       8/10 in     |
|     1 late · 1 absent          >  |
+-----------------------------------+
|  ✅ Checklists Today   ▓▓▓▓░ 82%  |
+-----------------------------------+
|  ⚠ Overdue Tasks           3   >  |
+-----------------------------------+
|  💰 Sales This Month   RM 48,200 >|
+-----------------------------------+
|  💸 Expenses This Month RM 21,400>|
+-----------------------------------+
|  📈 Est. Profit         RM 26,800 |
+-----------------------------------+
|  🏦 Cash RM 3,200 · Bank RM 41,500|
+-----------------------------------+
|  ❗ Unpaid Items      4  RM 2,150>|
+-----------------------------------+
|  🧾 Payroll: 6 Draft, 4 Finalized>|
+-----------------------------------+
|  📅 July Closing: Not started   > |
|     [ Start Monthly Closing ]     |
+-----------------------------------+
```

**Desktop layout:**
```
+---------+----------------------------------------------------------+
| Sidebar | ▾ Branch: Tenderista Cheras                               |
|         +----------------------------------------------------------+
| Dashboard| [Staff Today] [Checklists] [Overdue]  [Sales]  [Expenses] |
| Staff    |  8/10 in       82%          3         RM48.2k  RM21.4k   |
| Attendance+----------------------------------------------------------+
| Schedule | [Est. Profit] [Cash/Bank]  [Unpaid]   [Payroll] [Closing] |
| Checklists| RM26.8k      RM3.2k/41.5k  4 (RM2.15k) 6D/4F   Not start|
| SOPs     +----------------------------------------------------------+
| Announce |                    [ Start Monthly Closing ]              |
| Financials+---------------------------------------------------------+
| Closing  |
| Permiss. |
| Audit Log|
+---------+
```

**Navigation flow:** each card → its module screen (Staff Today → 11, Checklists/Overdue → 13, Sales/Expenses → 16/17, Cash/Bank → 18, Payroll → 19, Closing → 20).

---

## 10. Staff List and Staff Profile

**Access:** Owner (full); Manager (per `role_permissions` — salary fields masked unless explicitly granted)
**Purpose:** Manage the staff directory and individual employment records.

**Information shown (List):** searchable/filterable roster — name, position, role, employment status, active/inactive
**Information shown (Profile):** contact info, job position, employment status, start date, salary type/rate (masked if unauthorized), documents, notes, quick links to attendance/payroll history

**Main actions (List):** `[ + Add Staff ]`, search box, filters (role/status), row click → profile
**Main actions (Profile):** `[ Edit ]`, `[ Upload Document ]`, `[ Deactivate ]`/`[ Reactivate ]`, `[ View Attendance ]`, `[ View Payroll ]`

**Mobile layout:**
```
+-----------------------------------+      +-----------------------------------+
|  Staff          [ + Add Staff ]   |      |  <  Aisyah binti Rahman            |
|  [ Search... ] [Role v][Status v] |      +-----------------------------------+
+-----------------------------------+      |  Cashier · Active · Since 3 Jan 25|
|  Aisyah R.   Cashier    Active  > |      |  Salary: RM 1,800/mo (Monthly)     |
|  Hafiz M.    Manager    Active  > |      |  Phone: 012-3456789                |
|  Wei Ling T. Kitchen    On Leave> |      |  Notes: —                          |
+-----------------------------------+      |                                    |
                                            |  📄 Documents (2)   [ + Upload ]   |
                                            |  [ View Attendance ] [ View Payroll]|
                                            |  [ Edit ]     [ Deactivate ]       |
                                            +-----------------------------------+
```

**Desktop layout:** table with sortable columns replaces the card list; Profile opens as a two-column panel (info + salary on the left, documents/activity timeline on the right).

**Navigation flow:** `+ Add Staff` → creation form → back to list. Row → Profile → `View Attendance`/`View Payroll` → screens 11/19 pre-filtered to that staff member.

---

## 11. Attendance Overview

**Access:** Owner (full); Manager (per permission)
**Purpose:** Review attendance across all staff, correct records, approve leave.

**Information shown:** date/range picker, per-staff rows (clock in/out, worked hours, overtime hours, status), monthly summary tab, pending leave requests queue

**Main actions:** `[ Edit ]` a record (opens modal, requires a reason — audit logged), `[ Approve ]`/`[ Reject ]` on leave requests, `Day/Week/Month` view toggle

**Mobile layout:**
```
+-----------------------------------+
|  Attendance     [Day|Week|Month]  |
|  Tue, 22 Jul 2026                 |
+-----------------------------------+
|  Aisyah R.   9:02–17:05  8.0h  ✓ |
|  Hafiz M.    9:15–17:00  7.75h Late|
|  Wei Ling T. —            —  Absent|
+-----------------------------------+
|  Pending Leave Requests (2)       |
|  Aisyah • Unpaid • 2 Aug           |
|      [ Approve ] [ Reject ]        |
+-----------------------------------+
```

**Desktop layout:** full data table (staff × date grid or day-detail table) with inline edit cells and a side panel for the leave-approval queue.

**Navigation flow:** `Edit` → modal → save → row updates, entry written to `audit_logs`. `Approve` leave → updates `schedules`/`attendance_records` for those dates, visible back on the staff's My Schedule (screen 3).

---

## 12. Schedule Management

**Access:** Owner (full); Manager (per permission)
**Purpose:** Build and publish shift schedules.

**Information shown:** staff × date grid (assigned shift or off day per cell), shift template list

**Main actions:** `[ + Shift Template ]`, tap a cell to assign a shift/off day, `[ Copy Last Week ]`, `[ Publish Schedule ]`

**Mobile layout:**
```
+-----------------------------------+
|  Schedule          [ Publish ]    |
|  Week of 21 Jul           < wk >  |
+-----------------------------------+
|  Aisyah R.                        |
|   Mon 9-5  Tue 9-5  Wed Off ...   |
+-----------------------------------+
|  Hafiz M.                          |
|   Mon Off  Tue 1-9  Wed 9-5 ...    |
+-----------------------------------+
|  [ + Shift Template ] [ Copy Wk ] |
+-----------------------------------+
```

**Desktop layout:** a full calendar grid — staff as rows, 7 date columns, each cell click-to-assign via a small picker (shift template / off day).

**Navigation flow:** `Publish` → staff see updated shifts in My Schedule (screen 3) and (if changed) get an announcement-style notification.

---

## 13. Checklist Management

**Access:** Owner (full); Manager (per permission)
**Purpose:** Build checklist templates (with the new structured recurrence) and review/approve submitted instances.

**Information shown:** **Templates tab** — name, type, recurrence summary (e.g. "Daily", "Mon/Wed/Fri", "Monthly on the 1st"), active toggle. **Review tab** — checklists in `Pending Review`, with item photo/note proof visible inline. **Reopen Requests tab** — approved checklists a staff member has asked to reopen, with their reason.

**Main actions:** `[ + New Template ]` (name, type, recurrence builder: Daily / Weekdays / Weekly / Monthly + day picker, start/end date, item list with photo-required/note-required + SOP link toggles), one `[ Approve ]` per checklist in the Review tab (whole checklist, not per item — if something's off, it's still editable by staff so there's nothing to "reject"), `[ Reopen ]` per request in the Reopen Requests tab, filter by status/assignee

**Mobile layout:**
```
+-----------------------------------+
|  Checklists   [Templates | Review]|
+-----------------------------------+
|  Opening Checklist   Daily    On >|
|  Closing Checklist   Daily    On >|
|  Weekly Deep Clean    Mon     On >|
|  Monthly Audit    Day 1 of mo On >|
+-----------------------------------+
|      [ + New Template ]            |
+-----------------------------------+
```
```
+-----------------------------------+
|  Review Queue     [ Reopen Reqs 1]|
+-----------------------------------+
|  Opening Checklist — Aisyah R.     |
|  ▓▓▓▓▓▓ 6/6  📷 [thumb] 📷 [thumb] |
|              [ Approve ]           |
+-----------------------------------+
```
```
+-----------------------------------+
|  Reopen Requests                  |
+-----------------------------------+
|  Closing Checklist — Aisyah R.     |
|  "Forgot to note fridge temp"      |
|              [ Reopen ]            |
+-----------------------------------+
```

**Desktop layout:** split view — template list on the left, recurrence builder + item editor on the right; separate Review Queue and Reopen Requests tables, each with a single one-tap action per row (`Approve` / `Reopen`).

**Navigation flow:** `New Template` → builder form → save → appears in Templates tab, generates instances per its recurrence into staff's My Checklist (screen 4). `Approve` → that checklist instance becomes `Approved` and locks for the staff member, audit logged. `Reopen` (on a Reopen Requests row) → instance returns to `Pending Review`, unlocking it for that staff member again, audit logged.

---

## 14. SOP Management

**Access:** Owner (full); Manager (per permission)
**Purpose:** Create/manage SOP categories and content, monitor acknowledgement.

**Information shown:** category list, SOPs per category, acknowledgement completion (e.g. "7/10 staff read")

**Main actions:** `[ + Category ]`, `[ + New SOP ]` (title, rich text, attach image/document/video, link to a checklist item), `[ View Who Hasn't Read ]`, `[ Send Reminder ]`

**Mobile layout:**
```
+-----------------------------------+
|  SOPs             [ + Category ]  |
+-----------------------------------+
|  📁 Opening Procedures  [+ SOP]   |
|    Opening Prep     7/10 read  >  |
|    Cash Float Setup  9/10 read >  |
+-----------------------------------+
```

**Desktop layout:** sidebar of categories, main pane is the rich-text/media editor for the selected SOP, with an acknowledgement panel on the right.

**Navigation flow:** `+ New SOP` → editor → save → appears in staff SOP Library (screen 6). `Send Reminder` → triggers an announcement-style nudge to unacknowledged staff.

---

## 15. Announcements Management

**Access:** Owner (full); Manager (per permission)
**Purpose:** Compose and track announcements.

**Information shown:** sent list (title, target, date, read %), compose form

**Main actions:** `[ + New Announcement ]` (title, body, target: Branch / Role / Individual + picker), view read receipts per announcement

**Mobile layout:**
```
+-----------------------------------+
|  Announcements    [ + New ]       |
+-----------------------------------+
|  New closing time   Branch  6/10 >|
|  Staff meeting Fri   Role: All  4/6>|
+-----------------------------------+
```

**Desktop layout:** list on the left, compose/detail (with per-staff read receipt list) on the right.

**Navigation flow:** `+ New` → compose form → `[ Send ]` → appears in staff Announcements (screen 7); read receipts update live as staff open it.

---

> **Finance UX principle (screens 16–20):** this section must read like a simple business money tracker, not accounting software. Plain labels only — Money In, Money Out, Paid, Unpaid, Cash, Bank, E-wallet, Owner Withdrawal, Owner Capital — never debit, credit, journal, or ledger posting. Every Money In/Money Out entry offers the same three actions: Edit, Duplicate, Delete. Cash Flow fills in automatically from Money In/Money Out; the Owner only touches it directly for the handful of manual entry types listed in screen 18.

## 16. Money In (formerly "Income")

**Access:** Owner (full); Manager (only if `financials.income` permission granted)
**Purpose:** A simple record of money coming into the business — not accounting software. No order-level detail, no debit/credit language anywhere.

**Information shown:** date-filtered entries — date, category (Walk-in/Foodpanda/GrabFood/Other), amount, status (Received/Pending), account (Cash/Bank/E-wallet), reference number, receipt thumbnail, notes; month total

**Main actions:** `[ + Add Money In ]` (date, category, amount, status, account, reference number, notes, receipt photo), `[ Edit ]`, `[ Duplicate ]`, `[ Delete ]` (asks for a reason) per entry, filter by category/date/status

**Mobile layout:**
```
+-----------------------------------+
|  Money In          [ + Add ]      |
|  July 2026 total:    RM 48,200    |
+-----------------------------------+
|  22 Jul  Walk-in    RM 2,100  Recv|
|    Bank · Ref #A102       [ ⋮ ]   |
|  22 Jul  GrabFood    RM  650  Pend|
|    Bank · Ref #GF3391     [ ⋮ ]   |
|  21 Jul  Other       RM  300  Recv|
|    Cash · —               [ ⋮ ]   |
+-----------------------------------+
```
Tapping `[ ⋮ ]` opens: `[ Edit ] [ Duplicate ] [ Delete ]`. Saving or marking an entry "Received" shows a small confirmation toast: **"Cash flow updated automatically."**

**Desktop layout:** table with column filters (date/category/status/account), `Edit`/`Duplicate`/`Delete` as row actions, add/edit via a side panel with the same fields.

**Navigation flow:** entries roll up into the Owner Dashboard "Sales This Month" card and pre-fill Monthly Closing wizard step 1 (screen 20). Saving a "Received" entry automatically creates/updates its linked Cash Flow row (screen 18) — the Owner never re-enters it there. Editing amount/date/account/status is unrestricted before the month is locked; every change is recorded (previous value, new value, who, when, optional reason) and viewable in the Audit Log (screen 22). Deleting is soft — the record disappears from normal views but stays reviewable, and its linked cash-flow entry is reversed automatically.

---

## 17. Money Out (formerly "Expenses")

**Access:** Owner (full); Manager (only if `financials.expenses` permission granted)
**Purpose:** A simple record of money going out of the business, by category, with receipts and a paid/unpaid status — not accounting software.

**Information shown:** entries table — date, category, amount, status (Paid/Unpaid), account (Cash/Bank/E-wallet), reference number, receipt thumbnail, description; recurring templates tab; month total

**Main actions:** `[ + Add Money Out ]` (category, date, amount, description, account, reference number, receipt upload, Paid/Unpaid), `[ + Recurring Template ]`, `[ Edit ]`, `[ Duplicate ]`, `[ Delete ]` (asks for a reason)

**Mobile layout:**
```
+-----------------------------------+
|  Money Out  [Entries | Recurring] |
|  July 2026 total:    RM 21,400    |
+-----------------------------------+
|  22 Jul  Ingredients  RM 3,200 Paid|
|    Bank · Ref #INV5521    [ ⋮ ]   |
|  20 Jul  Rent         RM 6,000 Paid|
|    Bank · Ref #RENT-JUL   [ ⋮ ]   |
|  18 Jul  Marketing     RM  500 Unpaid|
|    Cash · —               [ ⋮ ]   |
+-----------------------------------+
|          [ + Add Money Out ]      |
+-----------------------------------+
```
Tapping `[ ⋮ ]` opens: `[ Edit ] [ Duplicate ] [ Delete ]`. Marking an entry "Paid" shows: **"Cash flow updated automatically."**

**Desktop layout:** filterable table with receipt thumbnail column, `Edit`/`Duplicate`/`Delete` row actions, add/edit via side panel, separate Recurring Templates tab (category, amount, day of month, active toggle).

**Navigation flow:** rolls up into Owner Dashboard "Expenses This Month" and "Unpaid Items" cards, and pre-fills Monthly Closing wizard step 2. Marking "Paid" automatically creates/updates the linked Cash Flow row (screen 18) against the chosen account — never entered twice. Free editing before the month locks; every change (and every delete, with its reason) is tracked and viewable in the Audit Log (screen 22).

---

## 18. Cash Flow

**Access:** Owner (full); Manager (only if `financials.cash_flow` permission granted)
**Purpose:** A simple running record of the business's cash, bank, and e-wallet balances — most of it fills in by itself from Money In/Money Out; the Owner only adds entries here for things that don't come from a Money In/Money Out record.

**Information shown:** account cards (Cash/Bank/E-wallet with current balance), transaction list (date, label, account, amount, notes) — auto-generated rows show a small **"Auto"** tag with a link back to their Money In/Money Out entry, outstanding payments summary

**Main actions:** `[ + Add Account ]`; one-tap buttons for the plain manual entry types — `[ Owner Capital ]` `[ Owner Withdrawal ]` `[ Bank Deposit ]` `[ Cash Withdrawal ]` `[ Transfer ]` `[ Refund ]` `[ Correction ]`; `[ Edit ]`/`[ Delete ]` (reason required) on manual entries only — auto rows are edited via their source Money In/Money Out record

**Mobile layout:**
```
+-----------------------------------+
|  Cash Flow                        |
|  [Cash RM3,200] [Bank RM41,500]   |
+-----------------------------------+
|  [Owner Capital][Owner Withdrawal]|
|  [Bank Deposit][Cash Withdrawal]  |
|  [Transfer][Refund][Correction]   |
+-----------------------------------+
|  22 Jul  Ingredients  -RM3,200     |
|    Bank · Auto ↳ Money Out entry  |
|  20 Jul  Bank Deposit  RM5,000     |
|    Cash → Bank             [ ⋮ ]  |
|  15 Jul  Owner Withdrawal -RM2,000|
|    Bank                    [ ⋮ ]  |
+-----------------------------------+
|  Outstanding: 4 items · RM 2,150   |
+-----------------------------------+
```

**Desktop layout:** account cards row at top, the same one-tap manual-entry buttons in a toolbar, full transaction table below with account/date/type filters; auto rows are visually muted with an "Auto" badge and are not directly editable.

**Navigation flow:** feeds Owner Dashboard "Cash and Bank Balances" card and pre-fills Monthly Closing wizard steps 4 and 5. Every Money In marked Received / Money Out marked Paid appears here automatically — the Owner never records the same transaction twice. "Bank Deposit" and "Cash Withdrawal" are just labeled shortcuts for a transfer between two specific accounts; "Transfer" covers any other account pair (e.g. involving an e-wallet).

---

## 19. Payroll

**Access:** Owner (full); Manager (only if `financials.payroll` permission granted — often more restricted than general expenses)
**Purpose:** Review and finalize monthly payroll; semi-automatic (hours/overtime computed, adjustments editable).

**Information shown:** month selector, per-staff row (basic salary, computed regular/overtime hours & wages, editable bonuses/allowances/deductions/advances, net salary, status Draft/Finalized/Paid)

**Main actions:** `[ Recalculate from Attendance ]` (while draft), edit adjustment fields inline, `[ Finalize Payroll ]`, `[ Mark as Paid ]`, `[ Export Payslip ]`

**Mobile layout:**
```
+-----------------------------------+
|  Payroll — July 2026    Draft     |
+-----------------------------------+
|  Aisyah R.  Basic RM1,800          |
|   +160h reg / 6h OT = RM1,845     |
|   Bonus [___] Deduct [___]         |
|   Net: RM 1,845           Draft    |
+-----------------------------------+
|  [ Recalculate ] [ Finalize All ]  |
+-----------------------------------+
```

**Desktop layout:** full editable table — one row per staff, columns for basic/regular/overtime/bonus/allowance/deduction/advance/net/status, with bulk `Finalize` and per-row `Export Payslip`.

**Navigation flow:** feeds Owner Dashboard "Payroll Status" card and Monthly Closing wizard step 3. `Finalize` locks the computed columns (only adjustments remain editable), audit logged.

---

## 20. Monthly Closing Wizard

**Access:** Owner (full — including Lock/Reopen); Manager may prepare/view steps only if permitted, cannot Lock or Reopen
**Purpose:** Guided 8-step month-end close.

**Steps:** 1 Money In → 2 Money Out → 3 Payroll → 4 Cash & Account Balances → 5 Outstanding Payments → 6 Profit Summary → 7 Documents & Notes → 8 Review & Lock

**Information shown per step:** the relevant totals pulled live from Income/Expenses/Payroll/Cash Flow, editable notes, a stepper showing progress; step 6 computes gross/net profit; step 8 shows the full rollup plus comparison to the previous month before locking

**Main actions:** `[ Back ]` / `[ Next ]`, `[ Save Draft ]` at any step, step 8: `[ Lock Month ]` (confirmation dialog); once locked: `[ Export PDF ]`, `[ Export CSV ]`, and (Owner only) `[ Reopen Month ]` (requires a reason, audit logged)

**Mobile layout (per-step, single column, sticky nav):**
```
+-----------------------------------+
|  Monthly Closing — July 2026      |
|  1●─2●─3●─4○─5○─6○─7○─8○           |
+-----------------------------------+
|  Step 2: Money Out                |
|                                    |
|  Ingredients        RM 12,000     |
|  Rent                RM 6,000     |
|  Utilities            RM 1,400    |
|  Marketing              RM 500    |
|  Other                RM 1,500    |
|  ───────────────────────────      |
|  Total Expenses      RM 21,400    |
|                                    |
|  Note: [___________________]      |
+-----------------------------------+
|      [ Back ]        [ Next ]     |
|            [ Save Draft ]         |
+-----------------------------------+
```

**Step 8 (Review & Lock):**
```
+-----------------------------------+
|  Step 8: Review & Lock            |
+-----------------------------------+
|  Total Sales         RM 48,200    |
|  Other Income          RM 300     |
|  COGS                RM 12,000    |
|  Payroll              RM 9,200    |
|  Operating Expenses    RM 9,200   |
|  Platform Commission    RM 1,200  |
|  Gross Profit         RM 35,000   |
|  Net Profit           RM 26,800   |
|  vs. June: +RM 2,100 (+8.5%)      |
|  Closing balances: Cash RM3,200,  |
|    Bank RM41,500                  |
|  Unpaid: RM 2,150 · Withdrawals: RM 5,000|
|  📎 3 documents attached           |
+-----------------------------------+
|      [ Back ]     [ Lock Month ]  |
+-----------------------------------+
```

**Desktop layout:** left-hand vertical stepper (all 8 steps always visible/clickable if already reached), main content panel on the right shows the current step; step 8 shows a two-column summary (financials left, balances/documents right) before the Lock action.

**Navigation flow:** entered from Owner Dashboard `[ Start Monthly Closing ]` or the Closing module directly. `Lock Month` → confirmation → status becomes `locked`, contributing records (Money In/Money Out/Payroll/Cash Flow for that month) become read-only, a snapshot of the totals is preserved, an entry is written to `audit_logs`, and the dashboard's "Monthly Closing Status" card updates.

**Reopen flow (Owner only):** on a locked month, `[ Reopen Month ]` opens a single small prompt — "Why are you reopening July 2026? [___________]" → `[ Confirm ]`. That's the whole flow; nothing else is asked. Once reopened: records become editable again exactly as before locking, the original locked snapshot stays intact and viewable, and every subsequent change is audit-logged. The Owner can then `[ Lock Month ]` again from step 8, which takes a fresh snapshot without touching the earlier one — so re-locking never loses the prior numbers.

---

## 21. Roles and Permissions

**Access:** Owner only
**Purpose:** Configure what Manager and Staff roles can do, per module/action.

**Information shown:** a matrix — roles (Manager, Staff) × modules (Staff, Attendance, Checklists, SOPs, Announcements, Financials.Income, Financials.Expenses, Financials.Cash Flow, Financials.Payroll, Closing) × actions (View/Create/Edit/Delete/Approve) with allow/deny toggles

**Main actions:** toggle a permission, `[ Save Changes ]`, `[ Reset to Default ]`

**Mobile layout (accordion per module):**
```
+-----------------------------------+
|  Roles & Permissions              |
+-----------------------------------+
|  ▾ Financials.Expenses            |
|     Manager:  View (●) Create(●)  |
|               Edit (○) Delete(○)  |
|     Staff:    No access (fixed)   |
|  ▸ Financials.Payroll             |
|  ▸ Attendance                     |
|  ▸ Checklists                     |
+-----------------------------------+
|      [ Save Changes ]             |
+-----------------------------------+
```

**Desktop layout:** full grid — modules as rows, role/action combinations as columns, all togglable in place, with a `Reset to Default` per row.

**Navigation flow:** `Save Changes` → updates `role_permissions`, takes effect immediately for affected sessions, change is audit logged. No further navigation — a configuration screen, not a flow.

---

## 22. Audit Log

**Access:** Owner (their branch); Platform Admin (platform-level entries only, or this branch's entries only while a support-access grant is active)
**Purpose:** Review the history of sensitive actions.

**Information shown:** filterable list — date/time, actor, action type, entity, module; expandable row shows metadata (before/after values, grant id if relevant)

**Main actions:** filter by date range / actor / action type / module, tap a row to expand detail, `[ Export ]` (optional)

**Mobile layout:**
```
+-----------------------------------+
|  Audit Log      [ Filter ]        |
+-----------------------------------+
|  22 Jul 10:41  Hafiz M.            |
|   attendance.edit — Aisyah R.   >  |
|  22 Jul 09:15  Aisyah R.           |
|   checklist.complete — Opening  >  |
|  21 Jul 18:02  Owner                |
|   closing.lock — June 2026      >  |
|  21 Jul 14:00  Platform Admin       |
|   support_access.approve        >  |
+-----------------------------------+
```

**Desktop layout:** full table with a filter sidebar (date range, actor, module, action type), expandable rows showing the metadata JSON in a readable diff-style view.

**Navigation flow:** a terminal/standalone screen — reviewed, not acted upon (append-only log, no edit/delete). Entries may deep-link back to the related record (e.g. tapping a `closing.lock` entry jumps to that locked month in screen 20, read-only).

---

# Cross-Screen Flow Summary

**Staff App:** Home ⇄ Clock In/Out; Home → My Checklist → Task Details (→ SOP Library); Home → My Schedule → Leave Request; Home → Announcements. Bottom nav makes every screen reachable in one tap from any other.

**Back-Office:** Dashboard is the hub — every KPI card routes to its module. Attendance/Schedule feed Payroll. Income/Expenses/Cash Flow/Payroll all feed the Monthly Closing Wizard, which is the only screen that locks other modules' data for a period. Roles & Permissions and Audit Log are configuration/oversight screens outside the daily operational flow.
