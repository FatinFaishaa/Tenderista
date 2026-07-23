import { withTenantContext } from "@/lib/db";
import { formatDateKey, parseDateKey } from "@/lib/utils/week";
import type { LeaveRequestCreateInput, LeaveStatusValue, LeaveTypeValue } from "@/lib/validation/leave";

export class LeaveMutationError extends Error {}
export class LeaveNotFoundError extends Error {}

export type LeaveRequestListItem = {
  id: string;
  staffId: string;
  staffName: string;
  type: LeaveTypeValue;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatusValue;
  reviewNotes: string | null;
  reviewedByName: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

/** The caller's own Staff row id at this branch — null for Owner/Manager, who may
 * have no Staff row (Owner) or aren't allowed to submit leave in V1 (Manager). */
async function getOwnStaffId(
  branchId: string,
  userId: string
): Promise<string | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const staff = await tx.staff.findUnique({
      where: { branchId_userId: { branchId, userId } },
      select: { id: true },
    });
    return staff?.id ?? null;
  });
}

function toListItem(row: {
  id: string;
  staffId: string;
  staff: { user: { name: string } };
  type: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  status: string;
  reviewNotes: string | null;
  approver: { name: string } | null;
  decidedAt: Date | null;
  createdAt: Date;
}): LeaveRequestListItem {
  return {
    id: row.id,
    staffId: row.staffId,
    staffName: row.staff.user.name,
    type: row.type as LeaveTypeValue,
    startDate: formatDateKey(row.startDate),
    endDate: formatDateKey(row.endDate),
    reason: row.reason,
    status: row.status as LeaveStatusValue,
    reviewNotes: row.reviewNotes,
    reviewedByName: row.approver?.name ?? null,
    reviewedAt: row.decidedAt,
    createdAt: row.createdAt,
  };
}

/** Staff-facing: the caller's own leave requests only. Returns [] for a caller with
 * no Staff row at this branch (e.g. Owner) rather than erroring. */
export async function listMyLeaveRequests(
  branchId: string,
  userId: string,
  status?: LeaveStatusValue
): Promise<LeaveRequestListItem[]> {
  const staffId = await getOwnStaffId(branchId, userId);
  if (!staffId) return [];

  return withTenantContext({ userId, branchId }, async (tx) => {
    const rows = await tx.leaveRequest.findMany({
      where: { branchId, staffId, ...(status ? { status } : {}) },
      include: { staff: { include: { user: { select: { name: true } } } }, approver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toListItem);
  });
}

/** Owner/Manager-facing: every leave request in the branch. Caller's role must
 * already be checked by the route handler — this assumes Owner/Manager access. */
export async function listBranchLeaveRequests(
  branchId: string,
  userId: string,
  status?: LeaveStatusValue
): Promise<LeaveRequestListItem[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const rows = await tx.leaveRequest.findMany({
      where: { branchId, ...(status ? { status } : {}) },
      include: { staff: { include: { user: { select: { name: true } } } }, approver: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toListItem);
  });
}

export type PendingLeaveSummary = {
  count: number;
  recent: LeaveRequestListItem[];
};

/** Owner/Manager dashboard card: how many leave requests are pending branch-wide, plus
 * the 3 most recent (already newest-first from listBranchLeaveRequests) to preview
 * without a separate trip to the full Leave Requests page. */
export async function getPendingLeaveSummaryForBranch(
  branchId: string,
  userId: string
): Promise<PendingLeaveSummary> {
  const pending = await listBranchLeaveRequests(branchId, userId, "pending");
  return { count: pending.length, recent: pending.slice(0, 3) };
}

/** Staff only: submits a leave request for the caller's own Staff row. A staff member
 * can never submit on behalf of someone else — there is no staffId input. */
export async function createLeaveRequest(
  branchId: string,
  userId: string,
  input: LeaveRequestCreateInput
): Promise<{ id: string }> {
  const staffId = await getOwnStaffId(branchId, userId);
  if (!staffId) {
    throw new LeaveMutationError("Only staff can submit a leave request.");
  }

  return withTenantContext({ userId, branchId }, async (tx) => {
    const created = await tx.leaveRequest.create({
      data: {
        branchId,
        staffId,
        type: input.type,
        startDate: parseDateKey(input.startDate),
        endDate: parseDateKey(input.endDate),
        reason: input.reason,
        status: "pending",
      },
    });
    return { id: created.id };
  });
}

/** Owner/Manager only: approves a pending request. Reuses approved_by for whoever
 * acted on the request (approve or reject) — there is no separate rejected_by column. */
export async function approveLeaveRequest(
  branchId: string,
  userId: string,
  id: string
): Promise<void> {
  await withTenantContext({ userId, branchId }, async (tx) => {
    const result = await tx.leaveRequest.updateMany({
      where: { id, branchId, status: "pending" },
      data: { status: "approved", approvedBy: userId, decidedAt: new Date() },
    });
    if (result.count === 0) {
      throw new LeaveNotFoundError("This leave request is no longer pending.");
    }
  });
}

/** Owner/Manager only: rejects a pending request, with an optional note. */
export async function rejectLeaveRequest(
  branchId: string,
  userId: string,
  id: string,
  reviewNotes?: string
): Promise<void> {
  await withTenantContext({ userId, branchId }, async (tx) => {
    const result = await tx.leaveRequest.updateMany({
      where: { id, branchId, status: "pending" },
      data: {
        status: "rejected",
        approvedBy: userId,
        decidedAt: new Date(),
        reviewNotes: reviewNotes ?? null,
      },
    });
    if (result.count === 0) {
      throw new LeaveNotFoundError("This leave request is no longer pending.");
    }
  });
}

/** Staff only: cancels the caller's own request, while it is still pending. */
export async function cancelLeaveRequest(
  branchId: string,
  userId: string,
  id: string
): Promise<void> {
  const staffId = await getOwnStaffId(branchId, userId);
  if (!staffId) {
    throw new LeaveMutationError("Only staff can cancel their own leave request.");
  }

  await withTenantContext({ userId, branchId }, async (tx) => {
    const result = await tx.leaveRequest.updateMany({
      where: { id, branchId, staffId, status: "pending" },
      data: { status: "cancelled" },
    });
    if (result.count === 0) {
      throw new LeaveNotFoundError("This leave request can no longer be cancelled.");
    }
  });
}
