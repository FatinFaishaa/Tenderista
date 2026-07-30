import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStockCategories } from "@/lib/stockCategories/queries";
import { StockItemForm } from "@/components/inventory/StockItemForm";

export default async function NewStockItemPage({
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
  const categories = await listStockCategories(branch.id, session.userId);
  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add Stock Item
      </h1>
      <StockItemForm branchSlug={branchSlug} categories={categories} />
    </div>
  );
}
