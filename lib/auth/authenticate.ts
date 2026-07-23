import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";

type AuthLookupRow = { id: string; password_hash: string; status: string };

/**
 * Looks up a branch user (Owner/Manager/Staff) by email or phone and verifies the
 * password. Uses the `app_authenticate_user_lookup` SECURITY DEFINER function since
 * this necessarily runs before any session context exists for the users RLS policy
 * to check against.
 */
export async function authenticateUser(identifier: string, password: string) {
  const rows = await prisma.$queryRaw<AuthLookupRow[]>`
    SELECT * FROM app_authenticate_user_lookup(${identifier})
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.status !== "active") return null;

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return null;

  return { id: row.id };
}

export async function authenticatePlatformAdmin(email: string, password: string) {
  const rows = await prisma.$queryRaw<AuthLookupRow[]>`
    SELECT * FROM app_authenticate_admin_lookup(${email})
  `;
  const row = rows[0];
  if (!row) return null;
  if (row.status !== "active") return null;

  const valid = await verifyPassword(password, row.password_hash);
  if (!valid) return null;

  return { id: row.id };
}
