import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getTodaysClosingChecklist } from "@/lib/closingChecklists/queries";
import { getMyDepartment } from "@/lib/staff/queries";
import { ClosingChecklistItemCheckbox } from "@/components/closingChecklists/ClosingChecklistItemCheckbox";

export default async function StaffClosingChecklistsPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  // Owner sees everything (no department concept for them); Staff/Manager are scoped
  // to their own department — null means "no department set", which shows nothing.
  const myDepartment =
    branch.role === "owner" ? undefined : await getMyDepartment(branch.id, session.userId);
  const noDepartmentAssigned = myDepartment === null;

  const groups = await getTodaysClosingChecklist(
    branch.id,
    session.userId,
    branch.timezone,
    myDepartment
  );
  const hasAnyItems = groups.some((g) => g.items.length > 0);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Closing Checklist
      </h1>

      {!hasAnyItems && noDepartmentAssigned && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ask your Owner to set your department to see the closing checklist.
        </p>
      )}
      {!hasAnyItems && !noDepartmentAssigned && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No checklist items yet — check back once your Owner or Manager sets one up.
        </p>
      )}

      <div className="space-y-5">
        {groups
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <div key={group.department}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <ClosingChecklistItemCheckbox
                    key={item.id}
                    branchSlug={branchSlug}
                    itemId={item.id}
                    title={item.title}
                    initialCompleted={item.isCompleted}
                    completedByName={item.completedByName}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
