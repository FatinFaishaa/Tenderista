import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockItemsGroupedByCategory } from "@/lib/inventory/queries";
import { Button } from "@/components/ui/Button";
import { StockCategoryRow } from "@/components/inventory/StockCategoryRow";
import { AddStockCategoryButton } from "@/components/inventory/AddStockCategoryButton";

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Stock Items
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pick a category to view and manage its items.
          </p>
        </div>
        <Link href={`/office/${branchSlug}/inventory/new`}>
          <Button>+ Add Stock Item</Button>
        </Link>
      </div>

      <div className="mb-4 flex justify-end">
        <AddStockCategoryButton branchSlug={branchSlug} />
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <StockCategoryRow
            key={group.categoryId}
            branchSlug={branchSlug}
            href={`/office/${branchSlug}/inventory/category/${group.categoryId}`}
            categoryId={group.categoryId}
            categoryName={group.categoryName}
            itemCount={group.items.length}
          />
        ))}
      </div>
    </div>
  );
}
