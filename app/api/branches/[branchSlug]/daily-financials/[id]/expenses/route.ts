import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { dailyExpenseSchema } from "@/lib/validation/financials";
import { addDailyExpense, DailyFinancialRecordNotFoundError } from "@/lib/financials/queries";

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
      { error: "Only the Owner or a Manager can manage expenses." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = dailyExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const expense = await addDailyExpense(branch.id, session.userId, id, parsed.data);
    return NextResponse.json({ id: expense.id });
  } catch (err) {
    if (err instanceof DailyFinancialRecordNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
