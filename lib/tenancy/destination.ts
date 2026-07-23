import type { AccessibleBranch } from "@/lib/tenancy/branch";

/**
 * Where to send someone right after login — skips the branch chooser entirely
 * when there's only one place they could go (low-tap: don't make a single-branch
 * Owner or Staff member pick from a list of one).
 */
export function resolvePostLoginDestination(branches: AccessibleBranch[]): string {
  if (branches.length === 0) return "/no-access";
  if (branches.length === 1) {
    const branch = branches[0];
    return branch.role === "staff" ? `/${branch.slug}` : `/office/${branch.slug}/dashboard`;
  }
  return "/branches";
}
