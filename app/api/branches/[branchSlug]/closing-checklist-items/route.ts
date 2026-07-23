import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { withTenantContext } from "@/lib/db";
import { checklistItemSchema } from "@/lib/validation/checklist";

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
      { error: "Only the Owner or a Manager can edit checklist templates." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checklistItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const item = await withTenantContext(
    { userId: session.userId, branchId: branch.id },
    async (tx) => {
      const last = await tx.closingChecklistItem.findFirst({
        where: { branchId: branch.id, department: parsed.data.department },
        orderBy: { sortOrder: "desc" },
      });

      return tx.closingChecklistItem.create({
        data: {
          branchId: branch.id,
          title: parsed.data.title,
          department: parsed.data.department,
          sortOrder: (last?.sortOrder ?? -1) + 1,
          createdBy: session.userId!,
        },
      });
    }
  );

  return NextResponse.json({ id: item.id });
}
