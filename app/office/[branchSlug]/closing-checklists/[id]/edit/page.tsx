import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getClosingChecklistItemById } from "@/lib/closingChecklists/queries";
import { ClosingChecklistItemForm } from "@/components/closingChecklists/ClosingChecklistItemForm";

export default async function EditClosingChecklistItemPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const item = await getClosingChecklistItemById(branch.id, session.userId, id);
  if (!item) notFound();

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Closing Checklist Item
      </h1>
      <ClosingChecklistItemForm
        branchSlug={branchSlug}
        itemId={item.id}
        initialValues={{ title: item.title, department: item.department }}
      />
    </div>
  );
}
