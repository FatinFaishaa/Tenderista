import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { withTenantContext } from "@/lib/db";
import { sopSchema } from "@/lib/validation/sop";

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
      { error: "Only the Owner or a Manager can create SOPs." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = sopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const sop = await withTenantContext(
    { userId: session.userId, branchId: branch.id },
    async (tx) => {
      const category = await tx.sopCategory.upsert({
        where: { branchId_name: { branchId: branch.id, name: parsed.data.category } },
        update: {},
        create: { branchId: branch.id, name: parsed.data.category },
      });

      return tx.sop.create({
        data: {
          branchId: branch.id,
          categoryId: category.id,
          title: parsed.data.title,
          content: parsed.data.content,
          createdBy: session.userId!,
        },
      });
    }
  );

  return NextResponse.json({ id: sop.id });
}
