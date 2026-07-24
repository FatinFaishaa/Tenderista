import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { updateMyAvatarImage, InvalidAvatarImageError } from "@/lib/staff/queries";

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

  const body = await request.json().catch(() => null);
  const image = body?.image;
  if (typeof image !== "string") {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  try {
    await updateMyAvatarImage(branch.id, session.userId, image);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof InvalidAvatarImageError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
