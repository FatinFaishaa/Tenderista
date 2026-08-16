import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getDailyRosterWithProfile, getLateCountToday, getPublishedRosterForWeek } from "@/lib/roster/queries";
import { getMyTodaysAttendance } from "@/lib/attendance/queries";
import { getClosingDutyForWeek, CLOSING_DUTY_WEEKDAY_INDICES } from "@/lib/roster/closingDuty";
import { getBranchLocalDateString, getBranchLocalDate } from "@/lib/utils/branchDate";
import { getWeekStart, getWeekDates, addDays, formatDateKey, parseDateKey } from "@/lib/utils/week";
import { Button } from "@/components/ui/Button";
import { ClockButton } from "@/components/attendance/ClockButton";
import { DailyRosterCards } from "@/components/roster/DailyRosterCards";
import { MySchedule } from "@/components/roster/MySchedule";
import { formatBranchTime } from "@/lib/utils/branchDate";
import { Avatar } from "@/components/staff/Avatar";
import { cn } from "@/lib/utils/cn";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatDateHeading(dateStr: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00.000Z`));
}

export default async function StaffSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ branchSlug: string }>;
  searchParams: Promise<{ view?: string; week?: string }>;
}) {
  const { branchSlug } = await params;
  const { view: viewParam, week: weekParam } = await searchParams;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  const view: "my" | "today" | "preview" =
    viewParam === "today" ? "today" : viewParam === "preview" ? "preview" : "my";
  const weekOffset = weekParam ? parseInt(weekParam, 10) || 0 : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {view === "my" ? "Jadual Saya" : view === "preview" ? "Preview Minggu" : "Roster Hari Ini"}
        </h1>
        <div className="flex gap-1.5">
          <Link href="?view=my">
            <Button
              variant={view === "my" ? "primary" : "secondary"}
              className="px-2 py-1 text-xs"
            >
              Jadual Saya
            </Button>
          </Link>
          <Link href="?view=today">
            <Button
              variant={view === "today" ? "primary" : "secondary"}
              className="px-2 py-1 text-xs"
            >
              Hari Ini
            </Button>
          </Link>
          <Link href="?view=preview">
            <Button
              variant={view === "preview" ? "primary" : "secondary"}
              className="px-2 py-1 text-xs"
            >
              Preview
            </Button>
          </Link>
        </div>
      </div>
      {view === "my" ? (
        <MySchedule
          branchId={branch.id}
          userId={session.userId}
          timezone={branch.timezone}
          branchSlug={branchSlug}
          weekOffset={weekOffset}
        />
      ) : view === "preview" ? (
        <WeeklyPreviewForStaff
          branchId={branch.id}
          userId={session.userId}
          timezone={branch.timezone}
          weekOffset={weekOffset}
        />
      ) : (
        <TodaysRoster
          branchId={branch.id}
          userId={session.userId}
          branchSlug={branchSlug}
          timezone={branch.timezone}
        />
      )}
    </div>
  );
}

async function TodaysRoster({
  branchId,
  userId,
  branchSlug,
  timezone,
}: {
  branchId: string;
  userId: string;
  branchSlug: string;
  timezone: string;
}) {
  const todayStr = getBranchLocalDateString(timezone);
  const today = parseDateKey(todayStr);

  const [rows, lateCount, myAttendance] = await Promise.all([
    getDailyRosterWithProfile(branchId, userId, today),
    getLateCountToday(branchId, userId, today),
    getMyTodaysAttendance(branchId, userId, timezone),
  ]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDateHeading(todayStr)}</p>

      {myAttendance.hasStaffRecord && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
              <Clock className="h-5 w-5 text-brand-maroon" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-maroon dark:text-red-400">
                Syif Saya Hari Ini
              </p>
              {myAttendance.scheduled && !myAttendance.scheduled.isOffDay ? (
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {myAttendance.scheduled.startTime} – {myAttendance.scheduled.endTime}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Tiada syif dijadualkan</p>
              )}
            </div>
          </div>
          <div className="mt-3">
            <ClockButton
              branchSlug={branchSlug}
              clockInTime={
                myAttendance.clockInAt ? formatBranchTime(myAttendance.clockInAt, timezone) : null
              }
              clockOutTime={
                myAttendance.clockOutAt ? formatBranchTime(myAttendance.clockOutAt, timezone) : null
              }
              status={myAttendance.status}
            />
          </div>
        </div>
      )}

      <DailyRosterCards rows={rows} lateCount={lateCount} />
    </div>
  );
}

/** Read-only "see everyone's week" view for staff — same grid shape as the Owner's
 * PreviewRoster, but staff-safe: only ever shows published rows (getPublishedRosterForWeek),
 * and shortens each name to first-name-only since staff can enter long full legal names. */
async function WeeklyPreviewForStaff({
  branchId,
  userId,
  timezone,
  weekOffset,
}: {
  branchId: string;
  userId: string;
  timezone: string;
  weekOffset: number;
}) {
  const currentWeekStart = getWeekStart(getBranchLocalDate(timezone));
  const weekStart = addDays(currentWeekStart, weekOffset * 7);
  const weekDates = getWeekDates(weekStart);

  const roster = await getPublishedRosterForWeek(branchId, userId, weekStart);
  const closingDuty = await getClosingDutyForWeek(branchId, userId, weekDates, roster);
  const staffNameById = new Map(roster.map((r) => [r.staffId, r.staffName.split(" ")[0]]));

  const prevHref = `?view=preview&week=${weekOffset - 1}`;
  const nextHref = `?view=preview&week=${weekOffset + 1}`;
  const startStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(weekDates[0]);
  const endStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(weekDates[6]);

  return (
    <div className="space-y-3">
      {/* Week navigator — same compact style as MySchedule's */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href={prevHref}
          className="flex items-center gap-0.5 text-xs font-medium text-brand-maroon dark:text-red-400"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </Link>
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50">
          {startStr} – {endStr}
        </span>
        <Link
          href={nextHref}
          className="flex items-center gap-0.5 text-xs font-medium text-brand-maroon dark:text-red-400"
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {roster.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Tiada staf aktif.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs text-zinc-500 dark:text-zinc-400">Staff</th>
                  {weekDates.map((d, i) => (
                    <th key={formatDateKey(d)} className="p-2 text-left text-xs text-zinc-500 dark:text-zinc-400">
                      {DAY_LABELS[i]}
                      <div className="text-[10px] font-normal text-zinc-400 dark:text-zinc-500">
                        {formatDateKey(d).slice(5)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roster.map((row) => {
                  const firstName = row.staffName.split(" ")[0];
                  return (
                    <tr key={row.staffId} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="whitespace-nowrap p-2">
                        <div className="flex items-center gap-2">
                          <Avatar avatarEmoji={row.avatarEmoji} avatarImage={row.avatarImage} size={28} />
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">{firstName}</span>
                        </div>
                      </td>
                      {weekDates.map((d) => {
                        const key = formatDateKey(d);
                        const cell = row.days[key];
                        const startHour = cell.startTime ? Number(cell.startTime.split(":")[0]) : null;
                        const isMorning = startHour !== null && startHour < 12;

                        let badgeClass =
                          "border-zinc-200 bg-zinc-50 text-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-700";
                        let label: React.ReactNode = <span>—</span>;

                        if (cell.isOnLeave) {
                          badgeClass =
                            "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300";
                          label = (
                            <span className="inline-flex items-center gap-1">
                              <Lock className="h-3 w-3" /> Cuti
                            </span>
                          );
                        } else if (cell.isOffDay) {
                          badgeClass =
                            "border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
                          label = "OFF";
                        } else if (cell.startTime && cell.endTime) {
                          badgeClass = isMorning
                            ? "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                            : "border-pink-200 bg-pink-100 text-pink-700 dark:border-pink-900 dark:bg-pink-950 dark:text-pink-300";
                          label = (
                            <>
                              {cell.startTime}–{cell.endTime}
                            </>
                          );
                        }

                        return (
                          <td key={key} className="p-1 align-top">
                            <div
                              className={cn(
                                "rounded-lg border px-2 py-1.5 text-center text-xs font-semibold",
                                badgeClass
                              )}
                            >
                              {label}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                  <td className="whitespace-nowrap p-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    🧹 Cuci Tandas
                  </td>
                  {weekDates.map((d, i) => {
                    const key = formatDateKey(d);
                    if (!CLOSING_DUTY_WEEKDAY_INDICES.includes(i)) {
                      return <td key={key} className="p-1 align-top" />;
                    }
                    const dutyStaffId = closingDuty[key];
                    const dutyName = dutyStaffId ? staffNameById.get(dutyStaffId) : null;
                    return (
                      <td key={key} className="p-1 text-center align-top">
                        {dutyName ? (
                          <span className="block rounded-lg border border-zinc-200 bg-zinc-50 px-1 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                            🧹 {dutyName}
                          </span>
                        ) : (
                          <span className="block text-xs text-zinc-300 dark:text-zinc-700">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-zinc-100 px-1 pt-3 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-amber-300 bg-amber-100 dark:border-amber-800 dark:bg-amber-950" />
            Morning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-pink-300 bg-pink-100 dark:border-pink-800 dark:bg-pink-950" />
            Evening
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800" />
            Off
          </span>
        </div>
      </div>
    </div>
  );
}
