import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getStaffById } from "@/lib/staff/queries";
import { StaffForm } from "@/components/staff/StaffForm";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const staff = await getStaffById(branch.id, session.userId, id);
  if (!staff) notFound();

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Staff
      </h1>
      <StaffForm
        branchSlug={branchSlug}
        staffId={staff.id}
        initialValues={{
          name: staff.name,
          email: staff.email ?? "",
          jobPosition: staff.jobPosition,
          department: staff.department,
        }}
      />
    </div>
  );
}
