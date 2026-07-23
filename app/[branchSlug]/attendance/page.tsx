import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getMyTodaysAttendance } from "@/lib/attendance/queries";
import { formatBranchTime } from "@/lib/utils/branchDate";
import { Card } from "@/components/ui/Card";
import { ClockButton } from "@/components/attendance/ClockButton";

export default async function StaffAttendancePage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const attendance = await getMyTodaysAttendance(branch.id, session.userId, branch.timezone);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Attendance
      </h1>

      {!attendance.hasStaffRecord ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Clock in/out isn&apos;t available for your account.
        </p>
      ) : (
        <Card className="space-y-4">
          <div>
            {attendance.scheduled === null && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You&apos;re not scheduled today.
              </p>
            )}
            {attendance.scheduled?.isOffDay && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">You&apos;re off today.</p>
            )}
            {attendance.scheduled && !attendance.scheduled.isOffDay && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Scheduled {attendance.scheduled.startTime} – {attendance.scheduled.endTime}
              </p>
            )}
          </div>

          <ClockButton
            branchSlug={branchSlug}
            clockInTime={
              attendance.clockInAt ? formatBranchTime(attendance.clockInAt, branch.timezone) : null
            }
            clockOutTime={
              attendance.clockOutAt
                ? formatBranchTime(attendance.clockOutAt, branch.timezone)
                : null
            }
            status={attendance.status}
          />
        </Card>
      )}
    </div>
  );
}
