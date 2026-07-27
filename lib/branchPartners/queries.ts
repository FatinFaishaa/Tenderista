import { withTenantContext } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { BranchPartnerCreateInput } from "@/lib/validation/branchPartner";

export type BranchPartnerRow = {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
};

export class BranchPartnerMutationError extends Error {}

/** Every "Partner Cawangan" (non-primary BranchOwner) on this branch — excludes the
 * primary Owner row itself, since that's not something added/removed through this
 * feature. */
export async function listBranchPartners(
  branchId: string,
  userId: string
): Promise<BranchPartnerRow[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const rows = await tx.branchOwner.findMany({
      where: { branchId, isPrimaryOwner: false },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.user.name,
      email: row.user.email,
      createdAt: row.createdAt,
    }));
  });
}

/**
 * Creates a Partner Cawangan — a second BranchOwner row (isPrimaryOwner: false) for
 * this one branch, giving that person full Owner-level access within it. Reuses the
 * same RLS-bypass pattern as createStaffMember (see the note there): if the email
 * already belongs to an existing user, that identity is reused rather than creating
 * a duplicate account.
 */
export async function createBranchPartner(
  branchId: string,
  actingUserId: string,
  input: BranchPartnerCreateInput
): Promise<{ id: string }> {
  return withTenantContext({ userId: actingUserId, branchId }, async (tx) => {
    const found = await tx.$queryRaw<{ id: string; name: string }[]>`
      SELECT * FROM app_find_user_by_email(${input.email})
    `;
    let userId: string;

    if (found[0]) {
      userId = found[0].id;

      const existingOwner = await tx.branchOwner.findUnique({
        where: { userId_branchId: { userId, branchId } },
      });
      if (existingOwner) {
        throw new BranchPartnerMutationError(
          "This person is already an Owner/Partner of this branch."
        );
      }

      if (found[0].name !== input.name) {
        await tx.$executeRaw`SELECT app_update_user_profile(${userId}::uuid, ${input.name}, ${input.email})`;
      }
    } else {
      if (!input.password) {
        throw new BranchPartnerMutationError(
          "Set an initial password — this email doesn't have an account yet."
        );
      }
      const passwordHash = await hashPassword(input.password);
      const created = await tx.$queryRaw<{ app_create_user: string }[]>`
        SELECT app_create_user(${input.name}, ${input.email}, ${passwordHash})
      `;
      userId = created[0].app_create_user;
    }

    const owner = await tx.branchOwner.create({
      data: {
        branchId,
        userId,
        isPrimaryOwner: false,
      },
    });

    return { id: owner.id };
  });
}

/** Removes a Partner Cawangan's access to this branch — deletes their BranchOwner
 * row only (never touches the User account itself, since they may have access
 * elsewhere). Scoped to isPrimaryOwner: false so this can never delete the primary
 * Owner's own row, even if called incorrectly. */
export async function deleteBranchPartner(
  branchId: string,
  userId: string,
  partnerId: string
): Promise<void> {
  const result = await withTenantContext({ userId, branchId }, (tx) =>
    tx.branchOwner.deleteMany({
      where: { id: partnerId, branchId, isPrimaryOwner: false },
    })
  );
  if (result.count === 0) {
    throw new BranchPartnerMutationError("Partner not found.");
  }
}
