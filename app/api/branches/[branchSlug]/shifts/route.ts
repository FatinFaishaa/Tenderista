import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { withTenantContext } from "@/lib/db";
import { shiftTemplateSchema } from "@/lib/validation/shift";
import { timeStringToDate } from "@/lib/utils/timeOfDay";

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
      { error: "Only the Owner can manage shift templates." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = shiftTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const shift = await withTenantContext(
    { userId: session.userId, branchId: branch.id },
    (tx) =>
      tx.shift.create({
        data: {
          branchId: branch.id,
          name: parsed.data.name,
          startTime: timeStringToDate(parsed.data.startTime),
          endTime: timeStringToDate(parsed.data.endTime),
        },
      })
  );

  return NextResponse.json({ id: shift.id });
}
