import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listCategoryNames } from "@/lib/sops/queries";
import { SopForm } from "@/components/sops/SopForm";

export default async function NewSopPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const categoryNames = await listCategoryNames(branch.id, session.userId);

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">New SOP</h1>
      <SopForm branchSlug={branchSlug} categoryNames={categoryNames} />
    </div>
  );
}
