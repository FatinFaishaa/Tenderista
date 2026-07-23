import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getSopById } from "@/lib/sops/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function StaffSopDetailPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const sop = await getSopById(branch.id, session.userId, id);
  if (!sop) notFound();

  return (
    <div>
      <Link
        href={`/${branchSlug}/sops`}
        className="mb-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to SOPs
      </Link>
      <Card>
        <Badge>{sop.categoryName}</Badge>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {sop.title}
        </h1>
        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
          {sop.content}
        </p>
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          {formatDateTime(sop.updatedAt)}
        </p>
      </Card>
    </div>
  );
}
