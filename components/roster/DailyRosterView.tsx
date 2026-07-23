import { getBranchLocalDateString, getBranchLocalTimeString } from "@/lib/utils/branchDate";
import type { DailyRosterRow } from "@/lib/roster/queries";

const START_HOUR = 10;
const END_HOUR = 23;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

const ROLE_LABELS: Record<DailyRosterRow["role"], string> = {
  manager: "Manager",
  staff: "Staff",
};

function timeToOffsetMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m - START_HOUR * 60;
}

/** Pure position/size math for a shift bar, kept separate from rendering so a future
 * V2 drag/resize editor can reuse this same math (and the ShiftBar markup below)
 * without rewriting how DailyRosterView lays out rows. Unchanged from V1. */
function getBarStyle(startTime: string, endTime: string): { left: string; width: string } {
  const start = Math.min(Math.max(timeToOffsetMinutes(startTime), 0), TOTAL_MINUTES);
  const end = Math.min(Math.max(timeToOffsetMinutes(endTime), 0), TOTAL_MINUTES);
  const width = Math.max(end - start, 15);
  return {
    left: `${(start / TOTAL_MINUTES) * 100}%`,
    width: `${(width / TOTAL_MINUTES) * 100}%`,
  };
}

/** "14:30" -> "2:30 PM". */
function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

/** 14 -> "2 PM", 10 -> "10 AM". */
function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour} ${period}`;
}

/** "2026-07-23" -> "Thursday, 23 July 2026". Same UTC-carrier technique as
 * DashboardDateNav — the date key parses to a UTC-midnight Date representing just a
 * calendar day, so formatting must stay pinned to UTC or it can roll a day off. */
function formatDateHeading(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Minutes-from-START_HOUR for "now", or null if the indicator shouldn't render:
 * the selected date isn't today, now falls outside the visible 10:00–23:00 range, or
 * the branch timezone can't be resolved. The last case is reported (not guessed) —
 * an invalid/empty timezone means we genuinely don't know the branch-local time, so
 * silently defaulting to server time or a fixed offset would be actively misleading. */
function getNowOffsetMinutes(date: string, timezone: string): number | null {
  if (!timezone) {
    console.warn("DailyRosterView: skipping the Now indicator — no branch timezone was provided.");
    return null;
  }

  let todayStr: string;
  let nowTimeStr: string;
  try {
    todayStr = getBranchLocalDateString(timezone);
    nowTimeStr = getBranchLocalTimeString(timezone);
  } catch (err) {
    console.warn(
      `DailyRosterView: skipping the Now indicator — could not resolve branch-local time for timezone "${timezone}".`,
      err
    );
    return null;
  }

  if (date !== todayStr) return null;

  const offset = timeToOffsetMinutes(nowTimeStr);
  if (offset < 0 || offset > TOTAL_MINUTES) return null;
  return offset;
}

function NowLine({ leftPercent }: { leftPercent: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-red-500/70 dark:bg-red-400/70"
      style={{ left: `${leftPercent}%` }}
    />
  );
}

function ShiftBar({ startTime, endTime }: { startTime: string; endTime: string }) {
  const style = getBarStyle(startTime, endTime);
  return (
    <div
      className="absolute top-1/2 flex h-5 -translate-y-1/2 items-center rounded-md bg-blue-600 px-2 text-xs whitespace-nowrap text-white dark:bg-blue-500"
      style={style}
      title={`${formatTime12h(startTime)} – ${formatTime12h(endTime)}`}
    >
      {formatTime12h(startTime)} – {formatTime12h(endTime)}
    </div>
  );
}

/** Read-only "who's working today" timeline — no editing, dragging, or resizing.
 * Takes already-fetched rows as a prop rather than fetching itself, so it can be
 * dropped into both the office Roster page and the staff Schedule page unchanged. */
export function DailyRosterView({
  rows,
  date,
  timezone,
}: {
  rows: DailyRosterRow[];
  date: string;
  timezone: string;
}) {
  const nowOffset = getNowOffsetMinutes(date, timezone);
  const nowLeftPercent = nowOffset !== null ? (nowOffset / TOTAL_MINUTES) * 100 : null;

  const workingCount = rows.filter((r) => r.status === "working").length;
  const offCount = rows.filter((r) => r.status === "off").length;
  const unscheduledCount = rows.filter((r) => r.status === "unscheduled").length;

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {formatDateHeading(date)}
      </h2>

      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex pt-3 pb-1 pl-36">
            <div className="relative h-4 flex-1 border-b border-zinc-200 dark:border-zinc-800">
              {HOURS.map((hour) => (
                <span
                  key={hour}
                  className="absolute top-0 text-xs text-zinc-400 dark:text-zinc-500"
                  style={{ left: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}
                >
                  {formatHourLabel(hour)}
                </span>
              ))}
              {nowLeftPercent !== null && (
                <span
                  className="absolute -top-3 -translate-x-1/2 text-[10px] font-semibold text-red-500 dark:text-red-400"
                  style={{ left: `${nowLeftPercent}%` }}
                >
                  Now
                </span>
              )}
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">No active staff yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row) => (
                <div key={row.staffId} className="flex items-center py-2">
                  <div className="w-36 shrink-0 truncate pr-2">
                    <div className="text-sm font-medium text-zinc-900 capitalize dark:text-zinc-50">
                      {row.staffName}
                    </div>
                    <div className="text-xs text-zinc-400 dark:text-zinc-500">
                      {ROLE_LABELS[row.role]}
                    </div>
                  </div>
                  <div className="relative h-8 flex-1 rounded-md border border-zinc-100 dark:border-zinc-800">
                    {nowLeftPercent !== null && <NowLine leftPercent={nowLeftPercent} />}
                    {row.status === "working" && row.startTime && row.endTime ? (
                      <ShiftBar startTime={row.startTime} endTime={row.endTime} />
                    ) : (
                      <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs font-medium text-zinc-400 dark:text-zinc-600">
                        {row.status === "off" ? "OFF" : "Not scheduled"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-300">
        <span>
          Working:{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{workingCount}</span>
        </span>
        <span>
          Off: <span className="font-semibold text-zinc-900 dark:text-zinc-50">{offCount}</span>
        </span>
        <span>
          Not scheduled:{" "}
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{unscheduledCount}</span>
        </span>
      </div>
    </div>
  );
}
