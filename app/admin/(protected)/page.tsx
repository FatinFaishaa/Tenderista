import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { listAllBranchesForPlatformAdmin } from "@/lib/tenancy/admin";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const branches = await listAllBranchesForPlatformAdmin(session.platformAdminId!);
  const activeCount = branches.filter((b) => b.status === "active").length;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Platform Dashboard
      </h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Total branches</CardTitle>
          <CardValue>{branches.length}</CardValue>
        </Card>
        <Card>
          <CardTitle>Active branches</CardTitle>
          <CardValue>{activeCount}</CardValue>
        </Card>
      </div>
      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/admin/branches" className="text-blue-600 hover:underline dark:text-blue-400">
          View all branches →
        </Link>
      </p>
    </div>
  );
}
