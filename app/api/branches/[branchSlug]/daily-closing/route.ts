import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { closeDaySchema } from "@/lib/validation/closing";
import { closeDay, DailyClosingNoRecordError } from "@/lib/closing/queries";

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
      { error: "Only the Owner or a Manager can close a day." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = closeDaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const closing = await closeDay(branch.id, session.userId, parsed.data.date, {
      notes: parsed.data.notes,
    });
    return NextResponse.json({ id: closing.id });
  } catch (err) {
    if (err instanceof DailyClosingNoRecordError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
