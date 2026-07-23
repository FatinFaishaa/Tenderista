import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { toggleTodaysCompletion, DailyTaskNotFoundError } from "@/lib/dailyTasks/queries";

// Any branch member — Owner, Manager, or Staff — can toggle any task. No department
// restriction in V1, unlike the Opening/Closing Checklist toggle route.
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

  try {
    const result = await toggleTodaysCompletion(branch.id, session.userId, id, branch.timezone);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DailyTaskNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
