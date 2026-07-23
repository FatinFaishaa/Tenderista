import { withTenantContext } from "@/lib/db";
import { getBranchLocalDate } from "@/lib/utils/branchDate";
import {
  CHECKLIST_DEPARTMENTS,
  DEPARTMENT_LABELS,
  type ChecklistDepartmentValue,
} from "@/lib/validation/checklist";

// Mirrors lib/checklists/queries.ts (Opening Checklist) exactly, against the separate
// ClosingChecklistItem/Completion tables — kept as its own file rather than a shared,
// parameterized module so neither feature's code path touches the other's.

export class ClosingChecklistItemNotFoundError extends Error {}
export class ClosingChecklistDepartmentMismatchError extends Error {}

export type ClosingChecklistItemRow = {
  id: string;
  title: string;
  department: (typeof CHECKLIST_DEPARTMENTS)[number];
  sortOrder: number;
};

export type ClosingChecklistDepartmentGroup<T> = {
  department: (typeof CHECKLIST_DEPARTMENTS)[number];
  label: string;
  items: T[];
};

/** For the back-office management page — every item, in the fixed department order,
 * sorted by sortOrder within each department. */
export async function listClosingItemsGroupedByDepartment(
  branchId: string,
  userId: string
): Promise<ClosingChecklistDepartmentGroup<ClosingChecklistItemRow>[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const items = await tx.closingChecklistItem.findMany({
      where: { branchId },
      orderBy: [{ department: "asc" }, { sortOrder: "asc" }],
    });

    return CHECKLIST_DEPARTMENTS.map((department) => ({
      department,
      label: DEPARTMENT_LABELS[department],
      items: items
        .filter((item) => item.department === department)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          id: item.id,
          title: item.title,
          department: item.department,
          sortOrder: item.sortOrder,
        })),
    }));
  });
}

export async function getClosingChecklistItemById(
  branchId: string,
  userId: string,
  id: string
): Promise<ClosingChecklistItemRow | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const item = await tx.closingChecklistItem.findFirst({ where: { id, branchId } });
    if (!item) return null;
    return {
      id: item.id,
      title: item.title,
      department: item.department,
      sortOrder: item.sortOrder,
    };
  });
}

export type TodaysClosingChecklistItem = ClosingChecklistItemRow & {
  isCompleted: boolean;
  completedByName: string | null;
  completedAt: Date | null;
};

/**
 * For the staff daily view, the Owner's progress summary, and the Owner-only history
 * page — one query covers all three, since "history" is just this same query for a
 * date other than today. No duplicate history-specific query needed.
 *
 * `restrictToDepartment` is left `undefined` for Owner/Manager call sites (no
 * filtering — they see every department, unchanged). Staff call sites pass their
 * own department, or `null` if they have none set — `null` intentionally matches
 * nothing (every item's department is a non-null enum value), so a staff member
 * with no department assigned sees an empty list rather than everything.
 *
 * `date` defaults to today (in the branch's own timezone) when omitted — pass an
 * explicit date to look up a past day's completions instead.
 */
export async function getTodaysClosingChecklist(
  branchId: string,
  userId: string,
  timezone: string,
  restrictToDepartment?: ChecklistDepartmentValue | null,
  date?: Date
): Promise<ClosingChecklistDepartmentGroup<TodaysClosingChecklistItem>[]> {
  // "department" is a non-nullable column, so `null` can't be expressed as a Prisma
  // filter value — short-circuit instead of querying, since we already know the
  // answer is "no items" for a staff member with no department assigned.
  if (restrictToDepartment === null) {
    return CHECKLIST_DEPARTMENTS.map((department) => ({
      department,
      label: DEPARTMENT_LABELS[department],
      items: [],
    }));
  }

  const targetDate = date ?? getBranchLocalDate(timezone);

  return withTenantContext({ userId, branchId }, async (tx) => {
    const items = await tx.closingChecklistItem.findMany({
      where: {
        branchId,
        ...(restrictToDepartment !== undefined && { department: restrictToDepartment }),
      },
      orderBy: [{ department: "asc" }, { sortOrder: "asc" }],
      include: {
        completions: {
          where: { date: targetDate },
          include: { completer: { select: { name: true } } },
        },
      },
    });

    return CHECKLIST_DEPARTMENTS.map((department) => ({
      department,
      label: DEPARTMENT_LABELS[department],
      items: items
        .filter((item) => item.department === department)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => {
          const completion = item.completions[0] ?? null;
          return {
            id: item.id,
            title: item.title,
            department: item.department,
            sortOrder: item.sortOrder,
            isCompleted: Boolean(completion),
            completedByName: completion?.completer.name ?? null,
            completedAt: completion?.completedAt ?? null,
          };
        }),
    }));
  });
}

