import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import {
  toggleTodaysCompletion,
  DailyTaskNotFoundError,
  DailyTaskCompletionLockedError,
} from "@/lib/dailyTasks/queries";

// Any branch member — Owner, Manager, or Staff — can tick any task. Unticking is
// restricted (see toggleTodaysCompletion) to the person who ticked it, or an
// Owner/Manager — no department restriction otherwise, unlike the Opening/Closing
// Checklist toggle route.
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
    const result = await toggleTodaysCompletion(
      branch.id,
      session.userId,
      id,
      branch.timezone,
      branch.role
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DailyTaskNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof DailyTaskCompletionLockedError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
