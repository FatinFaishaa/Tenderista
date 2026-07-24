import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getMyProfile } from "@/lib/staff/queries";
import { getMyTodaysAttendance } from "@/lib/attendance/queries";
import { getTodaysDailyTasks } from "@/lib/dailyTasks/queries";
import { getProgressByDepartment } from "@/lib/checklists/queries";
import { getClosingProgressByDepartment } from "@/lib/closingChecklists/queries";
import { getTodaysScheduleSummary } from "@/lib/roster/queries";
import { listAnnouncements } from "@/lib/announcements/queries";
import { ClockButton } from "@/components/attendance/ClockButton";
import { dateToTimeString } from "@/lib/utils/timeOfDay";

function sumProgress(groups: { total: number; completed: number }[]) {
  return groups.reduce(
    (acc, g) => ({ total: acc.total + g.total, completed: acc.completed + g.completed }),
    { total: 0, completed: 0 }
  );
}

export default async function StaffHomePage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const userId = session.userId;

  const branch = await resolveBranchForUser(branchSlug, userId);
  if (!branch) redirect("/branches");

  const [profile, attendance, dailyTasks, openingGroups, closingGroups, schedule, announcements] =
    await Promise.all([
      getMyProfile(branch.id, userId),
      getMyTodaysAttendance(branch.id, userId, branch.timezone),
      getTodaysDailyTasks(branch.id, userId, branch.timezone),
      getProgressByDepartment(branch.id, userId, branch.timezone),
      getClosingProgressByDepartment(branch.id, userId, branch.timezone),
      getTodaysScheduleSummary(branch.id, userId, new Date()),
      listAnnouncements(branch.id, userId),
    ]);

  const opening = sumProgress(openingGroups);
  const closing = sumProgress(closingGroups);
  const checklistTotal = opening.total + closing.total;
  const checklistCompleted = opening.completed + closing.completed;
  const latestAnnouncement = announcements[0] ?? null;

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-cream text-3xl dark:bg-zinc-800">
          {profile.avatarEmoji}
        </span>
        <div>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Hai, {profile.name.split(" ")[0]}! 👋
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Selamat datang kembali</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">📍 {branch.name}</p>
        </div>
      </div>

      {/* Clock In card */}
      {attendance.hasStaffRecord && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">Syif Hari Ini</p>
          {attendance.scheduled && !attendance.scheduled.isOffDay ? (
            <p className="mb-3 text-lg font-bold text-brand-maroon dark:text-red-400">
              {attendance.scheduled.startTime} – {attendance.scheduled.endTime}
            </p>
          ) : (
            <p className="mb-3 text-sm text-zinc-400 dark:text-zinc-500">Tiada syif dijadualkan</p>
          )}
          <ClockButton
            branchSlug={branchSlug}
            clockInTime={attendance.clockInAt ? dateToTimeString(attendance.clockInAt) : null}
            clockOutTime={attendance.clockOutAt ? dateToTimeString(attendance.clockOutAt) : null}
            status={attendance.status}
          />
        </div>
      )}

      {/* Summary grid */}
      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Ringkasan Hari Ini
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl">📋</p>
            <p className="mt-1 text-xl font-bold text-brand-maroon dark:text-red-400">
              {checklistCompleted}/{checklistTotal}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Checklist Selesai</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl">📝</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {dailyTasks.length}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Tugasan Hari Ini</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl">👥</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {schedule.workingCount}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Staf Bertugas</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl">📢</p>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {announcements.length}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Pengumuman</p>
          </div>
        </div>
      </div>

      {/* Today's tasks */}
      {dailyTasks.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Tugasan Hari Ini
            </h2>
            <Link
              href={`/${branchSlug}/daily-tasks`}
              className="text-xs text-brand-maroon dark:text-red-400"
            >
              Lihat Semua ›
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {dailyTasks.slice(0, 3).map((task, i) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i !== Math.min(dailyTasks.length, 3) - 1
                    ? "border-b border-zinc-100 dark:border-zinc-800"
                    : ""
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    task.isCompleted
                      ? "bg-brand-maroon text-white"
                      : "border-2 border-zinc-300 dark:border-zinc-600"
                  }`}
                >
                  {task.isCompleted && "✓"}
                </span>
                <span
                  className={`flex-1 text-sm font-medium ${
                    task.isCompleted
                      ? "text-zinc-400 line-through dark:text-zinc-600"
                      : "text-zinc-900 dark:text-zinc-50"
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Checklist</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href={`/${branchSlug}/checklists`}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xl">☀️</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Opening Checklist
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-brand-maroon"
                style={{
                  width: opening.total > 0 ? `${(opening.completed / opening.total) * 100}%` : "0%",
                }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {opening.completed}/{opening.total} selesai
            </p>
          </Link>
          <Link
            href={`/${branchSlug}/closing-checklists`}
            className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xl">🌙</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Closing Checklist
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-brand-gold"
                style={{
                  width: closing.total > 0 ? `${(closing.completed / closing.total) * 100}%` : "0%",
                }}
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {closing.completed}/{closing.total} selesai
            </p>
          </Link>
        </div>
      </div>

      {/* Announcements */}
      {latestAnnouncement && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Pengumuman</h2>
            <Link
              href={`/${branchSlug}/announcements`}
              className="text-xs text-brand-maroon dark:text-red-400"
            >
              Lihat Semua ›
            </Link>
          </div>
          <div className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cream text-lg dark:bg-zinc-800">
              📢
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {latestAnnouncement.title}
              </p>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                {latestAnnouncement.message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
