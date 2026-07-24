import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listSopCategoriesWithCount, getSopCategoryEmoji } from "@/lib/sops/queries";

export default async function StaffSopsPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  const categories = await listSopCategoriesWithCount(branch.id, session.userId);

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">📖 SOP</h1>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">Pilih kategori SOP</p>

      {categories.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Tiada SOP lagi.</p>
      )}

      <div className="space-y-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/${branchSlug}/sops/category/${category.id}`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-cream text-3xl dark:bg-zinc-800">
              {getSopCategoryEmoji(category.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-zinc-900 dark:text-zinc-50">{category.name}</p>
              {category.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {category.description}
                </p>
              )}
              <span className="mt-1.5 inline-block rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-brand-maroon dark:bg-pink-950 dark:text-red-400">
                {category.sopCount} SOP
              </span>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-brand-maroon" />
          </Link>
        ))}
      </div>
    </div>
  );
}
