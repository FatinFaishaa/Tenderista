import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listMyLeaveRequests } from "@/lib/leave/queries";
import {
  LEAVE_STATUSES,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_TONES,
  LEAVE_TYPE_LABELS,
  type LeaveStatusValue,
} from "@/lib/validation/leave";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { CancelLeaveButton } from "@/components/leave/CancelLeaveButton";

export default async function MyLeavePage({
  params,
  searchParams,
}: {
  params: Promise<{ branchSlug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { branchSlug } = await params;
  const { status: statusParam } = await searchParams;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const status = LEAVE_STATUSES.includes(statusParam as LeaveStatusValue)
    ? (statusParam as LeaveStatusValue)
    : undefined;

  const requests = await listMyLeaveRequests(branch.id, session.userId, status);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">My Leave</h1>

      <LeaveRequestForm branchSlug={branchSlug} />

      <div className="flex flex-wrap gap-2">
        {[{ value: undefined, label: "All" }, ...LEAVE_STATUSES.map((s) => ({
          value: s,
          label: LEAVE_STATUS_LABELS[s],
        }))].map((option) => {
          const href = option.value
            ? `/${branchSlug}/leave?status=${option.value}`
            : `/${branchSlug}/leave`;
          const active = status === option.value;
          return (
            <Link
              key={option.label}
              href={href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium",
                active
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              )}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {requests.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No leave requests yet.</p>
      )}
      <div className="space-y-2">
        {requests.map((request) => (
          <Card key={request.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {LEAVE_TYPE_LABELS[request.type]}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {request.startDate} → {request.endDate}
              </p>
              {request.reason && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{request.reason}</p>
              )}
              {request.reviewNotes && (
                <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                  Review notes: {request.reviewNotes}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <Badge tone={LEAVE_STATUS_TONES[request.status]}>
                {LEAVE_STATUS_LABELS[request.status]}
              </Badge>
              {request.status === "pending" && (
                <CancelLeaveButton branchSlug={branchSlug} requestId={request.id} />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
