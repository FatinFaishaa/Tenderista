import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.platformAdminId) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
