import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStaffForBranch } from "@/lib/staff/queries";
import { DEPARTMENT_LABELS } from "@/lib/validation/checklist";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StaffStatusButton } from "@/components/staff/StaffStatusButton";
import { StaffDeleteButton } from "@/components/staff/StaffDeleteButton";

const actionLinkClass =
  "flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-100";

export default async function StaffPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  const isOwner = branch.role === "owner";
  const canReviewLeave = branch.role === "owner" || branch.role === "manager";
  const staff = await listStaffForBranch(branch.id, session.userId);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Staff</h1>
        <div className="flex flex-wrap gap-2">
          {canReviewLeave && (
            <Link href={`/office/${branchSlug}/staff/leave-requests`}>
              <Button variant="secondary" className="text-sm">
                Leave Requests
              </Button>
            </Link>
          )}
          {isOwner && (
            <Link href={`/office/${branchSlug}/staff/new`}>
              <Button className="text-sm">+ Add Staff</Button>
            </Link>
          )}
        </div>
      </div>
      {staff.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No staff added yet.</p>
      )}
      <div className="space-y-3">
        {staff.map((member) => (
          <Card key={member.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                  {member.name}
                </p>
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {member.email}
                </p>
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  {member.jobPosition}
                  {member.department &&
                    ` · ${DEPARTMENT_LABELS[member.department as keyof typeof DEPARTMENT_LABELS]}`}
                </p>
              </div>
              <Badge tone={member.status === "active" ? "success" : "neutral"} className="shrink-0">
                {member.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            {isOwner && (
              <div className="mt-3 flex gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <Link href={`/office/${branchSlug}/staff/${member.id}`} className={actionLinkClass}>
                  <Eye className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Details</span>
                </Link>
                <Link href={`/office/${branchSlug}/staff/${member.id}/edit`} className={actionLinkClass}>
                  <Pencil className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Edit</span>
                </Link>
                <StaffStatusButton
                  branchSlug={branchSlug}
                  staffId={member.id}
                  status={member.status}
                />
                <StaffDeleteButton
                  branchSlug={branchSlug}
                  staffId={member.id}
                  staffName={member.name}
                />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
