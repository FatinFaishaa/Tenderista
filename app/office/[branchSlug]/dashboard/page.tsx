import Link from "next/link";
import { redirect } from "next/navigation";
import {
  DollarSign,
  Wallet,
  UserCheck,
  Clock,
  UserX,
  Users,
  Calendar,
  ChevronRight,
  Bell,
  Megaphone,
  Package,
  FileText,
  BarChart3,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getMyProfile } from "@/lib/staff/queries";
import { listTodaysAttendance, type TodaysAttendanceRow } from "@/lib/attendance/queries";
import {
  getDailyFinancialRecordByDate,
  getWeeklySalesTrend,
} from "@/lib/financials/queries";
import { getLowStockItems } from "@/lib/inventory/queries";
import { getPendingLeaveSummaryForBranch } from "@/lib/leave/queries";
import { getBranchLocalDateString } from "@/lib/utils/branchDate";
import { formatMoney } from "@/lib/utils/money";
import { LEAVE_TYPE_LABELS } from "@/lib/validation/leave";
import { Avatar } from "@/components/staff/Avatar";
import { WeeklySalesChart } from "@/components/dashboard/WeeklySalesChart";

function summarizeAttendance(rows: TodaysAttendanceRow[]) {
  let present = 0;
  let late = 0;
  let absent = 0;
  for (const row of rows) {
    if (row.isOffDay) continue;
    if (row.clockInAt) {
      if (row.status === "late") late++;
      else present++;
    } else {
      absent++;
    }
  }
  return { present, late, absent, total: rows.length };
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const QUICK_ACTIONS = [
  { label: "Staff", icon: Users, href: "staff", bg: "bg-pink-100 dark:bg-pink-950", color: "text-brand-maroon" },
  { label: "Roster", icon: Calendar, href: "roster", bg: "bg-amber-100 dark:bg-amber-950", color: "text-amber-600 dark:text-amber-400" },
  { label: "Inventory", icon: Package, href: "inventory", bg: "bg-green-100 dark:bg-green-950", color: "text-green-600 dark:text-green-400" },
  { label: "Financials", icon: DollarSign, href: "financials", bg: "bg-blue-100 dark:bg-blue-950", color: "text-blue-600 dark:text-blue-400" },
  { label: "Reports", icon: BarChart3, href: "financials", bg: "bg-purple-100 dark:bg-purple-950", color: "text-purple-600 dark:text-purple-400" },
  { label: "Announcements", icon: Megaphone, href: "announcements", bg: "bg-orange-100 dark:bg-orange-950", color: "text-orange-600 dark:text-orange-400" },
] as const;

export default async function OwnerDashboardPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const userId = session.userId;

  const branch = await resolveBranchForUser(branchSlug, userId);
  if (!branch) redirect("/branches");

  const todayStr = getBranchLocalDateString(branch.timezone);
  const yesterdayStr = addDaysToDateStr(todayStr, -1);
  const today = new Date(`${todayStr}T00:00:00.000Z`);

  const [
    profile,
    attendanceRows,
    todayFinancial,
    yesterdayFinancial,
    weeklyTrend,
    lastWeekTrend,
    lowStockItems,
    pendingLeave,
  ] = await Promise.all([
    getMyProfile(branch.id, userId),
    listTodaysAttendance(branch.id, userId, branch.timezone, today),
    getDailyFinancialRecordByDate(branch.id, userId, todayStr),
    getDailyFinancialRecordByDate(branch.id, userId, yesterdayStr),
    getWeeklySalesTrend(branch.id, userId, todayStr),
    getWeeklySalesTrend(branch.id, userId, addDaysToDateStr(todayStr, -7)),
    getLowStockItems(branch.id, userId),
    getPendingLeaveSummaryForBranch(branch.id, userId),
  ]);

  const attendance = summarizeAttendance(attendanceRows);
  const todaySales = todayFinancial ? Number(todayFinancial.totalSales) : 0;
  const yesterdaySales = yesterdayFinancial ? Number(yesterdayFinancial.totalSales) : 0;
  const salesChangePct =
    yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : null;

  const cashInHand = todayFinancial ? Number(todayFinancial.actualCash) : 0;
  const expectedCash = todayFinancial ? Number(todayFinancial.expectedCash) : 0;

  const weekTotal = weeklyTrend.reduce((sum, d) => sum + d.sales, 0);
  const lastWeekTotal = lastWeekTrend.reduce((sum, d) => sum + d.sales, 0);
  const weekChangePct = lastWeekTotal > 0 ? ((weekTotal - lastWeekTotal) / lastWeekTotal) * 100 : null;

  const chartData = weeklyTrend.map((d) => ({ ...d, isToday: d.date === todayStr }));

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar avatarEmoji={profile.avatarEmoji} avatarImage={profile.avatarImage} size={56} />
          <div>
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Hi Boss 👋</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Owner Dashboard</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">📍 {branch.name}</p>
          </div>
        </div>
        {pendingLeave.count > 0 && (
          <Link
            href={`/office/${branchSlug}/staff/leave-requests`}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950"
            aria-label={`${pendingLeave.count} permohonan cuti tertunda`}
          >
            <Bell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pendingLeave.count}
            </span>
          </Link>
        )}
      </div>

      {/* Sales + Cash cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
              <DollarSign className="h-4 w-4 text-brand-maroon" />
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Today's Sales</p>
          </div>
          <p className="mt-2 text-xl font-bold text-brand-maroon dark:text-red-400">
            {formatMoney(todaySales)}
          </p>
          {salesChangePct !== null && (
            <p
              className={`mt-1 text-xs font-medium ${
                salesChangePct >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              vs Yesterday {salesChangePct >= 0 ? "▲" : "▼"} {Math.abs(salesChangePct).toFixed(1)}%
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
            </span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Cash In Hand</p>
          </div>
          <p className="mt-2 text-xl font-bold text-green-600 dark:text-green-400">
            {formatMoney(cashInHand)}
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Expected Cash {formatMoney(expectedCash)}
          </p>
        </div>
      </div>

      {/* Staff Attendance */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Staff Attendance</p>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Today</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </span>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {attendance.present}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Present</p>
          </div>
          <div>
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </span>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {attendance.late}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Late</p>
          </div>
          <div>
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
            </span>
            <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {attendance.absent}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Absent</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">Total Staff</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{attendance.total}</span>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Low Stock Alerts</p>
          <Link
            href={`/office/${branchSlug}/inventory`}
            className="flex items-center text-xs font-medium text-brand-maroon dark:text-red-400"
          >
            Lihat Semua <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Semua stok mencukupi 👍</p>
        ) : (
          <div className="space-y-2">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {item.name}
                </span>
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {item.currentQuantity} {item.unit ?? ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Leave Requests */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Pending Leave Requests</p>
          <Link
            href={`/office/${branchSlug}/staff/leave-requests`}
            className="flex items-center text-xs font-medium text-brand-maroon dark:text-red-400"
          >
            Lihat Semua <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {pendingLeave.count === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Tiada permohonan cuti tertunda</p>
        ) : (
          <div className="space-y-3">
            {pendingLeave.recent.map((request) => (
              <div key={request.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {request.staffName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {request.startDate === request.endDate
                      ? request.startDate
                      : `${request.startDate} → ${request.endDate}`}
                  </p>
                </div>
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                  {LEAVE_TYPE_LABELS[request.type]}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">Total Requests</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{pendingLeave.count}</span>
        </div>
      </div>

      {/* Weekly Sales Trend */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Weekly Sales Trend</p>
          <Link
            href={`/office/${branchSlug}/financials`}
            className="flex items-center text-xs font-medium text-brand-maroon dark:text-red-400"
          >
            Lihat Semua <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <WeeklySalesChart data={chartData} />
        <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">This Week Total</p>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              {formatMoney(weekTotal)}
            </p>
          </div>
          {weekChangePct !== null && (
            <div className="text-right">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">vs Last Week</p>
              <p
                className={`text-sm font-semibold ${
                  weekChangePct >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {weekChangePct >= 0 ? "▲" : "▼"} {Math.abs(weekChangePct).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <p className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">Quick Actions</p>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={`/office/${branchSlug}/${action.href}`}
                className="flex flex-col items-center gap-1.5"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-full ${action.bg}`}>
                  <Icon className={`h-5 w-5 ${action.color}`} />
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
