import type { StaffRole } from "@prisma/client";
import { withTenantContext } from "@/lib/db";
import { dateToTimeString, timeStringToDate } from "@/lib/utils/timeOfDay";
import { getWeekDates, formatDateKey } from "@/lib/utils/week";

export class RosterError extends Error {}

export type RosterCell = {
  isOffDay: boolean;
  shiftId: string | null;
  startTime: string | null;
  endTime: string | null;
  isPublished: boolean;
};

export type RosterStaffRow = {
  staffId: string;
  staffName: string;
  days: Record<string, RosterCell>;
};

const EMPTY_CELL: RosterCell = {
  isOffDay: false,
  shiftId: null,
  startTime: null,
  endTime: null,
  isPublished: false,
};

/** The Owner's weekly grid — active staff × 7 days. Days with no Schedule row yet
 * come back as an empty (unassigned) cell rather than being omitted, so the grid
 * always has exactly 7 columns per staff row. */
export async function getRosterForWeek(
  branchId: string,
  userId: string,
  weekStart: Date
): Promise<RosterStaffRow[]> {
  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];

  return withTenantContext({ userId, branchId }, async (tx) => {
    const [staffList, scheduleRows] = await Promise.all([
      tx.staff.findMany({
        where: { branchId, status: "active" },
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      tx.schedule.findMany({
        where: { branchId, date: { gte: weekStart, lte: weekEnd } },
      }),
    ]);

    const byKey = new Map(
      scheduleRows.map((row) => [`${row.staffId}_${formatDateKey(row.date)}`, row])
    );

    return staffList.map((staff) => {
      const days: Record<string, RosterCell> = {};
      for (const d of weekDates) {
        const key = formatDateKey(d);
        const row = byKey.get(`${staff.id}_${key}`);
        days[key] = row
          ? {
              isOffDay: row.isOffDay,
              shiftId: row.shiftId,
              startTime: row.startTime ? dateToTimeString(row.startTime) : null,
              endTime: row.endTime ? dateToTimeString(row.endTime) : null,
              isPublished: row.isPublished,
            }
          : { ...EMPTY_CELL };
      }
      return { staffId: staff.id, staffName: staff.user.name, days };
    });
  });
}

/** Creates or updates a single staff+date assignment. Any edit resets isPublished to
 * false for that day — "published" means "matches what was last published," so an
 * edited-but-not-republished cell must not silently appear published to staff. */
export async function assignScheduleCell(
  branchId: string,
  userId: string,
  input: {
    staffId: string;
    date: Date;
    isOffDay: boolean;
    shiftId?: string | null;
    startTime?: string | null;
    endTime?: string | null;
  }
): Promise<void> {
  await withTenantContext({ userId, branchId }, async (tx) => {
    const staff = await tx.staff.findFirst({ where: { id: input.staffId, branchId } });
    if (!staff) throw new RosterError("Staff member not found.");

    const data = input.isOffDay
      ? {
          isOffDay: true,
          shiftId: null,
          startTime: null,
          endTime: null,
          isPublished: false,
          publishedAt: null,
          publishedBy: null,
        }
      : {
          isOffDay: false,
          shiftId: input.shiftId || null,
          startTime: timeStringToDate(input.startTime!),
          endTime: timeStringToDate(input.endTime!),
          isPublished: false,
          publishedAt: null,
          publishedBy: null,
        };

    await tx.schedule.upsert({
      where: { staffId_date: { staffId: input.staffId, date: input.date } },
      update: data,
      create: { branchId, staffId: input.staffId, date: input.date, ...data },
    });
  });
}

/** All-or-nothing per branch, per your instruction — one action publishes every
 * Schedule row for the week in one go. */
export async function publishWeek(
  branchId: string,
  userId: string,
  weekStart: Date
): Promise<{ count: number }> {
  const weekEnd = getWeekDates(weekStart)[6];

  return withTenantContext({ userId, branchId }, async (tx) => {
    const result = await tx.schedule.updateMany({
      where: { branchId, date: { gte: weekStart, lte: weekEnd } },
      data: { isPublished: true, publishedAt: new Date(), publishedBy: userId },
    });
    return { count: result.count };
  });
}

export type DailyRosterStatus = "working" | "off" | "unscheduled";

export type DailyRosterRow = {
  staffId: string;
  staffName: string;
  role: StaffRole;
  status: DailyRosterStatus;
  startTime: string | null;
  endTime: string | null;
};

const DAILY_ROSTER_STATUS_ORDER: Record<DailyRosterStatus, number> = {
  working: 0,
  off: 1,
  unscheduled: 2,
};

/** Read-only Daily Roster (V1) — reshapes the same published Schedule rows the
 * weekly grid writes, for every active staff member on a single date. Not a
 * separate table: "unscheduled" is a staff member with no Schedule row for this
 * date at all (never assigned, or assigned but not yet published — the two are
 * indistinguishable here by design, same as getMyPublishedScheduleForWeek), distinct
 * from an explicit "off" row. Sorted working-by-start-time, then off, then
 * unscheduled, ties broken by name. */
export async function getDailyRoster(
  branchId: string,
  userId: string,
  date: Date
): Promise<DailyRosterRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const [staffList, scheduleRows] = await Promise.all([
      tx.staff.findMany({
        where: { branchId, status: "active" },
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      tx.schedule.findMany({
        where: { branchId, date, isPublished: true },
      }),
    ]);

    const byStaffId = new Map(scheduleRows.map((row) => [row.staffId, row]));

    const rows: DailyRosterRow[] = staffList.map((staff) => {
      const row = byStaffId.get(staff.id);
      if (!row) {
        return {
          staffId: staff.id,
          staffName: staff.user.name,
          role: staff.role,
          status: "unscheduled",
          startTime: null,
          endTime: null,
        };
      }
      if (row.isOffDay) {
        return {
          staffId: staff.id,
          staffName: staff.user.name,
          role: staff.role,
          status: "off",
          startTime: null,
          endTime: null,
        };
      }
      return {
        staffId: staff.id,
        staffName: staff.user.name,
        role: staff.role,
        status: "working",
        startTime: row.startTime ? dateToTimeString(row.startTime) : null,
        endTime: row.endTime ? dateToTimeString(row.endTime) : null,
      };
    });

    return rows.sort((a, b) => {
      const orderDiff = DAILY_ROSTER_STATUS_ORDER[a.status] - DAILY_ROSTER_STATUS_ORDER[b.status];
      if (orderDiff !== 0) return orderDiff;
      if (a.status === "working" && b.status === "working") {
        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      }
      return a.staffName.localeCompare(b.staffName);
    });
  });
}

