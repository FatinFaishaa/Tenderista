import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

// Runs as the migration/superuser connection (DATABASE_URL), NOT the RLS-restricted
// tenderista_app role — seeding initial data is a bootstrap operation with no logged-in
// session context to check RLS against, same as the login lookup functions.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Each branch has its own, distinct Owner — Owner stays a separate concept from
// Staff/Manager (tracked via branch_owners, never a Staff row).
const BRANCHES = [
  {
    slug: "puncak-alam",
    name: "Tenderista Puncak Alam",
    address: "Puncak Alam, Selangor",
    ownerName: "Hakim (Owner)",
    ownerEmail: "owner@tenderista.dev",
  },
  {
    slug: "bandar-saujana-putra",
    name: "Tenderista Bandar Saujana Putra",
    address: "Bandar Saujana Putra, Selangor",
    ownerName: "Haziq (Owner)",
    ownerEmail: "haziq@tenderista.dev",
  },
  {
    slug: "setia-alam",
    name: "Tenderista Setia Alam",
    address: "Setia Alam, Selangor",
    ownerName: "Mustafa (Owner)",
    ownerEmail: "mustafa@tenderista.dev",
  },
] as const;

async function main() {
  const admin = await prisma.platformAdmin.upsert({
    where: { email: "admin@tenderista.dev" },
    update: {},
    create: {
      name: "Tenderista HQ",
      email: "admin@tenderista.dev",
      passwordHash: await hashPassword("Admin123!"),
    },
  });

  const branchesBySlug = new Map<string, { id: string }>();

  for (const spec of BRANCHES) {
    const branch = await prisma.branch.upsert({
      where: { slug: spec.slug },
      update: {},
      create: {
        name: spec.name,
        slug: spec.slug,
        address: spec.address,
        createdBy: admin.id,
      },
    });
    branchesBySlug.set(spec.slug, branch);

    const owner = await prisma.user.upsert({
      where: { email: spec.ownerEmail },
      update: { name: spec.ownerName },
      create: {
        name: spec.ownerName,
        email: spec.ownerEmail,
        passwordHash: await hashPassword("Owner123!"),
      },
    });

    await prisma.branchOwner.upsert({
      where: { userId_branchId: { userId: owner.id, branchId: branch.id } },
      update: {},
      create: { userId: owner.id, branchId: branch.id },
    });

    // Self-correcting: remove any other owner previously linked to this branch
    // (this is exactly what fixes the earlier "Hakim owns every branch" data bug).
    await prisma.branchOwner.deleteMany({
      where: { branchId: branch.id, userId: { not: owner.id } },
    });
  }

  const branch = branchesBySlug.get("puncak-alam")!;

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@tenderista.dev" },
    update: {},
    create: {
      name: "Hafiz (Manager)",
      email: "manager@tenderista.dev",
      passwordHash: await hashPassword("Manager123!"),
    },
  });
  await prisma.staff.upsert({
    where: { branchId_userId: { branchId: branch.id, userId: managerUser.id } },
    update: {},
    create: {
      branchId: branch.id,
      userId: managerUser.id,
      role: "manager",
      jobPosition: "Branch Manager",
      startDate: new Date("2025-01-03"),
      salaryType: "monthly",
      basicSalary: 3200,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@tenderista.dev" },
    update: {},
    create: {
      name: "Wei Ling (Staff)",
      email: "staff@tenderista.dev",
      passwordHash: await hashPassword("Staff123!"),
    },
  });
  await prisma.staff.upsert({
    where: { branchId_userId: { branchId: branch.id, userId: staffUser.id } },
    update: {},
    create: {
      branchId: branch.id,
      userId: staffUser.id,
      role: "staff",
      jobPosition: "Cashier",
      startDate: new Date("2025-06-15"),
      salaryType: "hourly",
      hourlyRate: 9.5,
    },
  });

  // A modest default permission set — Owner can adjust freely later.
  const defaultManagerPermissions = [
    { module: "staff", action: "view" },
    { module: "staff", action: "edit" },
    { module: "attendance", action: "view" },
    { module: "attendance", action: "approve" },
  ];
  const defaultStaffPermissions = [{ module: "attendance", action: "view" }];

  for (const perm of defaultManagerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        branchId_role_module_action: {
          branchId: branch.id,
          role: "manager",
          module: perm.module,
          action: perm.action,
        },
      },
      update: {},
      create: { branchId: branch.id, role: "manager", ...perm, allowed: true },
    });
  }
  for (const perm of defaultStaffPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        branchId_role_module_action: {
          branchId: branch.id,
          role: "staff",
          module: perm.module,
          action: perm.action,
        },
      },
      update: {},
      create: { branchId: branch.id, role: "staff", ...perm, allowed: true },
    });
  }

  console.log("Seed complete:");
  console.log("  Platform Admin: admin@tenderista.dev / Admin123!");
  console.log("  Owner (Puncak Alam): owner@tenderista.dev / Owner123!");
  console.log("  Owner (Bandar Saujana Putra): haziq@tenderista.dev / Owner123!");
  console.log("  Owner (Setia Alam): mustafa@tenderista.dev / Owner123!");
  console.log("  Manager (Puncak Alam): manager@tenderista.dev / Manager123!");
  console.log("  Staff (Puncak Alam): staff@tenderista.dev / Staff123!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
