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

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Today&apos;s Tasks
      </h1>

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No tasks yet — check back once your Owner or Manager sets one up.
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
