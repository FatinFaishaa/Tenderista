import { withTenantContext } from "@/lib/db";

/** All branches, for the Platform Admin portal. The branches RLS policy grants a
 * Platform Admin session unconditional read access to this table (branch metadata
 * isn't "operational data" requiring a support grant — provisioning is their job). */
export async function listAllBranchesForPlatformAdmin(platformAdminId: string) {
  return withTenantContext({ platformAdminId }, (tx) =>
    tx.branch.findMany({ orderBy: { createdAt: "desc" } })
  );
}
