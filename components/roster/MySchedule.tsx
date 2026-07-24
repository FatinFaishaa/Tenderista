import Link from "next/link";
import { ChevronLeft, ChevronRight, Briefcase, Coffee, Clock, Leaf } from "lucide-react";
import { getMyPublishedScheduleForWeek } from "@/lib/roster/queries";
import { getBranchLocalDate } from "@/lib/utils/branchDate";
import { getWeekStart, addDays, formatDateKey, parseDateKey } from "@/lib/utils/week";

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatWeekRange(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(weekStart);
  const endStr = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(weekEnd);
  return `${startStr} – ${endStr}`;
}

function calculateHours(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let minutes = eh * 60 + em - (sh * 60 + sm);
  if (minutes < 0) minutes += 24 * 60;
  return Math.round((minutes / 60) * 10) / 10;
}

export async function MySchedule({
  branchId,
  userId,
  timezone,
  branchSlug,
  weekOffset,
}: {
  branchId: string;
  userId: string;
  timezone: string;
  branchSlug: string;
  weekOffset: number;
}) {
  const currentWeekStart = getWeekStart(getBranchLocalDate(timezone));
  const weekStart = addDays(currentWeekStart, weekOffset * 7);
  const days = await getMyPublishedScheduleForWeek(branchId, userId, weekStart);
  const todayStr = formatDateKey(getBranchLocalDate(timezone));

  const workingDays = days.filter((d) => d.status === "working");
  const offDays = days.filter((d) => d.status === "off");
  const unpublishedDays = days.filter((d) => d.status === "unpublished");
  const totalHours = workingDays.reduce((sum, d) => {
    if (!d.startTime || !d.endTime) return sum;
    return sum + calculateHours(d.startTime, d.endTime);
  }, 0);

  const prevHref = `?view=my&week=${weekOffset - 1}`;
  const nextHref = `?view=my&week=${weekOffset + 1}`;

  return (
    <div className="space-y-4">
      {/* Week navigator */}
      <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Link
          href={prevHref}
          className="flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
        >
          <ChevronLeft className="h-4 w-4" /> Minggu Lepas
        </Link>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {formatWeekRange(weekStart)}
        </span>
        <Link
          href={nextHref}
          className="flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
        >
          Minggu Depan <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Summary 3 boxes */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <Briefcase className="h-4 w-4 text-green-600 dark:text-green-400" />
          </span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {workingDays.length}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Hari Bekerja</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{totalHours} jam</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Coffee className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {offDays.length}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Off Day</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{offDays.length} hari</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {unpublishedDays.length}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Tiada Jadual</p>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{unpublishedDays.length} hari</p>
        </div>
      </div>

      {/* Day list */}
      <div className="space-y-2">
        {days.map((day, i) => {
          const isToday = day.date === todayStr;
          const hours =
            day.status === "working" && day.startTime && day.endTime
              ? calculateHours(day.startTime, day.endTime)
              : null;

          return (
            <div
              key={day.date}
              className={`rounded-2xl border bg-white p-3.5 shadow-sm dark:bg-zinc-900 ${
                isToday
                  ? "border-brand-maroon bg-brand-cream/40 dark:border-red-800"
                  : "border-zinc-200 dark:border-zinc-800"
              } ${day.status === "working" ? "border-l-4 border-l-green-500" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {DAY_LABELS[i]}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {day.date.slice(5).replace("-", "-")}
                  </p>
                </div>
                {isToday && (
                  <span className="rounded-full bg-brand-maroon px-2.5 py-1 text-xs font-medium text-white">
                    Hari Ini
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div>
                  {day.status === "working" && (
                    <>
                      <span className="mb-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                        Bekerja
                      </span>
                      <p className="flex items-center gap-1 text-sm font-bold text-brand-maroon dark:text-red-400">
                        <Clock className="h-3.5 w-3.5" />
                        {day.startTime}–{day.endTime}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {hours} jam{day.jobPosition ? ` • ${day.jobPosition}` : ""}
                      </p>
                    </>
                  )}
                  {day.status === "off" && (
                    <>
                      <span className="mb-1 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        Off Day
                      </span>
                      <p className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <Leaf className="h-3.5 w-3.5" /> Hari rehat
                      </p>
                    </>
                  )}
                  {day.status === "unpublished" && (
                    <>
                      <span className="mb-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                        Tiada jadual lagi
                      </span>
                      <p className="flex items-center gap-1 text-sm text-zinc-400 dark:text-zinc-500">
                        <Clock className="h-3.5 w-3.5" /> Belum dijadualkan
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
