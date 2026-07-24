import { redirect, notFound } from "next/navigation";
import { Calendar, MapPin, Phone, ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getStaffById, getStaffPersonalInfo } from "@/lib/staff/queries";
import { StaffForm } from "@/components/staff/StaffForm";

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

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

  const personalRows = personalInfo
    ? [
        { icon: Calendar, label: "Tarikh Lahir", value: formatDateDisplay(personalInfo.dateOfBirth) },
        { icon: MapPin, label: "Alamat", value: personalInfo.homeAddress || "—" },
        { icon: Phone, label: "No. Telefon", value: personalInfo.contactPhone || "—" },
        {
          icon: ShieldAlert,
          label: "Kontak Kecemasan",
          value: personalInfo.emergencyContact || "—",
        },
      ]
    : [];

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Edit Staff</h1>

      {personalInfo && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Maklumat Peribadi Staff
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Disimpan sendiri oleh staff — untuk rujukan sahaja
            </p>
          </div>
          {personalRows.map((row, i) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i !== personalRows.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800">
                  <Icon className="h-4 w-4 text-brand-maroon" />
                </span>
                <span className="flex-1 text-sm text-zinc-500 dark:text-zinc-400">{row.label}</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {row.value}
                </span>
              </div>
            );
          })}
        </div>
      )}

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
