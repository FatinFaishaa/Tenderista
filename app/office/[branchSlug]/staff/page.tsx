import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listStaffForBranch } from "@/lib/staff/queries";
import { DEPARTMENT_LABELS } from "@/lib/validation/checklist";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StaffStatusButton } from "@/components/staff/StaffStatusButton";

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
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Staff</h1>
        <div className="flex gap-2">
          {canReviewLeave && (
            <Link href={`/office/${branchSlug}/staff/leave-requests`}>
              <Button variant="secondary">Leave Requests</Button>
            </Link>
          )}
          {isOwner && (
            <Link href={`/office/${branchSlug}/staff/new`}>
              <Button>+ Add Staff</Button>
            </Link>
          )}
        </div>
      </div>

      {staff.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No staff added yet.</p>
      )}
      <div className="space-y-2">
        {staff.map((member) => (
          <Card key={member.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{member.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{member.email}</p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                {member.jobPosition}
                {member.department &&
                  ` · ${DEPARTMENT_LABELS[member.department as keyof typeof DEPARTMENT_LABELS]}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge tone={member.status === "active" ? "success" : "neutral"}>
                {member.status === "active" ? "Active" : "Inactive"}
              </Badge>
              {isOwner && (
                <>
                  <Link href={`/office/${branchSlug}/staff/${member.id}/edit`}>
                    <Button variant="secondary" className="px-3 py-1.5 text-sm">
                      Edit
                    </Button>
                  </Link>
                  <StaffStatusButton
                    branchSlug={branchSlug}
                    staffId={member.id}
                    status={member.status}
                  />
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
