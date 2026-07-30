import { withTenantContext } from "@/lib/db";

export type StockCategoryRow = {
  id: string;
  name: string;
  sortOrder: number;
};

export class StockCategoryNotFoundError extends Error {}
export class StockCategoryNameConflictError extends Error {}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

/** Every category folder for this branch, in display order. */
export async function listStockCategories(
  branchId: string,
  userId: string
): Promise<StockCategoryRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const rows = await tx.stockCategory.findMany({
      where: { branchId },
      orderBy: { sortOrder: "asc" },
    });
    return rows.map((r) => ({ id: r.id, name: r.name, sortOrder: r.sortOrder }));
  });
}

/** Owner-only: adds a new folder, appended to the end of the branch's list. */
export async function createStockCategory(
  branchId: string,
  userId: string,
  name: string
): Promise<{ id: string }> {
  try {
    return await withTenantContext({ userId, branchId }, async (tx) => {
      const last = await tx.stockCategory.findFirst({
        where: { branchId },
        orderBy: { sortOrder: "desc" },
      });
      const category = await tx.stockCategory.create({
        data: { branchId, name, sortOrder: (last?.sortOrder ?? -1) + 1 },
      });
      return { id: category.id };
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new StockCategoryNameConflictError("A folder with this name already exists.");
    }
    throw err;
  }
}

/** Owner-only: renames an existing folder. */
export async function renameStockCategory(
  branchId: string,
  userId: string,
  id: string,
  name: string
): Promise<void> {
  try {
    const result = await withTenantContext({ userId, branchId }, (tx) =>
      tx.stockCategory.updateMany({
        where: { id, branchId },
        data: { name },
      })
    );
    if (result.count === 0) throw new StockCategoryNotFoundError("Folder not found.");
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw new StockCategoryNameConflictError("A folder with this name already exists.");
    }
    throw err;
  }
}
