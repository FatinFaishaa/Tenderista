import { ChecklistItemForm } from "@/components/checklists/ChecklistItemForm";

export default async function NewChecklistItemPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add Checklist Item
      </h1>
      <ChecklistItemForm branchSlug={branchSlug} />
    </div>
  );
}
