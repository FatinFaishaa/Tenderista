import { withTenantContext } from "@/lib/db";

export type AccessibleBranch = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  role: "owner" | "manager" | "staff";
};

// Fixed display order for the branch selector (switcher + chooser page). Any branch
// not in this list falls back to alphabetical, appended after the ones that are.
const BRANCH_DISPLAY_ORDER = [
  "Tenderista Puncak Alam",
  "Tenderista Bandar Saujana Putra",
  "Tenderista Setia Alam",
];

function sortByDisplayOrder(branches: AccessibleBranch[]): AccessibleBranch[] {
  return [...branches].sort((a, b) => {
    const indexA = BRANCH_DISPLAY_ORDER.indexOf(a.name);
    const indexB = BRANCH_DISPLAY_ORDER.indexOf(b.name);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Every branch a user can enter, as Owner (via branch_owners) or Manager/Staff (via staff,
 * excluding disabled staff — a "disabled" Staff row must actually revoke access, not just
 * change a badge in the UI). Looking this up needs no branch context yet — that's exactly
 * why branch_owners/staff have a bespoke RLS policy allowing a user to see their own
 * membership rows regardless of app.current_branch_id (see the migration's RLS section).
 */
export async function getAccessibleBranches(userId: string): Promise<AccessibleBranch[]> {
  return withTenantContext({ userId }, async (tx) => {
    const [ownerRows, staffRows] = await Promise.all([
      tx.branchOwner.findMany({
        where: { userId },
        include: { branch: true },
      }),
      tx.staff.findMany({
        where: { userId, status: "active" },
        include: { branch: true },
      }),
    ]);

    const owned: AccessibleBranch[] = ownerRows.map((row) => ({
      id: row.branch.id,
      name: row.branch.name,
      slug: row.branch.slug,
      timezone: row.branch.timezone,
      role: "owner",
    }));

    const staffed: AccessibleBranch[] = staffRows.map((row) => ({
      id: row.branch.id,
      name: row.branch.name,
      slug: row.branch.slug,
      timezone: row.branch.timezone,
      role: row.role === "manager" ? "manager" : "staff",
    }));

    // A user could in principle own one branch and staff another — never both for the
    // same branch, so simple concatenation (not deduping by id) is correct here.
    return sortByDisplayOrder([...owned, ...staffed]);
  });
}

/**
 * Resolves a branch slug to its id + the requesting user's role there, or null if the
 * branch doesn't exist or the user has no access to it. Use this before setting
 * app.current_branch_id for any further request handling.
 */
export async function resolveBranchForUser(
  slug: string,
  userId: string
): Promise<AccessibleBranch | null> {
  const branches = await getAccessibleBranches(userId);
  return branches.find((b) => b.slug === slug) ?? null;
}
