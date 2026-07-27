import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockItemsGroupedByCategory } from "@/lib/inventory/queries";
import {
  STOCK_CATEGORIES,
  STOCK_CATEGORY_LABELS,
  type StockCategoryValue,
} from "@/lib/validation/stock";
import { StockQuantityEditor } from "@/components/inventory/StockQuantityEditor";

export default async function StaffInventoryCategoryPage({
  params,
}: {
  params: Promise<{ branchSlug: string; category: string }>;
}) {
  const { branchSlug, category } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  if (!STOCK_CATEGORIES.includes(category as StockCategoryValue)) notFound();
  const categoryValue = category as StockCategoryValue;

  const groups = await listStockItemsGroupedByCategory(branch.id, session.userId, true);
  const items = groups.find((g) => g.category === categoryValue)?.items ?? [];

  return (
    <div>
      <Link
        href={`/${branchSlug}/inventory`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Link>

      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {STOCK_CATEGORY_LABELS[categoryValue]}
      </h1>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No stock items yet in this category.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <StockQuantityEditor
              key={item.id}
              branchSlug={branchSlug}
              itemId={item.id}
              name={item.name}
              unit={item.unit}
              initialQuantity={item.currentQuantity}
              minAlertLevel={item.minAlertLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
