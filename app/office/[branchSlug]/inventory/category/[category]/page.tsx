import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockItemsGroupedByCategory } from "@/lib/inventory/queries";
import { StockItemRow } from "@/components/inventory/StockItemRow";

export default async function InventoryCategoryPage({
  params,
}: {
  params: Promise<{ branchSlug: string; category: string }>;
}) {
  const { branchSlug, category: categoryId } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner") redirect(`/office/${branchSlug}/dashboard`);

  const groups = await listStockItemsGroupedByCategory(branch.id, session.userId, false);
  const group = groups.find((g) => g.categoryId === categoryId);
  if (!group) notFound();

  return (
    <div>
      <Link
        href={`/office/${branchSlug}/inventory`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Categories
      </Link>

      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {group.categoryName}
      </h1>

      {group.items.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No stock items yet in this category.
        </p>
      ) : (
        <div className="space-y-2">
          {group.items.map((item) => (
            <StockItemRow key={item.id} branchSlug={branchSlug} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
