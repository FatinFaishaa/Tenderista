import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "@prisma/client";

// This client connects as the least-privilege `tenderista_app` role created by the
// initial migration (see prisma/migrations/*_init/migration.sql), NOT the superuser
// used for migrations/seeding. Row-Level Security only takes effect for non-superuser,
// non-table-owner roles, so this separation is required for RLS to mean anything.
const connectionString = process.env.APP_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "APP_DATABASE_URL is not set. This must point at the tenderista_app role, not the migration/superuser connection."
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** The session identity a request is acting as — at most one of userId / platformAdminId is set. */
export type TenantContext = {
  userId?: string;
  branchId?: string;
  platformAdminId?: string;
};

/**
 * Runs `fn` inside a transaction with the Postgres session variables that every
 * Row-Level Security policy checks (`app.current_user_id`, `app.current_branch_id`,
 * `app.current_platform_admin_id`) set via SET LOCAL — scoped to this transaction only,
 * so concurrent requests on the same pooled connection never leak context.
 *
 * Every request that reads or writes tenant data must go through this — never query
 * `prisma` directly for branch-scoped tables, or RLS has no session context to check
 * against and every row will be denied.
 */
export async function withTenantContext<T>(
  context: TenantContext,
  fn: (tx: Prisma.TransactionClient) => T | PromiseLike<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT set_config('app.current_user_id', $1, true), set_config('app.current_branch_id', $2, true), set_config('app.current_platform_admin_id', $3, true)`,
      context.userId ?? "",
      context.branchId ?? "",
      context.platformAdminId ?? ""
    );
    return await fn(tx);
  });
}
