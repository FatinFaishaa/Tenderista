import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAccessibleBranches } from "@/lib/tenancy/branch";
import { resolvePostLoginDestination } from "@/lib/tenancy/destination";

export default async function RootPage() {
  const session = await getSession();

  if (session.platformAdminId) {
    redirect("/admin");
  }

  if (session.userId) {
    const branches = await getAccessibleBranches(session.userId);
    redirect(resolvePostLoginDestination(branches));
  }

  redirect("/login");
}
