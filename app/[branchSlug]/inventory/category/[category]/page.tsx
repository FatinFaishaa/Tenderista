import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockItemsGroupedByCategory } from "@/lib/inventory/queries";
import { StaffCategoryItemsList } from "@/components/inventory/StaffCategoryItemsList";

export default async function StaffInventoryCategoryPage({
  params,
}: {
  params: Promise<{ branchSlug: string; category: string }>;
}) {
  const { branchSlug, category: categoryId } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const groups = await listStockItemsGroupedByCategory(branch.id, session.userId, true);
  const group = groups.find((g) => g.categoryId === categoryId);
  if (!group) notFound();

  return (
    <div>
      <Link
        href={`/${branchSlug}/inventory`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali
      </Link>

      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {group.categoryName}
      </h1>

      <StaffCategoryItemsList branchSlug={branchSlug} items={group.items} />
    </div>
  );
}
