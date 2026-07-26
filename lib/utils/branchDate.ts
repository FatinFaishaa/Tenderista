/**
 * "Today" in the branch's own timezone, not the server's. A branch in Asia/Kuala_Lumpur
 * (UTC+8) is already well into its next calendar day while UTC is still on the previous
 * one — a naive `new Date()` truncated to a date would show staff yesterday's checklist
 * for several hours every morning.
 */
export function getBranchLocalDateString(timezone: string): string {
  // en-CA formats as YYYY-MM-DD, which Postgres DATE columns accept directly.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getBranchLocalDate(timezone: string): Date {
  return new Date(`${getBranchLocalDateString(timezone)}T00:00:00.000Z`);
}

/** Wall-clock "HH:MM" for an instant, in the branch's own timezone — used to compare
 * a clock-in instant against a Schedule.startTime (a plain time-of-day, no timezone
 * of its own) without doing full timezone-aware datetime arithmetic. */
export function formatBranchTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function getBranchLocalTimeString(timezone: string): string {
  return formatBranchTime(new Date(), timezone);
}

/** Start (inclusive) and end (exclusive) Date bounds for the current calendar month,
 * in the branch's own timezone — used to sum attendance/earnings for "this month". */
export function getBranchLocalMonthRange(timezone: string): { start: Date; end: Date } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((p) => p.type === "year")!.value);
  const month = Number(parts.find((p) => p.type === "month")!.value);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}
