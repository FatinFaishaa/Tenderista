import { getSession } from "@/lib/auth/session";
import { listAllBranchesForPlatformAdmin } from "@/lib/tenancy/admin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AdminBranchesPage() {
  const session = await getSession();
  const branches = await listAllBranchesForPlatformAdmin(session.platformAdminId!);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Branches
      </h1>
      <div className="space-y-3">
        {branches.map((branch) => (
          <Card key={branch.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{branch.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">/{branch.slug}</p>
            </div>
            <Badge tone={branch.status === "active" ? "success" : "warning"}>
              {branch.status}
            </Badge>
          </Card>
        ))}
        {branches.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No branches yet.</p>
        )}
      </div>
    </div>
  );
}
