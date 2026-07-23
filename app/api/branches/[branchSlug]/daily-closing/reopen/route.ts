import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { reopenDaySchema } from "@/lib/validation/closing";
import { reopenDay, DailyClosingNotFoundError } from "@/lib/closing/queries";

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
      { error: "Only the Owner can reopen a closed day." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = reopenDaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    await reopenDay(branch.id, session.userId, parsed.data.date, { reason: parsed.data.reason });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof DailyClosingNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
