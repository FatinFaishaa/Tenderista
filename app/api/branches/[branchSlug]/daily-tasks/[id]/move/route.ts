import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { moveDailyTask, DailyTaskNotFoundError } from "@/lib/dailyTasks/queries";

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
  if (branch.role !== "owner" && branch.role !== "manager") {
    return NextResponse.json(
      { error: "Only the Owner or a Manager can reorder daily tasks." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const direction = body?.direction;
  if (direction !== "up" && direction !== "down") {
    return NextResponse.json({ error: "Invalid direction." }, { status: 400 });
  }

  try {
    await moveDailyTask(branch.id, session.userId, id, direction);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DailyTaskNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
