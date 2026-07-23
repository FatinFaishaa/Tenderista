import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { setStockItemStatus, StockItemNotFoundError } from "@/lib/inventory/queries";

export async function POST(
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
      { error: "Only the Owner can activate or deactivate stock items." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const isActive = body?.isActive;
  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  try {
    await setStockItemStatus(branch.id, session.userId, id, isActive);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof StockItemNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
