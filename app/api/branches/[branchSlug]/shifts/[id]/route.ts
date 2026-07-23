import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { withTenantContext } from "@/lib/db";
import { shiftTemplateSchema } from "@/lib/validation/shift";
import { timeStringToDate } from "@/lib/utils/timeOfDay";

async function requireOwner(branchSlug: string) {
  const session = await getSession();
  if (!session.userId) {
    return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) } as const;
  }

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) {
    return { error: NextResponse.json({ error: "Branch not found." }, { status: 404 }) } as const;
  }
  if (branch.role !== "owner") {
    return {
      error: NextResponse.json(
        { error: "Only the Owner can manage shift templates." },
        { status: 403 }
      ),
    } as const;
  }

  return { userId: session.userId, branch } as const;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchSlug: string; id: string }> }
) {
  const { branchSlug, id } = await params;
  const auth = await requireOwner(branchSlug);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = shiftTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const result = await withTenantContext<{ count: number }>(
    { userId: auth.userId, branchId: auth.branch.id },
    (tx) =>
      tx.shift.updateMany({
        where: { id, branchId: auth.branch.id },
        data: {
          name: parsed.data.name,
          startTime: timeStringToDate(parsed.data.startTime),
          endTime: timeStringToDate(parsed.data.endTime),
        },
      })
  );

  if (result.count === 0) {
    return NextResponse.json({ error: "Shift template not found." }, { status: 404 });
  }

  return NextResponse.json({ id });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ branchSlug: string; id: string }> }
) {
  const { branchSlug, id } = await params;
  const auth = await requireOwner(branchSlug);
  if ("error" in auth) return auth.error;

  const result = await withTenantContext<{ count: number }>(
    { userId: auth.userId, branchId: auth.branch.id },
    (tx) => tx.shift.deleteMany({ where: { id, branchId: auth.branch.id } })
  );

  if (result.count === 0) {
    return NextResponse.json({ error: "Shift template not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
