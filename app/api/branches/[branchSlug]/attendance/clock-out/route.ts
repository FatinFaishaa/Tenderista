import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import {
  clockOut,
  NotStaffMemberError,
  NotClockedInError,
  AlreadyClockedOutError,
} from "@/lib/attendance/queries";

// Self-service only — no request body, no target staffId. The caller always clocks
// themselves out.
export async function POST(
  _request: Request,
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

  try {
    await clockOut(branch.id, session.userId, branch.timezone);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof NotStaffMemberError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof NotClockedInError || err instanceof AlreadyClockedOutError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
