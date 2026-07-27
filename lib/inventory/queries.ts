import { withTenantContext } from "@/lib/db";
import type { StockCategoryValue } from "@/lib/validation/stock";

export class StockItemNotFoundError extends Error {}
export class StockItemNameConflictError extends Error {}

export type StockItemRow = {
  id: string;
  name: string;
  unit: string | null;
  category: StockCategoryValue;
  currentQuantity: number;
  minAlertLevel: number;
  isActive: boolean;
  isLow: boolean;
  createdAt: Date;
  creatorName: string;
  updatedAt: Date;
  updatedByName: string | null;
};

function toRow(item: {
  id: string;
  name: string;
  unit: string | null;
  category: string;
  currentQuantity: unknown;
  minAlertLevel: unknown;
  isActive: boolean;
  createdAt: Date;
  creator: { name: string };
  updatedAt: Date;
  updater: { name: string } | null;
}): StockItemRow {
  const currentQuantity = Number(item.currentQuantity);
  const minAlertLevel = Number(item.minAlertLevel);
  return {
    id: item.id,
    name: item.name,
    unit: item.unit,
    category: item.category as StockCategoryValue,
    currentQuantity,
    minAlertLevel,
    isActive: item.isActive,
    // Computed at read time, not stored — mirrors checklist_instances' "overdue".
    isLow: currentQuantity <= minAlertLevel,
    createdAt: item.createdAt,
    creatorName: item.creator.name,
    updatedAt: item.updatedAt,
    updatedByName: item.updater?.name ?? null,
  };
}

/** Owner management view — every item, active and inactive alike. */
export async function listStockItems(branchId: string, userId: string): Promise<StockItemRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const items = await tx.stockItem.findMany({
      where: { branchId },
      orderBy: { name: "asc" },
      include: { creator: { select: { name: true } }, updater: { select: { name: true } } },
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
      include: { creator: { select: { name: true } }, updater: { select: { name: true } } },
    });
    return items.map(toRow);
  });
}

export type StockCategoryGroup = {
  category: StockCategoryValue;
  items: StockItemRow[];
};

/** Same rows as listStockItems/listActiveStockItems, reshaped into one group per
 * category (fixed order: kitchen, barista, cashier, kedai) — used by both the
 * Owner management page and the staff-facing update page, so category sections
 * appear in a consistent order regardless of who's looking. Empty categories are
 * still included (with an empty items array) so the UI can show "no items yet"
 * per category rather than silently omitting it. */
export async function listStockItemsGroupedByCategory(
  branchId: string,
  userId: string,
  activeOnly: boolean
): Promise<StockCategoryGroup[]> {
  const rows = activeOnly
    ? await listActiveStockItems(branchId, userId)
    : await listStockItems(branchId, userId);

  const order: StockCategoryValue[] = ["kitchen", "barista", "cashier", "kedai"];
  return order.map((category) => ({
    category,
    items: rows.filter((r) => r.category === category),
  }));
}

export async function getStockItemById(
  branchId: string,
  userId: string,
  id: string
): Promise<StockItemRow | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const item = await tx.stockItem.findFirst({
      where: { id, branchId },
      include: { creator: { select: { name: true } }, updater: { select: { name: true } } },
    });
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
  input: {
    name: string;
    unit?: string;
    category: StockCategoryValue;
    minAlertLevel: number;
    currentQuantity: number;
  }
): Promise<{ id: string }> {
  try {
    const item = await withTenantContext({ userId, branchId }, (tx) =>
      tx.stockItem.create({
        data: {
          branchId,
          name: input.name,
          unit: input.unit ?? null,
          category: input.category,
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

/** Owner-only: name/unit/category/minAlertLevel — never touches currentQuantity. */
export async function updateStockItem(
  branchId: string,
  userId: string,
  id: string,
  input: { name: string; unit?: string; category: StockCategoryValue; minAlertLevel: number }
): Promise<void> {
  try {
    const result = await withTenantContext({ userId, branchId }, (tx) =>
      tx.stockItem.updateMany({
        where: { id, branchId },
        data: {
          name: input.name,
          unit: input.unit ?? null,
          category: input.category,
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

export type LowStockItem = {
  id: string;
  name: string;
  currentQuantity: number;
  unit: string | null;
};

/** For the Owner dashboard's "Low Stock Alerts" list — items at or below their
 * alert threshold, lowest-relative-to-threshold first so the most urgent items
 * surface at the top. Capped to `limit` since the dashboard only shows a preview
 * (full list lives on the Inventory page itself). */
export async function getLowStockItems(
  branchId: string,
  userId: string,
  limit = 4
): Promise<LowStockItem[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const items = await tx.stockItem.findMany({
      where: { branchId, isActive: true },
      select: { id: true, name: true, currentQuantity: true, minAlertLevel: true, unit: true },
    });
    return items
      .filter((i) => Number(i.currentQuantity) <= Number(i.minAlertLevel))
      .sort((a, b) => Number(a.currentQuantity) - Number(b.currentQuantity))
      .slice(0, limit)
      .map((i) => ({
        id: i.id,
        name: i.name,
        currentQuantity: Number(i.currentQuantity),
        unit: i.unit,
      }));
  });
}

/** Owner-only, permanent: hard-deletes the stock item. No other table references
 * StockItem, so this is a simple row delete with no cascade concerns — unlike
 * Staff deletion, there's no history to lose here. */
export async function deleteStockItem(
  branchId: string,
  userId: string,
  id: string
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.stockItem.deleteMany({ where: { id, branchId } })
  );
  if (result.count === 0) throw new StockItemNotFoundError("Stock item not found.");
}
