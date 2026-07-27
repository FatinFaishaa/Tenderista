import { withTenantContext } from "@/lib/db";
import { getBranchLocalDate } from "@/lib/utils/branchDate";
import { DAILY_TASK_DEPARTMENTS, type DailyTaskDepartmentValue } from "@/lib/validation/checklist";

// Daily Task V1 — mirrors lib/checklists/queries.ts's shape (flat item list + daily
// completion) but deliberately not shared with it: assigned by branch only, narrowed
// by department (with an "all" option that matches every staff member regardless of
// their own department).

export class DailyTaskNotFoundError extends Error {}

export type DailyTaskRow = {
  id: string;
  title: string;
  sortOrder: number;
  isPriority: boolean;
  department: DailyTaskDepartmentValue;
};

/** For the Owner/Manager management page — every task, in sortOrder. */
export async function listDailyTasks(branchId: string, userId: string): Promise<DailyTaskRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const tasks = await tx.dailyTask.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
    });
    return tasks.map((t) => ({ id: t.id, title: t.title, sortOrder: t.sortOrder, isPriority: t.isPriority, department: t.department }));
  });
}

export async function getDailyTaskById(
  branchId: string,
  userId: string,
  id: string
): Promise<DailyTaskRow | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const task = await tx.dailyTask.findFirst({ where: { id, branchId } });
    if (!task) return null;
    return { id: task.id, title: task.title, sortOrder: task.sortOrder, isPriority: task.isPriority, department: task.department };
  });
}

export type TodaysDailyTask = DailyTaskRow & {
  isCompleted: boolean;
  completedByName: string | null;
  completedAt: Date | null;
};

/**
 * For the staff daily view and the Owner/Manager progress view — one query covers
 * both, since the only difference is who's looking, not what they see.
 *
 * `date` defaults to today (in the branch's own timezone) when omitted.
 * `restrictToDepartment` narrows to tasks tagged "all" or matching the given
 * department; omit it for Owner/Manager call sites (no restriction — they see
 * every task).
 */
export async function getTodaysDailyTasks(
  branchId: string,
  userId: string,
  timezone: string,
  date?: Date,
  restrictToDepartment?: DailyTaskDepartmentValue
): Promise<TodaysDailyTask[]> {
  const targetDate = date ?? getBranchLocalDate(timezone);

  return withTenantContext({ userId, branchId }, async (tx) => {
    const tasks = await tx.dailyTask.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
      include: {
        completions: {
          where: { date: targetDate },
          include: { completer: { select: { name: true } } },
        },
      },
    });

    const filtered = restrictToDepartment
      ? tasks.filter(
          (t) => t.department === "all" || t.department === restrictToDepartment
        )
      : tasks;

    return filtered.map((task) => {
      const completion = task.completions[0] ?? null;
      return {
        id: task.id,
        title: task.title,
        sortOrder: task.sortOrder,
        isPriority: task.isPriority,
        department: task.department,
        isCompleted: Boolean(completion),
        completedByName: completion?.completer.name ?? null,
        completedAt: completion?.completedAt ?? null,
      };
    });
  });
}

/** Toggles today's completion for a task — auto-save, no separate submit step. Any
 * branch member (Owner, Manager, or Staff) may toggle any task; no restriction. */
export async function toggleTodaysCompletion(
  branchId: string,
  userId: string,
  taskId: string,
  timezone: string
): Promise<{ isCompleted: boolean }> {
  const today = getBranchLocalDate(timezone);

  return withTenantContext({ userId, branchId }, async (tx) => {
    const task = await tx.dailyTask.findFirst({ where: { id: taskId, branchId } });
    if (!task) throw new DailyTaskNotFoundError("Task not found.");

    const existing = await tx.dailyTaskCompletion.findUnique({
      where: { taskId_date: { taskId, date: today } },
    });

    if (existing) {
      await tx.dailyTaskCompletion.delete({ where: { id: existing.id } });
      return { isCompleted: false };
    }

    await tx.dailyTaskCompletion.create({
      data: { branchId, taskId, date: today, completedBy: userId },
    });
    return { isCompleted: true };
  });
}

export type DailyTaskDepartmentGroup = {
  department: DailyTaskDepartmentValue;
  items: DailyTaskRow[];
};

/** Same rows as listDailyTasks, reshaped into one group per department (fixed
 * order: all, kitchen, front, front_kitchen) — used by the Owner/Manager management
 * page's folder view. Empty departments are still included (empty items array) so
 * the folder always shows, with a 0 count, rather than disappearing. */
export async function listDailyTasksGroupedByDepartment(
  branchId: string,
  userId: string
): Promise<DailyTaskDepartmentGroup[]> {
  const rows = await listDailyTasks(branchId, userId);
  return DAILY_TASK_DEPARTMENTS.map((department) => ({
    department,
    items: rows.filter((r) => r.department === department),
  }));
}

/** Owner/Manager only: creates a task, appended to the end of the branch's list. */
export async function createDailyTask(
  branchId: string,
  userId: string,
  input: { title: string; isPriority?: boolean; department?: DailyTaskDepartmentValue }
): Promise<{ id: string }> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const last = await tx.dailyTask.findFirst({
      where: { branchId },
      orderBy: { sortOrder: "desc" },
    });

    const task = await tx.dailyTask.create({
      data: {
        branchId,
        title: input.title,
        isPriority: input.isPriority ?? false,
        department: input.department ?? "all",
        sortOrder: (last?.sortOrder ?? -1) + 1,
        createdBy: userId,
      },
    });
    return { id: task.id };
  });
}

/** Owner/Manager only: title only — sortOrder is managed via moveDailyTask. */
export async function updateDailyTask(
  branchId: string,
  userId: string,
  id: string,
  input: { title: string; isPriority?: boolean; department?: DailyTaskDepartmentValue }
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.dailyTask.updateMany({
      where: { id, branchId },
      data: {
        title: input.title,
        isPriority: input.isPriority ?? false,
        department: input.department ?? "all",
      },
    })
  );
  if (result.count === 0) throw new DailyTaskNotFoundError("Task not found.");
}

/** Owner/Manager only: hard delete, matching the Opening/Closing Checklist
 * precedent — tasks have no downstream references that need preserving. */
export async function deleteDailyTask(
  branchId: string,
  userId: string,
  id: string
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.dailyTask.deleteMany({ where: { id, branchId } })
  );
  if (result.count === 0) throw new DailyTaskNotFoundError("Task not found.");
}

/** Swaps sort order with the adjacent task — the whole "reorder" UI is just
 * up/down buttons, no drag-and-drop library needed. */
export async function moveDailyTask(
  branchId: string,
  userId: string,
  id: string,
  direction: "up" | "down"
): Promise<void> {
  await withTenantContext({ userId, branchId }, async (tx) => {
    const task = await tx.dailyTask.findFirst({ where: { id, branchId } });
    if (!task) throw new DailyTaskNotFoundError("Task not found.");

    const siblings = await tx.dailyTask.findMany({
      where: { branchId, department: task.department },
      orderBy: { sortOrder: "asc" },
    });

    const index = siblings.findIndex((s) => s.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return; // already at an edge

    // Already inside withTenantContext's transaction, so these two updates are
    // atomic together without a nested $transaction (not supported on tx clients).
    const neighbor = siblings[swapIndex];
    await tx.dailyTask.update({ where: { id: task.id }, data: { sortOrder: neighbor.sortOrder } });
    await tx.dailyTask.update({ where: { id: neighbor.id }, data: { sortOrder: task.sortOrder } });
  });
}
