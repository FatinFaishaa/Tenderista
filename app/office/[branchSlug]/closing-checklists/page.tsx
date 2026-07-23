import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import {
  listClosingItemsGroupedByDepartment,
  getClosingProgressByDepartment,
} from "@/lib/closingChecklists/queries";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClosingChecklistItemRowControls } from "@/components/closingChecklists/ClosingChecklistItemRowControls";

export default async function ClosingChecklistsPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const [groups, progress] = await Promise.all([
    listClosingItemsGroupedByDepartment(branch.id, session.userId),
    getClosingProgressByDepartment(branch.id, session.userId, branch.timezone),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Closing Checklist
        </h1>
        <div className="flex gap-2">
          {branch.role === "owner" && (
            <Link href={`/office/${branchSlug}/closing-checklists/history`}>
              <Button variant="secondary">History</Button>
            </Link>
          )}
          <Link href={`/office/${branchSlug}/closing-checklists/new`}>
            <Button>+ Add Item</Button>
          </Link>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Today&apos;s Progress
      </h2>
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {progress.map((p) => (
          <Card key={p.department}>
            <CardTitle>{p.label}</CardTitle>
            <CardValue>{p.total === 0 ? "—" : `${p.completed}/${p.total}`}</CardValue>
          </Card>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Template
      </h2>
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.department}>
            <h3 className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">{group.label}</h3>
            {group.items.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">No items yet.</p>
            ) : (
              <div className="space-y-2">
                {group.items.map((item, index) => (
                  <Card key={item.id} className="flex items-center justify-between gap-4">
                    <span className="text-zinc-900 dark:text-zinc-50">{item.title}</span>
                    <div className="flex items-center gap-2">
                      <Link href={`/office/${branchSlug}/closing-checklists/${item.id}/edit`}>
                        <Button variant="secondary" className="px-3 py-1.5 text-sm">
                          Edit
                        </Button>
                      </Link>
                      <ClosingChecklistItemRowControls
                        branchSlug={branchSlug}
                        itemId={item.id}
                        isFirst={index === 0}
                        isLast={index === group.items.length - 1}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
