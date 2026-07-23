import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { publishWeek } from "@/lib/roster/queries";
import { publishWeekSchema } from "@/lib/validation/roster";
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
    return NextResponse.json(
      { error: "Only the Owner can publish the roster." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = publishWeekSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid week." }, { status: 400 });
  }

  const result = await publishWeek(branch.id, session.userId, parseDateKey(parsed.data.weekStart));
  return NextResponse.json(result);
}
