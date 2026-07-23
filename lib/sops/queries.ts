import { withTenantContext } from "@/lib/db";

export type SopListItem = {
  id: string;
  title: string;
  updatedAt: Date;
};

export type SopCategoryGroup = {
  categoryId: string;
  categoryName: string;
  sops: SopListItem[];
};

export type SopDetail = {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  categoryName: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Branch-specific, grouped by category (categories A→Z, SOPs A→Z within each). */
export async function listSopsGroupedByCategory(
  branchId: string,
  userId: string
): Promise<SopCategoryGroup[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const categories = await tx.sopCategory.findMany({
      where: { branchId },
      orderBy: { name: "asc" },
      include: {
        sops: {
          orderBy: { title: "asc" },
          select: { id: true, title: true, updatedAt: true },
        },
      },
    });

    return categories
      .filter((c) => c.sops.length > 0)
      .map((c) => ({
        categoryId: c.id,
        categoryName: c.name,
        sops: c.sops,
      }));
  });
}

export async function getSopById(
  branchId: string,
  userId: string,
  id: string
): Promise<SopDetail | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const row = await tx.sop.findFirst({
      where: { id, branchId },
      include: { category: true, creator: { select: { name: true } } },
    });
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      content: row.content ?? "",
      categoryId: row.categoryId,
      categoryName: row.category.name,
      createdByName: row.creator.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}

/** For the category text input's autocomplete suggestions in the SOP form. */
export async function listCategoryNames(branchId: string, userId: string): Promise<string[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const categories = await tx.sopCategory.findMany({
      where: { branchId },
      orderBy: { name: "asc" },
      select: { name: true },
    });
    return categories.map((c) => c.name);
  });
}
