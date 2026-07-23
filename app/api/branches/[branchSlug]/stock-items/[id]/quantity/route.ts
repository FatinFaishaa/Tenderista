import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { stockQuantitySchema } from "@/lib/validation/stock";
import { updateStockQuantity, StockItemNotFoundError } from "@/lib/inventory/queries";

// Any branch member — Owner, Manager, or Staff — may update the current balance.
// Item management (name/unit/minAlertLevel/active status) stays Owner-only and
// lives on the other stock-items routes.
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

  const body = await request.json().catch(() => null);
  const parsed = stockQuantitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  try {
    await updateStockQuantity(branch.id, session.userId, id, parsed.data.currentQuantity);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StockItemNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
