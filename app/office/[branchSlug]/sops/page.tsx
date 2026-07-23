import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listSopsGroupedByCategory } from "@/lib/sops/queries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function SopsPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const groups = await listSopsGroupedByCategory(branch.id, session.userId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">SOPs</h1>
        <Link href={`/office/${branchSlug}/sops/new`}>
          <Button>+ New SOP</Button>
        </Link>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No SOPs yet. Create one to document how things should be done.
        </p>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.categoryId}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.categoryName}
            </h2>
            <div className="space-y-2">
              {group.sops.map((sop) => (
                <Link key={sop.id} href={`/office/${branchSlug}/sops/${sop.id}`}>
                  <Card className="transition-colors hover:border-blue-400">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {sop.title}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
