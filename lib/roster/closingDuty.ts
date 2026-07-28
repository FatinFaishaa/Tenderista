import { withTenantContext } from "@/lib/db";
import type { RosterStaffRow } from "@/lib/roster/queries";
import { formatDateKey } from "@/lib/utils/week";

export type ClosingDutyMap = Record<string, string | null>;

/** Staff working an evening/closing shift (start hour >= 12) on the given date,
 * sorted by staffId for a stable rotation order. */
export function getEligibleClosingStaff(roster: RosterStaffRow[], dateKey: string): string[] {
  return roster
    .filter((row) => {
      const cell = row.days[dateKey];
      if (!cell || cell.isOffDay || !cell.startTime) return false;
      const startHour = Number(cell.startTime.split(":")[0]);
      return startHour >= 12;
    })
    .map((row) => row.staffId)
    .sort();
}

/** For each day in the week, picks who's on closing/toilet-cleaning duty: the Owner's
 * explicit override for that date if one exists, otherwise an automatic day-of rotation
 * among that day's closing-shift staff — nobody is picked on a day with no closing-shift
 * staff at all. Rotation is a stable, storage-free function of the date and that day's
 * eligible staff list, so it naturally shifts as the roster itself changes without
 * needing to be recomputed/stored anywhere. */
export async function getClosingDutyForWeek(
  branchId: string,
  userId: string,
  weekDates: Date[],
  roster: RosterStaffRow[]
): Promise<ClosingDutyMap> {
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  const overrides = await withTenantContext({ userId, branchId }, (tx) =>
    tx.closingDutyOverride.findMany({
      where: { branchId, date: { gte: weekStart, lte: weekEnd } },
    })
  );
  const overrideByDate = new Map(overrides.map((o) => [formatDateKey(o.date), o.staffId]));

  const result: ClosingDutyMap = {};
  for (const d of weekDates) {
    const key = formatDateKey(d);
    if (overrideByDate.has(key)) {
      result[key] = overrideByDate.get(key)!;
      continue;
    }
    const eligible = getEligibleClosingStaff(roster, key);
    if (eligible.length === 0) {
      result[key] = null;
      continue;
    }
    const dayIndex = Math.floor(d.getTime() / 86_400_000);
    result[key] = eligible[dayIndex % eligible.length];
  }
  return result;
}

/** Owner-only: sets/overrides who's on closing duty for one specific date. */
export async function setClosingDutyOverride(
  branchId: string,
  userId: string,
  date: string,
  staffId: string
): Promise<void> {
  const dateValue = new Date(`${date}T00:00:00.000Z`);
  await withTenantContext({ userId, branchId }, (tx) =>
    tx.closingDutyOverride.upsert({
      where: { branchId_date: { branchId, date: dateValue } },
      create: { branchId, date: dateValue, staffId, assignedBy: userId },
      update: { staffId, assignedBy: userId },
    })
  );
}
