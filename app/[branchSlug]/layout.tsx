import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAccessibleBranches } from "@/lib/tenancy/branch";
import { StaffShell } from "@/components/layout/StaffShell";

export default async function StaffBranchLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branches = await getAccessibleBranches(session.userId);
  const branch = branches.find((b) => b.slug === branchSlug);

  if (!branch) redirect("/branches");

  return (
    <StaffShell branchSlug={branch.slug} branchName={branch.name}>
      {children}
    </StaffShell>
  );
}
