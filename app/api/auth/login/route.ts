import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { authenticateUser } from "@/lib/auth/authenticate";
import { getSession } from "@/lib/auth/session";
import { getAccessibleBranches } from "@/lib/tenancy/branch";
import { resolvePostLoginDestination } from "@/lib/tenancy/destination";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email/phone and password." }, { status: 400 });
  }

  const user = await authenticateUser(parsed.data.identifier, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Incorrect email/phone or password." }, { status: 401 });
  }

  const branches = await getAccessibleBranches(user.id);
  if (branches.length === 0) {
    return NextResponse.json(
      { error: "Your account isn't linked to any branch yet. Contact your Owner." },
      { status: 403 }
    );
  }

  const session = await getSession();
  session.userId = user.id;
  session.platformAdminId = undefined;
  session.activeBranchId = branches.length === 1 ? branches[0].id : undefined;
  await session.save();

  return NextResponse.json({ redirectTo: resolvePostLoginDestination(branches) });
}
