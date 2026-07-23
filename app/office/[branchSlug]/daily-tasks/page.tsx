import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { listDailyTasks, getTodaysDailyTasks } from "@/lib/dailyTasks/queries";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DailyTaskRowControls } from "@/components/dailyTasks/DailyTaskRowControls";

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

  const [tasks, todaysTasks] = await Promise.all([
    listDailyTasks(branch.id, session.userId),
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
            {tasks.length === 0 ? "—" : `${completedCount}/${todaysTasks.length}`}
          </CardValue>
        </Card>
      </div>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Task List
      </h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">No tasks yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <Card key={task.id} className="flex items-center justify-between gap-4">
              <span className="text-zinc-900 dark:text-zinc-50">{task.title}</span>
              <div className="flex items-center gap-2">
                <Link href={`/office/${branchSlug}/daily-tasks/${task.id}/edit`}>
                  <Button variant="secondary" className="px-3 py-1.5 text-sm">
                    Edit
                  </Button>
                </Link>
                <DailyTaskRowControls
                  branchSlug={branchSlug}
                  taskId={task.id}
                  isFirst={index === 0}
                  isLast={index === tasks.length - 1}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