export type TodaysScheduleSummary = {
  workingCount: number;
  offCount: number;
  unscheduledCount: number;
  totalActiveStaff: number;
};

/** Dashboard-shaped — just the counts for a single date, not the full weekly grid.
 * "Unscheduled" means an active staff member with no Schedule row at all for the date,
 * distinct from an explicit off day. */
export async function getTodaysScheduleSummary(
  branchId: string,
  userId: string,
  date: Date
): Promise<TodaysScheduleSummary> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const [totalActiveStaff, scheduleRows] = await Promise.all([
      tx.staff.count({ where: { branchId, status: "active" } }),
      tx.schedule.findMany({ where: { branchId, date }, select: { isOffDay: true } }),
    ]);

    const offCount = scheduleRows.filter((row) => row.isOffDay).length;
    const workingCount = scheduleRows.length - offCount;
    const unscheduledCount = totalActiveStaff - scheduleRows.length;

    return { workingCount, offCount, unscheduledCount, totalActiveStaff };
  });
}

export type MyScheduleDay = {
  date: string;
  status: "working" | "off" | "unpublished";
  shiftName: string | null;
  startTime: string | null;
  endTime: string | null;
};

/** Staff-facing — published rows only. A day with no published row (never assigned,
 * or assigned but not yet published) reads as "unpublished", indistinguishable to
 * staff from "not scheduled yet" — by design, they only ever see the published state. */
export async function getMyPublishedScheduleForWeek(
  branchId: string,
  userId: string,
  weekStart: Date
): Promise<MyScheduleDay[]> {
  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];

  return withTenantContext({ userId, branchId }, async (tx) => {
    const staff = await tx.staff.findUnique({
      where: { branchId_userId: { branchId, userId } },
    });

    if (!staff) {
      return weekDates.map((d) => ({
        date: formatDateKey(d),
        status: "unpublished" as const,
        shiftName: null,
        startTime: null,
        endTime: null,
      }));
    }

    const rows = await tx.schedule.findMany({
      where: {
        branchId,
        staffId: staff.id,
        date: { gte: weekStart, lte: weekEnd },
        isPublished: true,
      },
      include: { shift: { select: { name: true } } },
    });

    const byDate = new Map(rows.map((r) => [formatDateKey(r.date), r]));

    return weekDates.map((d) => {
      const key = formatDateKey(d);
      const row = byDate.get(key);
      if (!row) {
        return { date: key, status: "unpublished" as const, shiftName: null, startTime: null, endTime: null };
      }
      if (row.isOffDay) {
        return { date: key, status: "off" as const, shiftName: null, startTime: null, endTime: null };
      }
      return {
        date: key,
        status: "working" as const,
        shiftName: row.shift?.name ?? null,
        startTime: row.startTime ? dateToTimeString(row.startTime) : null,
        endTime: row.endTime ? dateToTimeString(row.endTime) : null,
      };
    });
  });
}
