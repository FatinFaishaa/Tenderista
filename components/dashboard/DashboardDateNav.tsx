"use client";

import { useRouter, usePathname } from "next/navigation";
import { addDays, formatDateKey, parseDateKey } from "@/lib/utils/week";

function formatDisplayDate(dateKey: string): string {
  // timeZone: "UTC" is required here — dateKey parses to a UTC-midnight Date that
  // merely represents a calendar day (see lib/utils/week.ts), not a real instant in
  // the branch's timezone. Formatting it in any other zone could roll it back or
  // forward a day.
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDateKey(dateKey));
}

function formatWeekday(dateKey: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(
    parseDateKey(dateKey)
  );
}

/** Dashboard-wide date navigator — every daily card on the page reflects this one
 * selected date. Reuses the same "input[type=date] navigates to ?date=" mechanism as
 * DatePickerNav (components/ui/DatePickerNav.tsx), just with prev/next arrows and a
 * formatted, clickable date label stacked on top of the native input instead of
 * showing the input's own (locale-dependent) display. */
export function DashboardDateNav({
  selectedDate,
  isToday,
}: {
  selectedDate: string;
  isToday: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function go(date: string) {
    router.push(`${pathname}?date=${date}`);
  }

  const prevDate = formatDateKey(addDays(parseDateKey(selectedDate), -1));
  const nextDate = formatDateKey(addDays(parseDateKey(selectedDate), 1));

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(prevDate)}
          aria-label="Previous day"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ‹
        </button>

        <div className="relative">
          <span className="pointer-events-none block px-1 text-lg font-semibold whitespace-nowrap text-zinc-900 dark:text-zinc-50">
            {formatDisplayDate(selectedDate)}
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && go(e.target.value)}
            aria-label="Pick a date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>

        <button
          type="button"
          onClick={() => go(nextDate)}
          disabled={isToday}
          aria-label="Next day"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          ›
        </button>
      </div>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{formatWeekday(selectedDate)}</span>
    </div>
  );
}
