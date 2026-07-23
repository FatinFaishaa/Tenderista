import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getSopById } from "@/lib/sops/queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteSopButton } from "@/components/sops/DeleteSopButton";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function SopDetailPage({
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
    <div className="max-w-2xl">
      <Link
        href={`/office/${branchSlug}/sops`}
        className="mb-4 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        ← Back to SOPs
      </Link>
      <Card>
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <Badge>{sop.categoryName}</Badge>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {sop.title}
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href={`/office/${branchSlug}/sops/${sop.id}/edit`}>
              <Button variant="secondary" className="px-3 py-1.5 text-sm">
                Edit
              </Button>
            </Link>
            <DeleteSopButton branchSlug={branchSlug} sopId={sop.id} />
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
          {sop.content}
        </p>
        <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
          Created by {sop.createdByName} · {formatDateTime(sop.createdAt)}
          {sop.updatedAt.getTime() !== sop.createdAt.getTime() &&
            ` · edited ${formatDateTime(sop.updatedAt)}`}
        </p>
      </Card>
    </div>
  );
}
