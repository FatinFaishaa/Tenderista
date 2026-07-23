import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { cancelLeaveRequest, LeaveMutationError, LeaveNotFoundError } from "@/lib/leave/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchSlug: string; id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { branchSlug, id } = await params;
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) {
    return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  }
  if (branch.role !== "staff") {
    return NextResponse.json(
      { error: "Only Staff can cancel their own leave request." },
      { status: 403 }
    );
  }

  try {
    await cancelLeaveRequest(branch.id, session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof LeaveNotFoundError || err instanceof LeaveMutationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
