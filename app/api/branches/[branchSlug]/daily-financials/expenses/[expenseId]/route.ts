import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { dailyExpenseSchema } from "@/lib/validation/financials";
import {
  updateDailyExpense,
  deleteDailyExpense,
  DailyExpenseNotFoundError,
} from "@/lib/financials/queries";

async function requireOwnerOrManager(branchSlug: string) {
  const session = await getSession();
  if (!session.userId) {
    return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) } as const;
  }

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) {
    return { error: NextResponse.json({ error: "Branch not found." }, { status: 404 }) } as const;
  }
  if (branch.role !== "owner" && branch.role !== "manager") {
    return {
      error: NextResponse.json(
        { error: "Only the Owner or a Manager can manage expenses." },
        { status: 403 }
      ),
    } as const;
  }

  return { userId: session.userId, branch } as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchSlug: string; expenseId: string }> }
) {
  const { branchSlug, expenseId } = await params;
  const auth = await requireOwnerOrManager(branchSlug);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = dailyExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    await updateDailyExpense(auth.branch.id, auth.userId, expenseId, parsed.data);
    return NextResponse.json({ id: expenseId });
  } catch (err) {
    if (err instanceof DailyExpenseNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ branchSlug: string; expenseId: string }> }
) {
  const { branchSlug, expenseId } = await params;
  const auth = await requireOwnerOrManager(branchSlug);
  if ("error" in auth) return auth.error;

  try {
    await deleteDailyExpense(auth.branch.id, auth.userId, expenseId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DailyExpenseNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
