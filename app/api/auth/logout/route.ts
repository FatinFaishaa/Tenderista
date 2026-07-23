import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  const session = await getSession();
  const wasAdmin = Boolean(session.platformAdminId);
  session.destroy();
  return NextResponse.json({ redirectTo: wasAdmin ? "/admin/login" : "/login" });
}
