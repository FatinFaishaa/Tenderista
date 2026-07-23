import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validation/auth";
import { authenticatePlatformAdmin } from "@/lib/auth/authenticate";
import { getSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const admin = await authenticatePlatformAdmin(parsed.data.email, parsed.data.password);
  if (!admin) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const session = await getSession();
  session.platformAdminId = admin.id;
  session.userId = undefined;
  session.activeBranchId = undefined;
  await session.save();

  return NextResponse.json({ redirectTo: "/admin" });
}
