import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { withTenantContext } from "@/lib/db";
import { announcementSchema } from "@/lib/validation/announcement";

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
      { error: "Only the Owner or a Manager can post announcements." },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const announcement = await withTenantContext(
    { userId: session.userId, branchId: branch.id },
    (tx) =>
      tx.announcement.create({
        data: {
          branchId: branch.id,
          title: parsed.data.title,
          body: parsed.data.message,
          createdBy: session.userId!,
          targetType: "branch",
        },
      })
  );

  return NextResponse.json({ id: announcement.id });
}
