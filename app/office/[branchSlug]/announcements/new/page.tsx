import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";

export default async function NewAnnouncementPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        New Announcement
      </h1>
      <AnnouncementForm branchSlug={branchSlug} />
    </div>
  );
}
