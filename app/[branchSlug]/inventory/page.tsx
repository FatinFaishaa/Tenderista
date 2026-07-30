import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockItemsGroupedByCategory } from "@/lib/inventory/queries";

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

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Stock
      </h1>

      <div className="space-y-3">
        {groups.map((group) => (
          <Link
            key={group.categoryId}
            href={`/${branchSlug}/inventory/category/${group.categoryId}`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800">
              <Folder className="h-6 w-6 text-brand-maroon" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-zinc-900 dark:text-zinc-50">
                {group.categoryName}
              </p>
              <span className="mt-1.5 inline-block rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-brand-maroon dark:bg-pink-950 dark:text-red-400">
                {group.items.length} item{group.items.length === 1 ? "" : "s"}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-brand-maroon" />
          </Link>
        ))}
      </div>
    </div>
  );
}
