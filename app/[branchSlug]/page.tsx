import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ClipboardCheck,
  ListTodo,
  Users,
  Megaphone,
  ChevronRight,
  Package,
  MapPin,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getMyProfile } from "@/lib/staff/queries";
import { Avatar } from "@/components/staff/Avatar";
import { getMyTodaysAttendance, getMyMonthlyEarnings } from "@/lib/attendance/queries";
import { getTodaysDailyTasks } from "@/lib/dailyTasks/queries";
import { getProgressByDepartment } from "@/lib/checklists/queries";
import { getClosingProgressByDepartment } from "@/lib/closingChecklists/queries";
import { getTodaysScheduleSummary } from "@/lib/roster/queries";
import { listAnnouncements } from "@/lib/announcements/queries";
import { ClockButton } from "@/components/attendance/ClockButton";
import { formatBranchTime } from "@/lib/utils/branchDate";

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

  const [profile, attendance, dailyTasks, openingGroups, closingGroups, schedule, announcements, earnings] =
    await Promise.all([
      getMyProfile(branch.id, userId),
      getMyTodaysAttendance(branch.id, userId, branch.timezone),
      getTodaysDailyTasks(branch.id, userId, branch.timezone),
      getProgressByDepartment(branch.id, userId, branch.timezone),
      getClosingProgressByDepartment(branch.id, userId, branch.timezone),
      getTodaysScheduleSummary(branch.id, userId, new Date()),
      listAnnouncements(branch.id, userId),
      getMyMonthlyEarnings(branch.id, userId, branch.timezone),
    ]);

  const opening = sumProgress(openingGroups);
  const closing = sumProgress(closingGroups);
  const checklistTotal = opening.total + closing.total;
  const checklistCompleted = opening.completed + closing.completed;
  const latestAnnouncement = announcements[0] ?? null;

  const SUMMARY_ITEMS = [
    {
      label: "Checklist Selesai",
      value: `${checklistCompleted}/${checklistTotal}`,
      icon: ClipboardCheck,
      bg: "bg-pink-100 dark:bg-pink-950",
      color: "text-brand-maroon dark:text-red-400",
      href: `/${branchSlug}/checklists`,
    },
    {
      label: "Tugasan Hari Ini",
      value: String(dailyTasks.length),
      icon: ListTodo,
      bg: "bg-amber-100 dark:bg-amber-950",
      color: "text-amber-600 dark:text-amber-400",
      href: `/${branchSlug}/daily-tasks`,
    },
    {
      label: "Staf Bertugas",
      value: String(schedule.workingCount),
      icon: Users,
      bg: "bg-green-100 dark:bg-green-950",
      color: "text-green-600 dark:text-green-400",
      href: `/${branchSlug}/schedule?view=today`,
    },
    {
      label: "Pengumuman",
      value: String(announcements.length),
      icon: Megaphone,
      bg: "bg-blue-100 dark:bg-blue-950",
      color: "text-blue-600 dark:text-blue-400",
      href: `/${branchSlug}/announcements`,
    },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Greeting header */}
      <div className="flex items-center gap-3">
        <Avatar avatarEmoji={profile.avatarEmoji} avatarImage={profile.avatarImage} size={56} className="shadow-sm" />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Hai, {profile.name.split(" ")[0]}! 👋
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Selamat datang kembali</p>
          <p className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
            <MapPin className="h-3 w-3" /> {branch.name}
          </p>
        </div>
        <Image
          src="/brand/storefront.png"
          alt="Tenderista"
          width={112}
          height={84}
          className="h-16 w-auto shrink-0 object-contain"
        />
      </div>

      {/* Estimated earnings this month */}
      {earnings.hasStaffRecord && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <Wallet className="h-6 w-6 text-green-700 dark:text-green-400" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Anggaran Gaji Bulan Ini
              </p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                RM {earnings.amount.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              {earnings.salaryType === "hourly" ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {earnings.workedHours.toFixed(1)} jam × RM {earnings.hourlyRate.toFixed(2)}/jam
                </p>
              ) : (
                <p className="text-xs text-zinc-400 dark:text-zinc-500">Gaji bulanan tetap</p>
              )}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300 dark:text-zinc-600" />
          </div>
        </div>
      )}

      {/* Clock In card */}
      {attendance.hasStaffRecord && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
              <Clock className="h-6 w-6 text-brand-maroon" />
            </span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Syif Hari Ini
              </p>
              {attendance.scheduled && !attendance.scheduled.isOffDay ? (
                <p className="text-lg font-bold text-brand-maroon dark:text-red-400">
                  {attendance.scheduled.startTime} – {attendance.scheduled.endTime}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500">Tiada syif dijadualkan</p>
              )}
              {!attendance.clockInAt && (
                <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                  Belum Clock In
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 [&_button]:flex [&_button]:min-h-12 [&_button]:w-full [&_button]:items-center [&_button]:justify-center [&_button]:gap-2 [&_button]:rounded-xl [&_button]:bg-gradient-to-r [&_button]:from-brand-maroon [&_button]:to-[#5c0f0f] [&_button]:text-base [&_button]:font-bold [&_button]:shadow-md">
            <ClockButton
              branchSlug={branchSlug}
              clockInTime={attendance.clockInAt ? formatBranchTime(attendance.clockInAt, branch.timezone) : null}
              clockOutTime={attendance.clockOutAt ? formatBranchTime(attendance.clockOutAt, branch.timezone) : null}
              status={attendance.status}
            />
          </div>
        </div>
      )}

      {/* Summary grid */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          ✨ Ringkasan Hari Ini
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {SUMMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-2xl border border-zinc-200 bg-white p-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${item.bg}`}>
                  <Icon className={`h-6 w-6 ${item.color}`} />
                </span>
                <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">{item.value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.label}</p>
                <Link
                  href={item.href}
                  className="mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium text-brand-maroon dark:text-red-400"
                >
                  Lihat Detail <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quote banner */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-gold/30 bg-brand-cream p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative z-10 max-w-[65%]">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            &ldquo;Kerja hari ini, hasil esok hari.&rdquo;
          </p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">Usaha, doa, tawakal.</p>
        </div>
        <Image
          src="/brand/chicken-bucket.png"
          alt=""
          width={160}
          height={160}
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-3 -right-2 h-24 w-24 object-contain"
        />
      </div>

      {/* Today's tasks */}
      {dailyTasks.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
              Tugasan Hari Ini
            </h2>
            <Link
              href={`/${branchSlug}/daily-tasks`}
              className="flex items-center text-xs font-medium text-brand-maroon dark:text-red-400"
            >
              Lihat Semua <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            {dailyTasks.slice(0, 3).map((task, i) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  i !== Math.min(dailyTasks.length, 3) - 1
                    ? "border-b border-zinc-100 dark:border-zinc-800"
                    : ""
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
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

      {/* Inventory shortcut */}
      <div>
        <h2 className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">Inventory</h2>
        <Link
          href={`/${branchSlug}/inventory`}
          className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-zinc-800">
              <Package className="h-5 w-5 text-brand-maroon" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Inventory</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Kemaskini kuantiti stock</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        </Link>
      </div>

      {/* Announcements */}
      {latestAnnouncement && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Pengumuman</h2>
            <Link
              href={`/${branchSlug}/announcements`}
              className="flex items-center text-xs font-medium text-brand-maroon dark:text-red-400"
            >
              Lihat Semua <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
              <Megaphone className="h-5 w-5 text-brand-maroon" />
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
