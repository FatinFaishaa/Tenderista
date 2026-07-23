import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listAnnouncements } from "@/lib/announcements/queries";
import { Card } from "@/components/ui/Card";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function StaffAnnouncementsPage({
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
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Announcements
      </h1>

      {announcements.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No announcements yet.</p>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">{a.title}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
              {a.message}
            </p>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              {a.createdByName} · {formatDateTime(a.createdAt)}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
