import { withTenantContext } from "@/lib/db";
import { dateToTimeString } from "@/lib/utils/timeOfDay";
import { getBranchLocalDate, getBranchLocalTimeString } from "@/lib/utils/branchDate";

// V1: self clock in/out only, compared against the existing Schedule roster. No
// breaks, no leave integration, no manual correction, no overtime/payroll split —
// workedHours is just the raw clock-in-to-clock-out span; overtimeHours stays 0.

export class AttendanceError extends Error {}
export class NotStaffMemberError extends AttendanceError {}
export class AlreadyClockedInError extends AttendanceError {}
export class AlreadyClockedOutError extends AttendanceError {}
export class NotClockedInError extends AttendanceError {}

type ScheduledShift = { isOffDay: boolean; startTime: string | null; endTime: string | null };

export type MyTodaysAttendance =
  | { hasStaffRecord: false }
  | {
      hasStaffRecord: true;
      scheduled: ScheduledShift | null;
      clockInAt: Date | null;
      clockOutAt: Date | null;
      status: "present" | "late" | "absent" | "on_leave" | null;
    };

/** The caller's own schedule + attendance for today — drives the staff-facing clock
 * in/out screen. `hasStaffRecord: false` covers Owner-only accounts (Owners are
 * tracked via branch_owners, not staff — see lib/tenancy/branch.ts). */
export async function getMyTodaysAttendance(
  branchId: string,
  userId: string,
  timezone: string
): Promise<MyTodaysAttendance> {
  const date = getBranchLocalDate(timezone);

  return withTenantContext({ userId, branchId }, async (tx) => {
    const staff = await tx.staff.findUnique({ where: { branchId_userId: { branchId, userId } } });
    if (!staff) return { hasStaffRecord: false };

    const [schedule, attendance] = await Promise.all([
      tx.schedule.findUnique({ where: { staffId_date: { staffId: staff.id, date } } }),
      tx.attendanceRecord.findUnique({ where: { staffId_date: { staffId: staff.id, date } } }),
    ]);

    return {
      hasStaffRecord: true,
      scheduled: schedule
        ? {
            isOffDay: schedule.isOffDay,
            startTime: schedule.startTime ? dateToTimeString(schedule.startTime) : null,
            endTime: schedule.endTime ? dateToTimeString(schedule.endTime) : null,
          }
        : null,
      clockInAt: attendance?.clockInAt ?? null,
      clockOutAt: attendance?.clockOutAt ?? null,
      status: attendance?.status ?? null,
    };
  });
}

/** Clocks the caller in for today. Status is "late" if a published-or-not schedule
 * exists for today, isn't an off day, and the current branch-local wall clock is
 * past its startTime — otherwise "present". Clocking in with no schedule at all (or
 * on an off day) is allowed and recorded as "present"; V1 doesn't block it. */
export async function clockIn(branchId: string, userId: string, timezone: string): Promise<void> {
  const date = getBranchLocalDate(timezone);

  await withTenantContext({ userId, branchId }, async (tx) => {
    const staff = await tx.staff.findUnique({ where: { branchId_userId: { branchId, userId } } });
    if (!staff) throw new NotStaffMemberError("You're not a staff member of this branch.");

    const [existing, schedule] = await Promise.all([
      tx.attendanceRecord.findUnique({ where: { staffId_date: { staffId: staff.id, date } } }),
      tx.schedule.findUnique({ where: { staffId_date: { staffId: staff.id, date } } }),
    ]);
    if (existing?.clockInAt) throw new AlreadyClockedInError("You've already clocked in today.");

    const isLate =
      Boolean(schedule) &&
      !schedule!.isOffDay &&
      Boolean(schedule!.startTime) &&
      getBranchLocalTimeString(timezone) > dateToTimeString(schedule!.startTime!);

    const data = {
      branchId,
      staffId: staff.id,
      scheduleId: schedule?.id ?? null,
      date,
      clockInAt: new Date(),
      status: isLate ? ("late" as const) : ("present" as const),
    };

    await tx.attendanceRecord.upsert({
      where: { staffId_date: { staffId: staff.id, date } },
      create: data,
      update: data,
    });
  });
}

/** Clocks the caller out for today and records the elapsed hours. */
export async function clockOut(branchId: string, userId: string, timezone: string): Promise<void> {
  const date = getBranchLocalDate(timezone);

  await withTenantContext({ userId, branchId }, async (tx) => {
    const staff = await tx.staff.findUnique({ where: { branchId_userId: { branchId, userId } } });
    if (!staff) throw new NotStaffMemberError("You're not a staff member of this branch.");

    const existing = await tx.attendanceRecord.findUnique({
      where: { staffId_date: { staffId: staff.id, date } },
    });
    if (!existing?.clockInAt) throw new NotClockedInError("Clock in first.");
    if (existing.clockOutAt) throw new AlreadyClockedOutError("You've already clocked out today.");

    const clockOutAt = new Date();
    const workedHours = Math.round(
      ((clockOutAt.getTime() - existing.clockInAt.getTime()) / 3_600_000) * 100
    ) / 100;

    await tx.attendanceRecord.update({
      where: { id: existing.id },
      data: { clockOutAt, workedHours },
    });
  });
}

export type TodaysAttendanceRow = {
  staffId: string;
  staffName: string;
  isOffDay: boolean;
  scheduledStartTime: string | null;
  scheduledEndTime: string | null;
  clockInAt: Date | null;
  clockOutAt: Date | null;
  status: "present" | "late" | "absent" | "on_leave" | null;
};

/** Owner dashboard/table view — every active staff member, the date's Schedule (if
 * any) next to the date's AttendanceRecord (if any). Also the source data for the
 * Owner Dashboard's attendance summary card (summed by the caller).
 *
 * `date` defaults to today (in the branch's own timezone) when omitted — pass an
 * explicit date to look up a past day's attendance instead. */
export async function listTodaysAttendance(
  branchId: string,
  userId: string,
  timezone: string,
  date?: Date
): Promise<TodaysAttendanceRow[]> {
  const targetDate = date ?? getBranchLocalDate(timezone);

  return withTenantContext({ userId, branchId }, async (tx) => {
    const [staffList, scheduleRows, attendanceRows] = await Promise.all([
      tx.staff.findMany({
        where: { branchId, status: "active" },
        include: { user: { select: { name: true } } },
        orderBy: { user: { name: "asc" } },
      }),
      tx.schedule.findMany({ where: { branchId, date: targetDate } }),
      tx.attendanceRecord.findMany({ where: { branchId, date: targetDate } }),
    ]);

    const scheduleByStaff = new Map(
  scheduleRows.map((s: typeof scheduleRows[number]) => [s.staffId, s])
);

const attendanceByStaff = new Map(
  attendanceRows.map((a: typeof attendanceRows[number]) => [a.staffId, a])
);

     return staffList.map((staff: typeof staffList[number]) => {
      const schedule = scheduleByStaff.get(staff.id);
      const attendance = attendanceByStaff.get(staff.id);
      return {
        staffId: staff.id,
        staffName: staff.user.name,
        isOffDay: schedule?.isOffDay ?? false,
        scheduledStartTime: schedule?.startTime ? dateToTimeString(schedule.startTime) : null,
        scheduledEndTime: schedule?.endTime ? dateToTimeString(schedule.endTime) : null,
        clockInAt: attendance?.clockInAt ?? null,
        clockOutAt: attendance?.clockOutAt ?? null,
        status: attendance?.status ?? null,
      };
    });
  });
}
