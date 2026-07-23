import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getTodaysClosingChecklist, getTodaysClosingSubmission } from "@/lib/closingChecklists/queries";
import { getMyDepartment } from "@/lib/staff/queries";
import { ClosingChecklistItemCheckbox } from "@/components/closingChecklists/ClosingChecklistItemCheckbox";
import { ClosingChecklistPhotoUpload } from "@/components/closingChecklists/ClosingChecklistPhotoUpload";

export default async function StaffClosingChecklistsPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const userId = session.userId;
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
            <ClosingChecklistDepartmentSection
              key={group.department}
              branchId={branch.id}
              branchSlug={branchSlug}
              userId={userId}
              timezone={branch.timezone}
              department={group.department}
              label={group.label}
              items={group.items}
            />
          ))}
      </div>
    </div>
  );
}

async function ClosingChecklistDepartmentSection({
  branchId,
  branchSlug,
  userId,
  timezone,
  department,
  label,
  items,
}: {
  branchId: string;
  branchSlug: string;
  userId: string;
  timezone: string;
  department: string;
  label: string;
  items: {
    id: string;
    title: string;
    isCompleted: boolean;
    completedByName: string | null;
  }[];
}) {
  const allCompleted = items.every((item) => item.isCompleted);

  // Owner viewing a department they don't belong to shouldn't see the upload
  // prompt at all — the photo submission is a staff/manager action for their own
  // department's items.
  const submission = await getTodaysClosingSubmission(
    branchId,
    userId,
    department as Parameters<typeof getTodaysClosingSubmission>[2],
    timezone
  );

  return (
    <div>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </h2>
      <div className="space-y-2">
        {items.map((item) => (
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
      <ClosingChecklistPhotoUpload
        branchSlug={branchSlug}
        allCompleted={allCompleted}
        existingSubmission={
          submission
            ? {
                submittedByName: submission.submittedByName,
                submittedAt: submission.submittedAt.toISOString(),
              }
            : null
        }
      />
    </div>
  );
}
