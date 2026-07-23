import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getSopById, listCategoryNames } from "@/lib/sops/queries";
import { SopForm } from "@/components/sops/SopForm";

export default async function EditSopPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const [sop, categoryNames] = await Promise.all([
    getSopById(branch.id, session.userId, id),
    listCategoryNames(branch.id, session.userId),
  ]);
  if (!sop) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Edit SOP</h1>
      <SopForm
        branchSlug={branchSlug}
        categoryNames={categoryNames}
        sopId={sop.id}
        initialValues={{ title: sop.title, category: sop.categoryName, content: sop.content }}
      />
    </div>
  );
}
