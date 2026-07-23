import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { assignScheduleCell, RosterError } from "@/lib/roster/queries";
import { rosterAssignmentSchema } from "@/lib/validation/roster";
import { parseDateKey } from "@/lib/utils/week";

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
    return NextResponse.json({ error: "Only the Owner can edit the roster." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = rosterAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    await assignScheduleCell(branch.id, session.userId, {
      staffId: parsed.data.staffId,
      date: parseDateKey(parsed.data.date),
      isOffDay: parsed.data.isOffDay,
      shiftId: parsed.data.isOffDay ? null : parsed.data.shiftId,
      startTime: parsed.data.isOffDay ? null : parsed.data.startTime,
      endTime: parsed.data.isOffDay ? null : parsed.data.endTime,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RosterError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
