import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { getAccessibleBranches } from "@/lib/tenancy/branch";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function BranchesPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branches = await getAccessibleBranches(session.userId);
  if (branches.length === 0) redirect("/no-access");
  if (branches.length === 1) {
    const b = branches[0];
    redirect(b.role === "staff" ? `/${b.slug}` : `/office/${b.slug}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Choose a branch
        </h1>
        <LogoutButton />
      </div>
      <div className="space-y-3">
        {branches.map((branch) => (
          <Link
            key={branch.id}
            href={branch.role === "staff" ? `/${branch.slug}` : `/office/${branch.slug}/dashboard`}
          >
            <Card className="flex items-center justify-between transition-colors hover:border-blue-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {branch.name}
              </span>
              <Badge tone={branch.role === "owner" ? "success" : "neutral"}>
                {branch.role}
              </Badge>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
