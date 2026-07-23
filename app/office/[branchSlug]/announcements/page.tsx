import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listAnnouncements } from "@/lib/announcements/queries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteAnnouncementButton } from "@/components/announcements/DeleteAnnouncementButton";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AnnouncementsPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const announcements = await listAnnouncements(branch.id, session.userId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Announcements
        </h1>
        <Link href={`/office/${branchSlug}/announcements/new`}>
          <Button>+ New Announcement</Button>
        </Link>
      </div>

      {announcements.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No announcements yet. Post one to let your team know what&apos;s new.
        </p>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{a.title}</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {a.message}
                </p>
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                  Posted by {a.createdByName} · {formatDateTime(a.createdAt)}
                  {a.updatedAt.getTime() !== a.createdAt.getTime() &&
                    ` · edited ${formatDateTime(a.updatedAt)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link href={`/office/${branchSlug}/announcements/${a.id}/edit`}>
                  <Button variant="secondary" className="px-3 py-1.5 text-sm">
                    Edit
                  </Button>
                </Link>
                <DeleteAnnouncementButton branchSlug={branchSlug} announcementId={a.id} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
