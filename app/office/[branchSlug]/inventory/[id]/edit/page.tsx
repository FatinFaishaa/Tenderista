import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getStockItemById } from "@/lib/inventory/queries";
import { StockItemForm } from "@/components/inventory/StockItemForm";

export default async function EditStockItemPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner") redirect(`/office/${branchSlug}/dashboard`);

  const item = await getStockItemById(branch.id, session.userId, id);
  if (!item) notFound();

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Stock Item
      </h1>
      <StockItemForm
        branchSlug={branchSlug}
        itemId={item.id}
        initialValues={{ name: item.name, unit: item.unit, minAlertLevel: item.minAlertLevel }}
      />
    </div>
  );
}
