/** Prisma maps `@db.Time` columns to Date objects using the epoch date (1970-01-01) as
 * a carrier for just the time-of-day portion. These convert between that and the plain
 * "HH:MM" strings used by <input type="time"> and API payloads. */
export function timeStringToDate(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

export function dateToTimeString(date: Date): string {
  return date.toISOString().slice(11, 16);
}
