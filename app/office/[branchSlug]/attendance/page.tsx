import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listTodaysAttendance } from "@/lib/attendance/queries";
import { formatBranchTime } from "@/lib/utils/branchDate";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner") redirect(`/office/${branchSlug}/dashboard`);

  const rows = await listTodaysAttendance(branch.id, session.userId, branch.timezone);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Attendance
      </h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Today&apos;s clock-ins compared with the roster. Self clock in/out only — no manual
        correction in this version.
      </p>

      {rows.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No active staff yet.</p>
      )}

      <div className="space-y-2">
        {rows.map((row) => (
          <Card key={row.staffId} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{row.staffName}</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {row.isOffDay
                  ? "Off today"
                  : row.scheduledStartTime
                    ? `Scheduled ${row.scheduledStartTime} – ${row.scheduledEndTime}`
                    : "Not scheduled"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
              {row.clockInAt ? (
                <>
                  <span>
                    In {formatBranchTime(row.clockInAt, branch.timezone)}
                    {row.clockOutAt ? ` · Out ${formatBranchTime(row.clockOutAt, branch.timezone)}` : ""}
                  </span>
                  {row.status === "late" && <Badge tone="warning">Late</Badge>}
                  {row.status === "present" && <Badge tone="success">On time</Badge>}
                </>
              ) : row.isOffDay ? (
                <Badge tone="neutral">Off</Badge>
              ) : (
                <Badge tone="neutral">Not clocked in</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
