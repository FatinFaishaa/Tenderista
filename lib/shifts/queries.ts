import { withTenantContext } from "@/lib/db";
import { dateToTimeString } from "@/lib/utils/timeOfDay";

export type ShiftRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
};

/** Templates only — the roster's actual per-assignment times live on Schedule, not
 * here. Deleting a shift used by past schedules is safe: the FK is ON DELETE SET
 * NULL, since Schedule.shiftId is just a reference, not the source of truth. */
export async function listShifts(branchId: string, userId: string): Promise<ShiftRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const shifts = await tx.shift.findMany({
      where: { branchId },
      orderBy: { startTime: "asc" },
    });
    return shifts.map((s) => ({
      id: s.id,
      name: s.name,
      startTime: dateToTimeString(s.startTime),
      endTime: dateToTimeString(s.endTime),
    }));
  });
}

export async function getShiftById(
  branchId: string,
  userId: string,
  id: string
): Promise<ShiftRow | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const s = await tx.shift.findFirst({ where: { id, branchId } });
    if (!s) return null;
    return {
      id: s.id,
      name: s.name,
      startTime: dateToTimeString(s.startTime),
      endTime: dateToTimeString(s.endTime),
    };
  });
}
