import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockItemsGroupedByCategory } from "@/lib/inventory/queries";
import { STOCK_CATEGORY_LABELS } from "@/lib/validation/stock";
import { Button } from "@/components/ui/Button";
import { StockItemRow } from "@/components/inventory/StockItemRow";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner") redirect(`/office/${branchSlug}/dashboard`);
  const groups = await listStockItemsGroupedByCategory(branch.id, session.userId, false);
  const hasAnyItems = groups.some((g) => g.items.length > 0);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Stock Items
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Manage what&apos;s tracked and its minimum alert level, or adjust the current
            quantity directly. Any staff member can also update it from their own app.
          </p>
        </div>
        <Link href={`/office/${branchSlug}/inventory/new`}>
          <Button>+ Add Stock Item</Button>
        </Link>
      </div>
      {!hasAnyItems && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No stock items yet.</p>
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
                  <StockItemRow key={item.id} branchSlug={branchSlug} item={item} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
