import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listSopsGroupedByCategory } from "@/lib/sops/queries";
import { Card } from "@/components/ui/Card";

export default async function StaffSopsPage({
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
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">📖 SOP</h1>
      {groups.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tiada SOP lagi.</p>
      )}
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.categoryId}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.categoryName}
            </h2>
            <div className="space-y-2">
              {group.sops.map((sop) => (
                <Link key={sop.id} href={`/${branchSlug}/sops/${sop.id}`}>
                  <Card className="transition-colors hover:border-brand-maroon">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      📄 {sop.title}
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
