import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { deleteBranchPartner, BranchPartnerMutationError } from "@/lib/branchPartners/queries";

export async function DELETE(
  _request: Request,
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
  if (branch.role !== "owner" || !branch.isPrimaryOwner) {
    return NextResponse.json(
      { error: "Only the primary Owner can remove a Partner Cawangan." },
      { status: 403 }
    );
  }
  try {
    await deleteBranchPartner(branch.id, session.userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof BranchPartnerMutationError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