export type ClosingDepartmentProgress = {
  department: (typeof CHECKLIST_DEPARTMENTS)[number];
  label: string;
  total: number;
  completed: number;
};

/** `date` defaults to today (in the branch's own timezone) when omitted — pass an
 * explicit date for a past day's progress instead (e.g. the Owner Dashboard's date
 * navigator). */
export async function getClosingProgressByDepartment(
  branchId: string,
  userId: string,
  timezone: string,
  date?: Date
): Promise<ClosingDepartmentProgress[]> {
  const groups = await getTodaysClosingChecklist(branchId, userId, timezone, undefined, date);
  return groups.map((group) => ({
    department: group.department,
    label: group.label,
    total: group.items.length,
    completed: group.items.filter((item) => item.isCompleted).length,
  }));
}

/**
 * Toggles today's completion for an item — auto-save, no separate submit step.
 *
 * `restrictToDepartment` mirrors getTodaysClosingChecklist's semantics: `undefined`
 * for Owner/Manager (no restriction), a specific department for a staff member (can
 * only toggle items in that department), or `null` for a staff member with no
 * department assigned (can't toggle anything).
 */
export async function toggleTodaysClosingCompletion(
  branchId: string,
  userId: string,
  itemId: string,
  timezone: string,
  restrictToDepartment?: ChecklistDepartmentValue | null
): Promise<{ isCompleted: boolean }> {
  const today = getBranchLocalDate(timezone);

  return withTenantContext({ userId, branchId }, async (tx) => {
    const item = await tx.closingChecklistItem.findFirst({ where: { id: itemId, branchId } });
    if (!item) throw new ClosingChecklistItemNotFoundError("Checklist item not found.");

    if (restrictToDepartment !== undefined && item.department !== restrictToDepartment) {
      throw new ClosingChecklistDepartmentMismatchError(
        "This checklist item isn't in your department."
      );
    }

    const existing = await tx.closingChecklistCompletion.findUnique({
      where: { itemId_date: { itemId, date: today } },
    });

    if (existing) {
      await tx.closingChecklistCompletion.delete({ where: { id: existing.id } });
      return { isCompleted: false };
    }

    await tx.closingChecklistCompletion.create({
      data: { branchId, itemId, date: today, completedBy: userId },
    });
    return { isCompleted: true };
  });
}

/** Swaps sort order with the adjacent item in the same department — the whole
 * "reorder" UI is just up/down buttons, no drag-and-drop library needed. */
export async function moveClosingChecklistItem(
  branchId: string,
  userId: string,
  itemId: string,
  direction: "up" | "down"
): Promise<void> {
  await withTenantContext({ userId, branchId }, async (tx) => {
    const item = await tx.closingChecklistItem.findFirst({ where: { id: itemId, branchId } });
    if (!item) throw new Error("Checklist item not found.");

    const siblings = await tx.closingChecklistItem.findMany({
      where: { branchId, department: item.department },
      orderBy: { sortOrder: "asc" },
    });

    const index = siblings.findIndex((s) => s.id === itemId);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= siblings.length) return; // already at an edge

    // Already inside withTenantContext's transaction, so these two updates are
    // atomic together without a nested $transaction (not supported on tx clients).
    const neighbor = siblings[swapIndex];
    await tx.closingChecklistItem.update({
      where: { id: item.id },
      data: { sortOrder: neighbor.sortOrder },
    });
    await tx.closingChecklistItem.update({
      where: { id: neighbor.id },
      data: { sortOrder: item.sortOrder },
    });
  });
}
