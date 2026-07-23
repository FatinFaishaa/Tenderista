import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import {
  toggleTodaysClosingCompletion,
  ClosingChecklistDepartmentMismatchError,
} from "@/lib/closingChecklists/queries";
import { getMyDepartment } from "@/lib/staff/queries";

// Owner/Manager can check off any item — unrestricted, as before. Staff are scoped to
// their own department (via getMyDepartment); a Staff row with no department set can't
// toggle anything, matching the staff-facing list showing nothing for them either.
export async function POST(
  _request: Request,
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

  const restrictToDepartment =
    branch.role === "staff" ? await getMyDepartment(branch.id, session.userId) : undefined;

  try {
    const result = await toggleTodaysClosingCompletion(
      branch.id,
      session.userId,
      id,
      branch.timezone,
      restrictToDepartment
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ClosingChecklistDepartmentMismatchError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Checklist item not found." }, { status: 404 });
  }
}
