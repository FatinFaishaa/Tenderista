import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listActiveStockItems } from "@/lib/inventory/queries";
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

  const items = await listActiveStockItems(branch.id, session.userId);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Stock
      </h1>

      {items.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No stock items yet — check back once your Owner sets some up.
        </p>
      )}

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
    </div>
  );
}
