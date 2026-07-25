import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockItemsGroupedByCategory } from "@/lib/inventory/queries";
import { STOCK_CATEGORY_LABELS } from "@/lib/validation/stock";
import { StockQuantityEditor } from "@/components/inventory/StockQuantityEditor";

export default async function StaffInventoryPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const groups = await listStockItemsGroupedByCategory(branch.id, session.userId, true);
  const hasAnyItems = groups.some((g) => g.items.length > 0);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Stock
      </h1>

      {!hasAnyItems && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No stock items yet — check back once your Owner sets some up.
        </p>
      )}

      <div className="space-y-6">
        {groups
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <div key={group.category}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {STOCK_CATEGORY_LABELS[group.category]}
              </h2>
              <div className="space-y-2">
                {group.items.map((item) => (
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
            </div>
          ))}
      </div>
    </div>
  );
}
