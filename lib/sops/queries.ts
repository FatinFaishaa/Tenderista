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

export type SopCategoryCard = {
  id: string;
  name: string;
  description: string | null;
  sopCount: number;
};

/** For the category-picker page (Step 1 of the staff SOP flow) — every category
 * that has at least one SOP, with a count for the badge. Empty categories are
 * omitted, same filtering rule as listSopsGroupedByCategory. */
export async function listSopCategoriesWithCount(
  branchId: string,
  userId: string
): Promise<SopCategoryCard[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const categories = await tx.sopCategory.findMany({
      where: { branchId },
      orderBy: { name: "asc" },
      include: { _count: { select: { sops: true } } },
    });
    return categories
      .filter((c) => c._count.sops > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        sopCount: c._count.sops,
      }));
  });
}

export type SopCategoryDetail = {
  id: string;
  name: string;
  description: string | null;
  sops: SopListItem[];
};

/** For Step 2 of the staff SOP flow — one category's SOPs, plus the category's own
 * name/description for the page header. Null if the category doesn't exist or
 * belongs to a different branch (RLS would already block the latter, but the
 * explicit branchId check keeps the not-found path readable). */
export async function getSopCategoryWithSops(
  branchId: string,
  userId: string,
  categoryId: string
): Promise<SopCategoryDetail | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const category = await tx.sopCategory.findFirst({
      where: { id: categoryId, branchId },
      include: {
        sops: {
          orderBy: { title: "asc" },
          select: { id: true, title: true, updatedAt: true },
        },
      },
    });
    if (!category) return null;
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      sops: category.sops,
    };
  });
}
/** Auto-picks an emoji for a SOP category based on keywords in its name — no
 * per-category emoji field, so this keeps the picker unmanaged and automatic
 * rather than another thing an Owner has to configure. Falls back to a generic
 * document icon when nothing matches. */
export function getSopCategoryEmoji(categoryName: string): string {
  const name = categoryName.toLowerCase();
  if (name.includes("barista") || name.includes("minuman") || name.includes("air")) return "☕";
  if (name.includes("kitchen") || name.includes("dapur") || name.includes("masak")) return "🍗";
  if (name.includes("kedai") || name.includes("operasi") || name.includes("store")) return "🏪";
  if (name.includes("kaunter") || name.includes("serve") || name.includes("pelanggan"))
    return "📋";
  if (name.includes("kebersihan") || name.includes("cleaning")) return "🧹";
  if (name.includes("kewangan") || name.includes("financial") || name.includes("cash"))
    return "💰";
  if (name.includes("keselamatan") || name.includes("safety")) return "🦺";
  return "📄";
}
