import { withTenantContext } from "@/lib/db";

export type BranchRole = "owner" | "manager" | "staff";

/**
 * Owner always has full access within their own branch — role_permissions only
 * ever holds rows for 'manager' and 'staff', and an Owner is never represented
 * there (see docs/DATABASE_SCHEMA.md, role_permissions notes).
 */
export async function hasPermission(
  branchId: string,
  userId: string,
  role: BranchRole,
  module: string,
  action: string
): Promise<boolean> {
  if (role === "owner") return true;

  return withTenantContext({ userId, branchId }, async (tx) => {
    const row = await tx.rolePermission.findFirst({
      where: { branchId, role, module, action },
    });
    return row?.allowed ?? false;
  });
}
