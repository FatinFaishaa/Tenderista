import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getStaffById, getStaffPersonalInfo } from "@/lib/staff/queries";
import { DEPARTMENT_LABELS } from "@/lib/validation/checklist";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StaffPersonalInfoCard } from "@/components/staff/StaffPersonalInfoCard";

const SALARY_TYPE_LABELS: Record<string, string> = {
  monthly: "Full-time (Monthly)",
  hourly: "Part-time (Hourly)",
};

export default async function StaffDetailsPage({
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

  const employmentRows = [
    { label: "Job Position", value: staff.jobPosition },
    {
      label: "Department",
      value: staff.department
        ? DEPARTMENT_LABELS[staff.department as keyof typeof DEPARTMENT_LABELS]
        : "—",
    },
    { label: "Employment Type", value: SALARY_TYPE_LABELS[staff.salaryType] },
    {
      label: staff.salaryType === "hourly" ? "Hourly Rate" : "Monthly Salary",
      value:
        staff.salaryType === "hourly"
          ? staff.hourlyRate != null
            ? `RM${staff.hourlyRate.toFixed(2)}/hr`
            : "—"
          : staff.basicSalary != null
            ? `RM${staff.basicSalary.toFixed(2)}/month`
            : "—",
    },
  ];

  return (
    <div className="max-w-md space-y-6">
      <Link
        href={`/office/${branchSlug}/staff`}
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Staff
      </Link>

      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {staff.name}
          </h1>
          {staff.email && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{staff.email}</p>
          )}
        </div>
        <Badge tone={staff.status === "active" ? "success" : "neutral"} className="shrink-0">
          {staff.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Employment</p>
        </div>
        {employmentRows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between gap-3 px-4 py-3 ${
              i !== employmentRows.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""
            }`}
          >
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{row.label}</span>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <StaffPersonalInfoCard personalInfo={personalInfo} />

      <Link href={`/office/${branchSlug}/staff/${staff.id}/edit`}>
        <Button className="flex w-full items-center justify-center gap-2">
          <Pencil className="h-4 w-4" /> Edit Staff
        </Button>
      </Link>
    </div>
  );
}
