import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { stockItemCreateSchema } from "@/lib/validation/stock";
import { createStockItem, StockItemNameConflictError } from "@/lib/inventory/queries";

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
      { error: "Only the Owner can manage stock items." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = stockItemCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    const item = await createStockItem(branch.id, session.userId, parsed.data);
    return NextResponse.json({ id: item.id });
  } catch (err) {
    if (err instanceof StockItemNameConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
