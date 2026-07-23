import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { createStaffMember, StaffMutationError } from "@/lib/staff/queries";
import { staffCreateSchema } from "@/lib/validation/staff";

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
  // Staff Management is Owner-only per spec — unlike Announcements/SOPs/Checklists,
  // Manager isn't granted add/edit/disable rights here.
  if (branch.role !== "owner") {
    return NextResponse.json(
      { error: "Only the Owner can add staff." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = staffCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const result = await createStaffMember(branch.id, session.userId, parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof StaffMutationError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
