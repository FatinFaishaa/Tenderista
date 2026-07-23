import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listShifts } from "@/lib/shifts/queries";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DeleteShiftButton } from "@/components/shifts/DeleteShiftButton";

export default async function ShiftsPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner") redirect(`/office/${branchSlug}/roster`);

  const shifts = await listShifts(branch.id, session.userId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Shift Templates
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Defaults you can pick from when building the roster — each assignment can
            still be adjusted individually.
          </p>
        </div>
        <Link href={`/office/${branchSlug}/shifts/new`}>
          <Button>+ Add Shift</Button>
        </Link>
      </div>

      {shifts.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No shift templates yet.</p>
      )}

      <div className="space-y-2">
        {shifts.map((shift) => (
          <Card key={shift.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{shift.name}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {shift.startTime} – {shift.endTime}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/office/${branchSlug}/shifts/${shift.id}/edit`}>
                <Button variant="secondary" className="px-3 py-1.5 text-sm">
                  Edit
                </Button>
              </Link>
              <DeleteShiftButton branchSlug={branchSlug} shiftId={shift.id} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
