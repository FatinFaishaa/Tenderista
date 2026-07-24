import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getTodaysDailyTasks } from "@/lib/dailyTasks/queries";
import { DailyTaskCheckbox } from "@/components/dailyTasks/DailyTaskCheckbox";

export default async function StaffDailyTasksPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  const tasks = await getTodaysDailyTasks(branch.id, session.userId, branch.timezone);
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          📝 Tugasan Hari Ini
        </h1>
        {tasks.length > 0 && (
          <span className="rounded-full bg-brand-cream px-3 py-1 text-sm font-semibold text-brand-maroon dark:bg-zinc-800 dark:text-red-400">
            {completedCount}/{tasks.length}
          </span>
        )}
      </div>

      {tasks.length > 0 && (
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-brand-maroon transition-all"
            style={{ width: `${(completedCount / tasks.length) * 100}%` }}
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Tiada tugasan lagi — semak semula sebaik sahaja Owner atau Manager anda menetapkannya.
        </p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <DailyTaskCheckbox
              key={task.id}
              branchSlug={branchSlug}
              taskId={task.id}
              title={task.title}
              initialCompleted={task.isCompleted}
              completedByName={task.completedByName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
