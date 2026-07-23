import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getAnnouncementById } from "@/lib/announcements/queries";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const announcement = await getAnnouncementById(branch.id, session.userId, id);
  if (!announcement) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Announcement
      </h1>
      <AnnouncementForm
        branchSlug={branchSlug}
        announcementId={announcement.id}
        initialValues={{ title: announcement.title, message: announcement.message }}
      />
    </div>
  );
}
