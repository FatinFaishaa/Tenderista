import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { leaveRequestCreateSchema } from "@/lib/validation/leave";
import { createLeaveRequest, LeaveMutationError } from "@/lib/leave/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ branchSlug: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { branchSlug } = await params;
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) {
    return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  }
  if (branch.role !== "staff") {
    return NextResponse.json(
      { error: "Only Staff can submit a leave request." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = leaveRequestCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const result = await createLeaveRequest(branch.id, session.userId, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof LeaveMutationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
