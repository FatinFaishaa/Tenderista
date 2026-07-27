import Link from "next/link";
import { redirect } from "next/navigation";
import { Folder, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listDailyTasksGroupedByDepartment, getTodaysDailyTasks } from "@/lib/dailyTasks/queries";
import { DEPARTMENT_LABELS } from "@/lib/validation/checklist";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DailyTasksPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  const [groups, todaysTasks] = await Promise.all([
    listDailyTasksGroupedByDepartment(branch.id, session.userId),
    getTodaysDailyTasks(branch.id, session.userId, branch.timezone),
  ]);
  const completedCount = todaysTasks.filter((t) => t.isCompleted).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Daily Tasks</h1>
        <Link href={`/office/${branchSlug}/daily-tasks/new`}>
          <Button>+ Add Task</Button>
        </Link>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Today&apos;s Progress</CardTitle>
          <CardValue>
            {todaysTasks.length === 0 ? "—" : `${completedCount}/${todaysTasks.length}`}
          </CardValue>
        </Card>
      </div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Departments
      </h2>
      <div className="space-y-3">
        {groups.map((group) => (
          <Link
            key={group.department}
            href={`/office/${branchSlug}/daily-tasks/category/${group.department}`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800">
              <Folder className="h-6 w-6 text-brand-maroon" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-zinc-900 dark:text-zinc-50">
                {DEPARTMENT_LABELS[group.department]}
              </p>
              <span className="mt-1.5 inline-block rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-brand-maroon dark:bg-pink-950 dark:text-red-400">
                {group.items.length} task{group.items.length === 1 ? "" : "s"}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-brand-maroon" />
          </Link>
        ))}
      </div>
    </div>
  );
}
