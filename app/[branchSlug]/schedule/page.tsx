import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getDailyRosterWithProfile, getLateCountToday } from "@/lib/roster/queries";
import { getMyTodaysAttendance } from "@/lib/attendance/queries";
import { getBranchLocalDateString } from "@/lib/utils/branchDate";
import { parseDateKey } from "@/lib/utils/week";
import { Button } from "@/components/ui/Button";
import { ClockButton } from "@/components/attendance/ClockButton";
import { DailyRosterCards } from "@/components/roster/DailyRosterCards";
import { MySchedule } from "@/components/roster/MySchedule";
import { formatBranchTime } from "@/lib/utils/branchDate";

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
  const view: "my" | "today" = viewParam === "today" ? "today" : "my";
  const weekOffset = weekParam ? parseInt(weekParam, 10) || 0 : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {view === "my" ? "Jadual Saya" : "Roster Hari Ini"}
        </h1>
        <div className="flex gap-2">
          <Link href="?view=my">
            <Button
              variant={view === "my" ? "primary" : "secondary"}
              className="px-3 py-1.5 text-sm"
            >
              Jadual Saya
            </Button>
          </Link>
          <Link href="?view=today">
            <Button
              variant={view === "today" ? "primary" : "secondary"}
              className="px-3 py-1.5 text-sm"
            >
              Hari Ini
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
