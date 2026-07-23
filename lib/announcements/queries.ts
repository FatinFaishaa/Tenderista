import { withTenantContext } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type AnnouncementListItem = {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
};

/** Branch-specific, newest first. RLS (`announcements` tenant_isolation policy) already
 * scopes this to the active branch — branchId here just narrows the query itself. */
export async function listAnnouncements(
  branchId: string,
  userId: string
): Promise<AnnouncementListItem[]> {
  return withTenantContext({ userId, branchId }, async (tx: Prisma.TransactionClient) => {
    const rows = await tx.announcement.findMany({
      where: { branchId },
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { name: true } } },
    });

        return rows.map((row) => ({
      id: row.id,
      title: row.title,
      message: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdByName: row.creator.name,
    }));
  });
}


export async function getAnnouncementById(
  branchId: string,
  userId: string,
  id: string
): Promise<AnnouncementListItem | null> {
  return withTenantContext({ userId, branchId }, async (tx) => {
    const row = await tx.announcement.findFirst({
      where: { id, branchId },
      include: { creator: { select: { name: true } } },
    });
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      message: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdByName: row.creator.name,
    };
  });
}
