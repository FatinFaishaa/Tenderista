import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getTodaysScheduleSummary } from "@/lib/roster/queries";
import { getProgressByDepartment } from "@/lib/checklists/queries";
import { getClosingProgressByDepartment } from "@/lib/closingChecklists/queries";
import { getLowStockCount } from "@/lib/inventory/queries";
import { listTodaysAttendance, type TodaysAttendanceRow } from "@/lib/attendance/queries";
import { getDailyFinancialRecordByDate, getMonthlyFinancialSummary } from "@/lib/financials/queries";
import { getDailyClosingByDate } from "@/lib/closing/queries";
import { getPendingLeaveSummaryForBranch } from "@/lib/leave/queries";
import { getBranchLocalDateString } from "@/lib/utils/branchDate";
import { parseDateKey } from "@/lib/utils/week";
import { formatMoney, moneySignClass } from "@/lib/utils/money";
import { LEAVE_TYPE_LABELS } from "@/lib/validation/leave";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DashboardDateNav } from "@/components/dashboard/DashboardDateNav";

const SECTION_HEADING = "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

function sumProgress(groups: { total: number; completed: number }[]) {
  return groups.reduce(
    (acc, g) => ({ total: acc.total + g.total, completed: acc.completed + g.completed }),
    { total: 0, completed: 0 }
  );
}

function summarizeAttendance(rows: TodaysAttendanceRow[]) {
  let clockedIn = 0;
  let late = 0;
  let notYetClockedIn = 0;
  for (const row of rows) {
    if (row.isOffDay) continue;
    if (row.clockInAt) {
      clockedIn++;
      if (row.status === "late") late++;
    } else {
      notYetClockedIn++;
    }
  }
  return { clockedIn, late, notYetClockedIn };
}

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ branchSlug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { branchSlug } = await params;
  const { date: dateParam } = await searchParams;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const todayStr = getBranchLocalDateString(branch.timezone);
  const selectedDateStr = dateParam ?? todayStr;
  const selectedDate = parseDateKey(selectedDateStr);
  const isToday = selectedDateStr === todayStr;

  const [
    schedule,
    openingGroups,
    closingGroups,
    lowStockCount,
    attendanceRows,
    financialRecord,
    monthlySummary,
    closingStatus,
    pendingLeave,
  ] = await Promise.all([
    getTodaysScheduleSummary(branch.id, session.userId, selectedDate),
    getProgressByDepartment(branch.id, session.userId, branch.timezone, selectedDate),
    getClosingProgressByDepartment(branch.id, session.userId, branch.timezone, selectedDate),
    getLowStockCount(branch.id, session.userId),
    listTodaysAttendance(branch.id, session.userId, branch.timezone, selectedDate),
    getDailyFinancialRecordByDate(branch.id, session.userId, selectedDateStr),
    getMonthlyFinancialSummary(branch.id, session.userId, selectedDateStr),
    getDailyClosingByDate(branch.id, session.userId, selectedDateStr),
    getPendingLeaveSummaryForBranch(branch.id, session.userId),
  ]);

  const opening = sumProgress(openingGroups);
  const closing = sumProgress(closingGroups);
  const attendance = summarizeAttendance(attendanceRows);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">/{branchSlug}</p>
        </div>
        <DashboardDateNav selectedDate={selectedDateStr} isToday={isToday} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardTitle>Schedule</CardTitle>
          <CardValue>
            {schedule.workingCount} working · {schedule.offCount} off
          </CardValue>
          {schedule.unscheduledCount > 0 && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {schedule.unscheduledCount} not yet scheduled
            </p>
          )}
        </Card>

        <Card>
          <CardTitle>Opening checklist</CardTitle>
          <CardValue>
            {opening.completed}/{opening.total}
          </CardValue>
        </Card>

        <Card>
          <CardTitle>Closing checklist</CardTitle>
          <CardValue>
            {closing.completed}/{closing.total}
          </CardValue>
        </Card>

        <Card>
          <CardTitle>Low stock items</CardTitle>
          <CardValue className={lowStockCount > 0 ? "text-amber-600 dark:text-amber-400" : undefined}>
            {lowStockCount}
          </CardValue>
        </Card>

        <Card>
          <CardTitle>Attendance</CardTitle>
          <CardValue>
            {attendance.clockedIn} clocked in · {attendance.late} late
          </CardValue>
          {attendance.notYetClockedIn > 0 && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {attendance.notYetClockedIn} not yet clocked in
            </p>
          )}
        </Card>

        <Card>
          <CardTitle>Sales</CardTitle>
          <CardValue>
            {financialRecord ? formatMoney(financialRecord.totalSales) : "—"}
          </CardValue>
        </Card>

        <Card>
          <CardTitle>Expenses</CardTitle>
          <CardValue>
            {financialRecord ? formatMoney(financialRecord.totalExpenses) : "—"}
          </CardValue>
        </Card>

        <Card>
          <CardTitle>Net</CardTitle>
          <CardValue
            className={
              financialRecord ? moneySignClass(financialRecord.netCashFlow) : undefined
            }
          >
            {financialRecord ? formatMoney(financialRecord.netCashFlow) : "—"}
          </CardValue>
        </Card>

        <Card>
          <CardTitle>Cash Difference</CardTitle>
          <CardValue
            className={
              financialRecord ? moneySignClass(financialRecord.cashDifference) : undefined
            }
          >
            {financialRecord ? formatMoney(financialRecord.cashDifference) : "—"}
          </CardValue>
        </Card>

        <Card>
          <CardTitle>Day Status</CardTitle>
          <CardValue
            className={
              closingStatus.isClosed
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            }
          >
            {closingStatus.isClosed ? "Closed" : "Open"}
          </CardValue>
          {closingStatus.isClosed && closingStatus.closedByName && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              by {closingStatus.closedByName}
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Leave Requests</CardTitle>
            {pendingLeave.count > 0 && <Badge tone="danger">{pendingLeave.count}</Badge>}
          </div>
          {pendingLeave.count === 0 ? (
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-600">
              No pending leave requests
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {pendingLeave.recent.map((request) => (
                <div key={request.id}>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {request.staffName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {LEAVE_TYPE_LABELS[request.type]} ·{" "}
                    {request.startDate === request.endDate
                      ? request.startDate
                      : `${request.startDate} → ${request.endDate}`}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Link
            href={`/office/${branchSlug}/staff/leave-requests`}
            className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View All
          </Link>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className={`${SECTION_HEADING} mb-3`}>This Month</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardTitle>Sales This Month</CardTitle>
            <CardValue>{formatMoney(monthlySummary.totalSales)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Expenses This Month</CardTitle>
            <CardValue>{formatMoney(monthlySummary.totalExpenses)}</CardValue>
          </Card>
          <Card>
            <CardTitle>Net This Month</CardTitle>
            <CardValue className={moneySignClass(monthlySummary.net)}>
              {formatMoney(monthlySummary.net)}
            </CardValue>
          </Card>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Coming soon: payroll and monthly closing status.
      </div>
    </div>
  );
}
