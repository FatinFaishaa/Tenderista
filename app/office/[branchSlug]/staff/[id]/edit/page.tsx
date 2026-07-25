import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getStaffById, getStaffPersonalInfo } from "@/lib/staff/queries";
import { StaffForm } from "@/components/staff/StaffForm";
import { StaffPersonalInfoCard } from "@/components/staff/StaffPersonalInfoCard";

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
  const personalInfo = await getStaffPersonalInfo(branch.id, session.userId, id);

  return (
    <div className="max-w-md space-y-6">
      <Link
        href={`/office/${branchSlug}/staff`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Staff
      </Link>

      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Staff</h1>

      <StaffPersonalInfoCard personalInfo={personalInfo} />

      <StaffForm
        branchSlug={branchSlug}
        staffId={staff.id}
        initialValues={{
          name: staff.name,
          email: staff.email ?? "",
          jobPosition: staff.jobPosition,
          department: staff.department,
          salaryType: staff.salaryType,
          hourlyRate: staff.hourlyRate,
          basicSalary: staff.basicSalary,
        }}
      />
    </div>
  );
}
