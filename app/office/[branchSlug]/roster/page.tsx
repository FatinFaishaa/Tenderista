import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getRosterForWeek, getDailyRosterWithProfile, getLateCountToday } from "@/lib/roster/queries";
import { getClosingDutyForWeek, getEligibleClosingStaff, CLOSING_DUTY_WEEKDAY_INDICES } from "@/lib/roster/closingDuty";
import { ClosingDutyCell } from "@/components/roster/ClosingDutyCell";
import { listShifts } from "@/lib/shifts/queries";
import { getBranchLocalDate, getBranchLocalDateString } from "@/lib/utils/branchDate";
import { getWeekStart, getWeekDates, addDays, formatDateKey, parseDateKey } from "@/lib/utils/week";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { RosterCellEditor } from "@/components/roster/RosterCellEditor";
import { PublishWeekButton } from "@/components/roster/PublishWeekButton";
import { DailyRosterCards } from "@/components/roster/DailyRosterCards";
import { ChevronLeft, ChevronRight, CalendarDays, Lock } from "lucide-react";
import { Avatar } from "@/components/staff/Avatar";
import { cn } from "@/lib/utils/cn";

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
  const view: "weekly" | "daily" | "preview" = !isOwner
    ? "daily"
    : viewParam === "daily"
    ? "daily"
    : viewParam === "preview"
    ? "preview"
    : "weekly";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {view === "weekly" ? "Weekly Roster" : view === "preview" ? "Preview Week" : "Daily Roster"}
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
            <Link href="?view=preview">
              <Button
                variant={view === "preview" ? "primary" : "secondary"}
                className="px-3 py-1.5 text-sm"
              >
                Preview
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
      ) : view === "preview" ? (
        <PreviewRoster branchSlug={branchSlug} userId={session.userId} branch={branch} week={week} />
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
      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <Link href={`?view=weekly&week=${formatDateKey(addDays(weekStart, -7))}`}>
            <Button variant="secondary" className="flex items-center gap-1 px-2.5 py-1 text-xs">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
          </Link>
          <span className="flex items-center gap-1 text-xs font-semibold text-zinc-900 dark:text-zinc-50">
            <CalendarDays className="h-3.5 w-3.5 text-brand-maroon" />
            {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(weekStart)} – {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(weekDates[6])}
          </span>
          <Link href={`?view=weekly&week=${formatDateKey(addDays(weekStart, 7))}`}>
            <Button variant="secondary" className="flex items-center gap-1 px-2.5 py-1 text-xs">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
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
        <div className="space-y-3">
          {roster.map((row) => (
            <div
              key={row.staffId}
              className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-center gap-2">
                <Avatar avatarEmoji={row.avatarEmoji} avatarImage={row.avatarImage} size={36} />
                <span className="font-semibold break-words text-zinc-900 dark:text-zinc-50">
                  {row.staffName.split(" ")[0]}
                </span>
              </div>
              <div className="space-y-1.5">
                {weekDates.map((d, i) => {
                  const key = formatDateKey(d);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="w-14 shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        {DAY_LABELS[i]}
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {key.slice(5)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <RosterCellEditor
                          branchSlug={branchSlug}
                          staffId={row.staffId}
                          date={key}
                          cell={row.days[key]}
                          shifts={shifts}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-zinc-600 dark:text-zinc-300">
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

/** Read-only "how staff will see it" preview of a published (or draft) week — a single
 * bordered card with a compact grid, no click targets at all. Deliberately reuses the
 * same table/grid shape the Owner's old editable Weekly view used, since a horizontal
 * table is fine for pure viewing; the click-target problems that forced Weekly Roster
 * onto per-staff cards don't apply here because nothing in this view is interactive. */
async function PreviewRoster({
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

  const roster = await getRosterForWeek(branch.id, userId, weekStart);
  const closingDuty = await getClosingDutyForWeek(branch.id, userId, weekDates, roster);
  const staffNameById = new Map(roster.map((r) => [r.staffId, r.staffName.split(" ")[0]]));

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Begini staff akan nampak jadual yang telah publish.
      </p>

      {roster.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No active staff yet.</p>
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
              {roster.map((row) => (
                <tr key={row.staffId} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="whitespace-nowrap p-2">
                    <div className="flex items-center gap-2">
                      <Avatar avatarEmoji={row.avatarEmoji} avatarImage={row.avatarImage} size={28} />
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">{row.staffName.split(" ")[0]}</span>
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
              ))}
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
                  const eligible = getEligibleClosingStaff(roster, key);
                  const options = eligible.map((staffId) => ({
                    staffId,
                    firstName: staffNameById.get(staffId) ?? "?",
                  }));
                  return (
                    <td key={key} className="p-1 align-top">
                      <ClosingDutyCell
                        branchSlug={branchSlug}
                        dateKey={key}
                        currentStaffId={closingDuty[key] ?? null}
                        options={options}
                      />
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
  );
}
