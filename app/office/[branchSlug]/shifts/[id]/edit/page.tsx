import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getShiftById } from "@/lib/shifts/queries";
import { ShiftForm } from "@/components/shifts/ShiftForm";

export default async function EditShiftPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner") redirect(`/office/${branchSlug}/roster`);

  const shift = await getShiftById(branch.id, session.userId, id);
  if (!shift) notFound();

  return (
    <div className="max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Shift Template
      </h1>
      <ShiftForm
        branchSlug={branchSlug}
        shiftId={shift.id}
        initialValues={{ name: shift.name, startTime: shift.startTime, endTime: shift.endTime }}
      />
    </div>
  );
}
