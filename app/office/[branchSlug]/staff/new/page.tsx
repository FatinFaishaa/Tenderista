import { StaffForm } from "@/components/staff/StaffForm";

export default async function NewStaffPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add Staff
      </h1>
      <StaffForm branchSlug={branchSlug} />
    </div>
  );
}
