import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getSopCategoryWithSops, getSopCategoryEmoji } from "@/lib/sops/queries";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function SopCategoryDetailPage({
  params,
}: {
  params: Promise<{ branchSlug: string; categoryId: string }>;
}) {
  const { branchSlug, categoryId } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  const category = await getSopCategoryWithSops(branch.id, session.userId, categoryId);
  if (!category) notFound();

  return (
    <div>
      <Link
        href={`/${branchSlug}/sops`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Kategori
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-cream text-3xl dark:bg-zinc-800">
          {getSopCategoryEmoji(category.name)}
        </span>
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{category.name}</h1>
          {category.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{category.description}</p>
          )}
        </div>
      </div>

      {category.sops.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tiada SOP dalam kategori ini.</p>
      ) : (
        <div className="space-y-2">
          {category.sops.map((sop) => (
            <Link
              key={sop.id}
              href={`/${branchSlug}/sops/${sop.id}`}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800">
                <FileText className="h-4 w-4 text-brand-maroon" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
                  {sop.title}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Dikemaskini {formatDate(sop.updatedAt)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
