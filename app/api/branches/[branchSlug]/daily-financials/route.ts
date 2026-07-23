import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { dailyFinancialRecordSchema } from "@/lib/validation/financials";
import { createDailyFinancialRecord, DailyFinancialRecordExistsError } from "@/lib/financials/queries";

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
  if (branch.role !== "owner" && branch.role !== "manager") {
    return NextResponse.json(
      { error: "Only the Owner or a Manager can manage financial records." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = dailyFinancialRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const record = await createDailyFinancialRecord(branch.id, session.userId, parsed.data);
    return NextResponse.json({ id: record.id });
  } catch (err) {
    if (err instanceof DailyFinancialRecordExistsError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
