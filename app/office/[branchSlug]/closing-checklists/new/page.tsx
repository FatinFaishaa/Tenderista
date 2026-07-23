import { ClosingChecklistItemForm } from "@/components/closingChecklists/ClosingChecklistItemForm";

export default async function NewClosingChecklistItemPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add Closing Checklist Item
      </h1>
      <ClosingChecklistItemForm branchSlug={branchSlug} />
    </div>
  );
}
