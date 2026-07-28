import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { closingDutyOverrideSchema } from "@/lib/validation/closingDuty";
import { setClosingDutyOverride } from "@/lib/roster/closingDuty";

// Weekly roster editing (and this, since it's part of the same weekly view) is
// Owner-only — Manager may only view the read-only Daily Roster, same restriction
// as RosterPage itself.
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
  if (branch.role !== "owner") {
    return NextResponse.json(
      { error: "Only the Owner can assign closing duty." },
      { status: 403 }
    );
  }
  const body = await request.json().catch(() => null);
  const parsed = closingDutyOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  await setClosingDutyOverride(branch.id, session.userId, parsed.data.date, parsed.data.staffId);
  return NextResponse.json({ ok: true });
}
