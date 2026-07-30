import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { stockCategorySchema } from "@/lib/validation/stockCategory";
import {
  renameStockCategory,
  StockCategoryNotFoundError,
  StockCategoryNameConflictError,
} from "@/lib/stockCategories/queries";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ branchSlug: string; id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { branchSlug, id } = await params;
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) {
    return NextResponse.json({ error: "Branch not found." }, { status: 404 });
  }
  if (branch.role !== "owner") {
    return NextResponse.json(
      { error: "Only the Owner can rename an Inventory folder." },
      { status: 403 }
    );
  }
  const body = await request.json().catch(() => null);
  const parsed = stockCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  try {
    await renameStockCategory(branch.id, session.userId, id, parsed.data.name);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StockCategoryNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof StockCategoryNameConflictError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
