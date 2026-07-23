import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { withTenantContext } from "@/lib/db";
import { sopSchema } from "@/lib/validation/sop";

async function requireOwnerOrManager(branchSlug: string) {
  const session = await getSession();
  if (!session.userId) {
    return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) } as const;
  }

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) {
    return { error: NextResponse.json({ error: "Branch not found." }, { status: 404 }) } as const;
  }
  if (branch.role !== "owner" && branch.role !== "manager") {
    return {
      error: NextResponse.json(
        { error: "Only the Owner or a Manager can manage SOPs." },
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
  const auth = await requireOwnerOrManager(branchSlug);
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = sopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const result = await withTenantContext(
    { userId: auth.userId, branchId: auth.branch.id },
    async (tx) => {
      const category = await tx.sopCategory.upsert({
        where: { branchId_name: { branchId: auth.branch.id, name: parsed.data.category } },
        update: {},
        create: { branchId: auth.branch.id, name: parsed.data.category },
      });

      return tx.sop.updateMany({
        where: { id, branchId: auth.branch.id },
        data: {
          title: parsed.data.title,
          content: parsed.data.content,
          categoryId: category.id,
        },
      });
    }
  );

  if (result.count === 0) {
    return NextResponse.json({ error: "SOP not found." }, { status: 404 });
  }

  return NextResponse.json({ id });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ branchSlug: string; id: string }> }
) {
  const { branchSlug, id } = await params;
  const auth = await requireOwnerOrManager(branchSlug);
  if ("error" in auth) return auth.error;

  const result = await withTenantContext(
    { userId: auth.userId, branchId: auth.branch.id },
    (tx) => tx.sop.deleteMany({ where: { id, branchId: auth.branch.id } })
  );

  if (result.count === 0) {
    return NextResponse.json({ error: "SOP not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
