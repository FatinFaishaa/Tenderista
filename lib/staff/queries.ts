import { withTenantContext } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import type { StaffCreateInput, StaffEditInput } from "@/lib/validation/staff";
import type { ChecklistDepartmentValue } from "@/lib/validation/checklist";

export type StaffListItem = {
  id: string;
  name: string;
  email: string | null;
  jobPosition: string;
  department: string | null;
  status: "active" | "inactive";
};

/**
 * The caller's own department at this branch — null if they have no Staff row here
 * (e.g. the Owner, who isn't a Staff row at all) or if a department was never set on
 * their record. Used to scope the staff-facing checklist views/toggles to "their
 * department only" — Owner/Manager access is unaffected by this (see call sites).
 */
export async function getMyDepartment(
  branchId: string,
  userId: string
): Promise<ChecklistDepartmentValue | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const staff = await tx.staff.findUnique({
      where: { branchId_userId: { branchId, userId } },
      select: { department: true },
    });
    return staff?.department ?? null;
  });
}

export async function listStaffForBranch(
  branchId: string,
  userId: string
): Promise<StaffListItem[]> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const rows = await tx.staff.findMany({
      where: { branchId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.user.name,
      email: row.user.email,
      jobPosition: row.jobPosition,
      department: row.department,
      status: row.status,
    }));
  });
}

export type StaffDetail = StaffListItem;

export async function getStaffById(
  branchId: string,
  userId: string,
  id: string
): Promise<StaffDetail | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const row = await tx.staff.findFirst({
      where: { id, branchId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.user.name,
      email: row.user.email,
      jobPosition: row.jobPosition,
      department: row.department,
      status: row.status,
    };
  });
}

export class StaffMutationError extends Error {}

/**
 * Creates a new staff member. If the email already belongs to an existing user
 * (e.g. they're staff or an owner elsewhere), that identity is reused rather than
 * creating a duplicate account — a fresh User row (with the submitted password) is
 * only created when no account with that email exists yet.
 */
export async function createStaffMember(
  branchId: string,
  actingUserId: string,
  input: StaffCreateInput
): Promise<{ id: string }> {
  return withTenantContext({ userId: actingUserId, branchId }, async (tx) => {
    // Plain `tx.user.findUnique`/`.create`/`.update` are RLS-blocked here: the users
    // table's policy only ever allows a session to see/write ITS OWN row. Finding a
    // brand-new hire by email (who shares no branch with the Owner yet) and creating
    // or updating their row on the Owner's behalf both need to bypass that — hence
    // the app_find_user_by_email / app_create_user / app_update_user_profile
    // SECURITY DEFINER functions (see migration 20260722074452), same pattern as the
    // pre-auth login lookup.
    const found = await tx.$queryRaw<{ id: string; name: string }[]>`
      SELECT * FROM app_find_user_by_email(${input.email})
    `;
    let userId: string;

    if (found[0]) {
      userId = found[0].id;

      const isOwnerHere = await tx.branchOwner.findFirst({
        where: { branchId, userId },
      });
      if (isOwnerHere) {
        throw new StaffMutationError("This person is already the Owner of this branch.");
      }

      const existingStaff = await tx.staff.findUnique({
        where: { branchId_userId: { branchId, userId } },
      });
      if (existingStaff) {
        throw new StaffMutationError("This person is already a staff member at this branch.");
      }

      if (found[0].name !== input.name) {
        await tx.$executeRaw`SELECT app_update_user_profile(${userId}::uuid, ${input.name}, ${input.email})`;
      }
    } else {
      if (!input.password) {
        throw new StaffMutationError(
          "Set an initial password — this email doesn't have an account yet."
        );
      }
      const passwordHash = await hashPassword(input.password);
      const created = await tx.$queryRaw<{ app_create_user: string }[]>`
        SELECT app_create_user(${input.name}, ${input.email}, ${passwordHash})
      `;
      userId = created[0].app_create_user;
    }

    const staff = await tx.staff.create({
      data: {
        branchId,
        userId,
        role: "staff",
        jobPosition: input.jobPosition,
        department: input.department,
        startDate: new Date(),
        salaryType: "hourly",
        hourlyRate: 0, // placeholder — payroll module sets real rates
      },
    });

    return { id: staff.id };
  });
}

export async function updateStaffMember(
  branchId: string,
  actingUserId: string,
  staffId: string,
  input: StaffEditInput
): Promise<void> {
  await withTenantContext({ userId: actingUserId, branchId }, async (tx) => {
    const staff = await tx.staff.findFirst({ where: { id: staffId, branchId } });
    if (!staff) throw new StaffMutationError("Staff member not found.");

    // Same RLS bypass as createStaffMember — see the note there.
    const emailOwner = await tx.$queryRaw<{ id: string; name: string }[]>`
      SELECT * FROM app_find_user_by_email(${input.email})
    `;
    if (emailOwner[0] && emailOwner[0].id !== staff.userId) {
      throw new StaffMutationError("That email is already used by another account.");
    }

    await tx.$executeRaw`SELECT app_update_user_profile(${staff.userId}::uuid, ${input.name}, ${input.email})`;

    await tx.staff.update({
      where: { id: staffId },
      data: { jobPosition: input.jobPosition, department: input.department },
    });
  });
}

export async function setStaffStatus(
  branchId: string,
  actingUserId: string,
  staffId: string,
  status: "active" | "inactive"
): Promise<void> {
  await withTenantContext({ userId: actingUserId, branchId }, async (tx) => {
    const result = await tx.staff.updateMany({
      where: { id: staffId, branchId },
      data: { status },
    });
    if (result.count === 0) throw new StaffMutationError("Staff member not found.");
  });
}

const AVATAR_EMOJI_OPTIONS = [
  "😊", "😎", "🧑‍🍳", "👨‍🍳", "👩‍🍳", "🧑‍💼", "💪", "⭐",
  "🔥", "☕", "🍗", "🐔", "😺", "🐱", "🦁", "🐯",
] as const;

export type MyProfile = { name: string; avatarEmoji: string };

/** The caller's own display name and chosen avatar emoji — used in the Home page
 * greeting header and the Account page's emoji picker. Falls back to the schema
 * default if somehow null (existing rows created before this column existed get the
 * default via Prisma's @default, so this is mostly a type-safety fallback). */
export async function getMyProfile(branchId: string, userId: string): Promise<MyProfile> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { name: true, avatarEmoji: true },
    });
    return { name: user?.name ?? "", avatarEmoji: user?.avatarEmoji ?? "😊" };
  });
}

export class InvalidAvatarEmojiError extends Error {}

export async function updateMyAvatarEmoji(
  branchId: string,
  userId: string,
  emoji: string
): Promise<void> {
  if (!AVATAR_EMOJI_OPTIONS.includes(emoji as (typeof AVATAR_EMOJI_OPTIONS)[number])) {
    throw new InvalidAvatarEmojiError("Not a valid avatar option.");
  }
  await withTenantContext({ userId, branchId }, async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { avatarEmoji: emoji } });
  });
}

export function getAvatarEmojiOptions(): readonly string[] {
  return AVATAR_EMOJI_OPTIONS;
}
