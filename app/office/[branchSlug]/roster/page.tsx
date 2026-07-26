import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getRosterForWeek, getDailyRosterWithProfile, getLateCountToday } from "@/lib/roster/queries";
import { listShifts } from "@/lib/shifts/queries";
import { getBranchLocalDate, getBranchLocalDateString } from "@/lib/utils/branchDate";
import { getWeekStart, getWeekDates, addDays, formatDateKey, parseDateKey } from "@/lib/utils/week";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RosterCellEditor } from "@/components/roster/RosterCellEditor";
import { PublishWeekButton } from "@/components/roster/PublishWeekButton";
import { DailyRosterCards } from "@/components/roster/DailyRosterCards";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/staff/Avatar";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default async function RosterPage({
  params,
  searchParams,
}: {
  params: Promise<{ branchSlug: string }>;
  searchParams: Promise<{ week?: string; date?: string; view?: string }>;
}) {
  const { branchSlug } = await params;
  const { week, date, view: viewParam } = await searchParams;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  // Weekly editing is Owner-only; Manager may only view the read-only Daily Roster.
  if (branch.role !== "owner" && branch.role !== "manager") {
    redirect(`/office/${branchSlug}/dashboard`);
  }
  const isOwner = branch.role === "owner";
  const view: "weekly" | "daily" = isOwner && viewParam !== "daily" ? "weekly" : "daily";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {view === "weekly" ? "Weekly Roster" : "Daily Roster"}
          </h1>
          {isOwner && (
            <Link
              href={`/office/${branchSlug}/shifts`}
              className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Manage shift templates →
            </Link>
          )}
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Link href="?view=weekly">
              <Button
                variant={view === "weekly" ? "primary" : "secondary"}
                className="px-3 py-1.5 text-sm"
              >
                Weekly
              </Button>
            </Link>
            <Link href="?view=daily">
              <Button
                variant={view === "daily" ? "primary" : "secondary"}
                className="px-3 py-1.5 text-sm"
              >
                Daily
              </Button>
            </Link>
          </div>
        )}
      </div>

      {view === "weekly" ? (
        <WeeklyRoster branchSlug={branchSlug} userId={session.userId} branch={branch} week={week} />
      ) : (
        <DailyRoster userId={session.userId} branch={branch} date={date} />
      )}
    </div>
  );
}

async function WeeklyRoster({
  branchSlug,
  userId,
  branch,
  week,
}: {
  branchSlug: string;
  userId: string;
  branch: { id: string; timezone: string };
  week?: string;
}) {
  const weekStart = week ? parseDateKey(week) : getWeekStart(getBranchLocalDate(branch.timezone));
  const weekDates = getWeekDates(weekStart);
  const weekStartKey = formatDateKey(weekStart);

  const [roster, shifts] = await Promise.all([
    getRosterForWeek(branch.id, userId, weekStart),
    listShifts(branch.id, userId),
  ]);

  const anyAssigned = roster.some((row) =>
    weekDates.some((d) => {
      const cell = row.days[formatDateKey(d)];
      return cell.isOffDay || cell.startTime;
    })
  );
  const fullyPublished =
    anyAssigned &&
    roster.every((row) =>
      weekDates.every((d) => {
        const cell = row.days[formatDateKey(d)];
        return (!cell.isOffDay && !cell.startTime) || cell.isPublished;
      })
    );

  return (
    <div>
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={`?view=weekly&week=${formatDateKey(addDays(weekStart, -7))}`}>
            <Button variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
          </Link>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <CalendarDays className="h-4 w-4 text-brand-maroon" />
            {formatDateKey(weekStart)} – {formatDateKey(weekDates[6])}
          </span>
          <Link href={`?view=weekly&week=${formatDateKey(addDays(weekStart, 7))}`}>
            <Button variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Badge tone={fullyPublished ? "success" : "warning"}>
            {fullyPublished ? "Published" : "Not Published"}
          </Badge>
          <PublishWeekButton branchSlug={branchSlug} weekStart={weekStartKey} />
        </div>
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No active staff yet — add staff first.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left text-zinc-500 dark:text-zinc-400">Staff</th>
                {weekDates.map((d, i) => (
                  <th
                    key={formatDateKey(d)}
                    className="p-2 text-left text-zinc-500 dark:text-zinc-400"
                  >
                    {DAY_LABELS[i]}
                    <br />
                    <span className="font-normal">{formatDateKey(d).slice(5)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roster.map((row) => (
                <tr key={row.staffId}>
                  <td className="whitespace-nowrap p-2">
                    <div className="flex items-center gap-2">
                      <Avatar avatarEmoji={row.avatarEmoji} avatarImage={row.avatarImage} size={32} />
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{row.staffName}</span>
                    </div>
                  </td>
                  {weekDates.map((d) => {
                    const key = formatDateKey(d);
                    return (
                      <td key={key} className="min-w-28 p-1 align-top">
                        <RosterCellEditor
                          branchSlug={branchSlug}
                          staffId={row.staffId}
                          date={key}
                          cell={row.days[key]}
                          shifts={shifts}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap items-center gap-4 px-1 text-xs text-zinc-600 dark:text-zinc-300">
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
      )}
    </div>
  );
}

async function DailyRoster({
  userId,
  branch,
  date,
}: {
  userId: string;
  branch: { id: string; timezone: string };
  date?: string;
}) {
  const todayStr = getBranchLocalDateString(branch.timezone);
  const dateStr = date ?? todayStr;
  const selectedDate = parseDateKey(dateStr);

  const [rows, lateCount] = await Promise.all([
    getDailyRosterWithProfile(branch.id, userId, selectedDate),
    getLateCountToday(branch.id, userId, selectedDate),
  ]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href={`?view=daily&date=${formatDateKey(addDays(selectedDate, -1))}`}
          className="flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${dateStr}T00:00:00.000Z`))}
        </span>
        <Link
          href={`?view=daily&date=${formatDateKey(addDays(selectedDate, 1))}`}
          className="flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <DailyRosterCards rows={rows} lateCount={lateCount} />
    </div>
  );
}
