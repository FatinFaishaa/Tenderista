import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { branchPartnerCreateSchema } from "@/lib/validation/branchPartner";
import { createBranchPartner, BranchPartnerMutationError } from "@/lib/branchPartners/queries";

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
  // Only the original/primary Owner can add a Partner Cawangan — a Partner
  // themselves must not be able to add further partners or, indirectly, remove
  // the primary Owner's own access.
  if (branch.role !== "owner" || !branch.isPrimaryOwner) {
    return NextResponse.json(
      { error: "Only the primary Owner can add a Partner Cawangan." },
      { status: 403 }
    );
  }
  const body = await request.json().catch(() => null);
  const parsed = branchPartnerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  try {
    const result = await createBranchPartner(branch.id, session.userId, parsed.data);
    return NextResponse.json({ id: result.id });
  } catch (err) {
    if (err instanceof BranchPartnerMutationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
