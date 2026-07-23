import { withTenantContext } from "@/lib/db";

export class StockItemNotFoundError extends Error {}
export class StockItemNameConflictError extends Error {}

export type StockItemRow = {
  id: string;
  name: string;
  unit: string | null;
  currentQuantity: number;
  minAlertLevel: number;
  isActive: boolean;
  isLow: boolean;
};

function toRow(item: {
  id: string;
  name: string;
  unit: string | null;
  currentQuantity: unknown;
  minAlertLevel: unknown;
  isActive: boolean;
}): StockItemRow {
  const currentQuantity = Number(item.currentQuantity);
  const minAlertLevel = Number(item.minAlertLevel);
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    currentQuantity,
    minAlertLevel,
    isActive: item.isActive,
    // Computed at read time, not stored — mirrors checklist_instances' "overdue".
    isLow: currentQuantity <= minAlertLevel,
  };
}

/** Owner management view — every item, active and inactive alike. */
export async function listStockItems(branchId: string, userId: string): Promise<StockItemRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const items = await tx.stockItem.findMany({
      where: { branchId },
      orderBy: { name: "asc" },
    });
    return items.map(toRow);
  });
}

/** Branch-member quantity-update view — active items only. */
export async function listActiveStockItems(
  branchId: string,
  userId: string
): Promise<StockItemRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const items = await tx.stockItem.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
    });
    return items.map(toRow);
  });
}

export async function getStockItemById(
  branchId: string,
  userId: string,
  id: string
): Promise<StockItemRow | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const item = await tx.stockItem.findFirst({ where: { id, branchId } });
    return item ? toRow(item) : null;
  });
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/** Owner-only: defines the item, its starting on-hand count, and its alert
 * threshold. currentQuantity is set once here; from this point on it's exclusively
 * updated through updateStockQuantity (any branch member) — updateStockItem below
 * never touches it. */
export async function createStockItem(
  branchId: string,
  userId: string,
  input: { name: string; unit?: string; minAlertLevel: number; currentQuantity: number }
): Promise<{ id: string }> {
  try {
    const item = await withTenantContext({ userId, branchId }, (tx) =>
      tx.stockItem.create({
        data: {
          branchId,
          name: input.name,
          unit: input.unit ?? null,
          minAlertLevel: input.minAlertLevel,
          currentQuantity: input.currentQuantity,
          createdBy: userId,
        },
      })
    );
    return { id: item.id };
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new StockItemNameConflictError("A stock item with this name already exists.");
    }
    throw err;
  }
}

/** Owner-only: name/unit/minAlertLevel — never touches currentQuantity. */
export async function updateStockItem(
  branchId: string,
  userId: string,
  id: string,
  input: { name: string; unit?: string; minAlertLevel: number }
): Promise<void> {
  try {
    const result = await withTenantContext({ userId, branchId }, (tx) =>
      tx.stockItem.updateMany({
        where: { id, branchId },
        data: {
          name: input.name,
          unit: input.unit ?? null,
          minAlertLevel: input.minAlertLevel,
          updatedBy: userId,
        },
      })
    );
    if (result.count === 0) throw new StockItemNotFoundError("Stock item not found.");
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new StockItemNameConflictError("A stock item with this name already exists.");
    }
    throw err;
  }
}

/** Owner-only: deactivate/reactivate rather than delete — keeps the row (and its
 * name uniqueness slot, history, and any future references) intact. */
export async function setStockItemStatus(
  branchId: string,
  userId: string,
  id: string,
  isActive: boolean
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.stockItem.updateMany({
      where: { id, branchId },
      data: { isActive, updatedBy: userId },
    })
  );
  if (result.count === 0) throw new StockItemNotFoundError("Stock item not found.");
}

/** Any branch member — the one field everyone (Owner, Manager, Staff) may edit. */
export async function updateStockQuantity(
  branchId: string,
  userId: string,
  id: string,
  currentQuantity: number
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.stockItem.updateMany({
      where: { id, branchId, isActive: true },
      data: { currentQuantity, updatedBy: userId },
    })
  );
  if (result.count === 0) throw new StockItemNotFoundError("Stock item not found.");
}

/** For the Owner Dashboard's low-stock KPI. */
export async function getLowStockCount(branchId: string, userId: string): Promise<number> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const items = await tx.stockItem.findMany({
      where: { branchId, isActive: true },
      select: { currentQuantity: true, minAlertLevel: true },
    });
    return items.filter((i) => Number(i.currentQuantity) <= Number(i.minAlertLevel)).length;
  });
}
