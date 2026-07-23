import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAccessibleBranches } from "@/lib/tenancy/branch";
import { BackofficeShell } from "@/components/layout/BackofficeShell";

export default async function OfficeBranchLayout({
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
  // Staff don't get a back-office — send them to their own app instead.
  if (branch.role === "staff") redirect(`/${branchSlug}`);

  return (
    <BackofficeShell
      branchSlug={branch.slug}
      branchName={branch.name}
      accessibleBranches={branches}
    >
      {children}
    </BackofficeShell>
  );
}
