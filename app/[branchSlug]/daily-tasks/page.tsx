import { redirect } from "next/navigation";
import { Clock, CheckCircle2, ClipboardList } from "lucide-react";
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
  const percent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const incompleteTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  return (
    <div className="space-y-5">
      {/* Progress card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📝</span>
            <p className="text-base font-bold text-zinc-900 dark:text-zinc-50">
              Tugasan Hari Ini
            </p>
          </div>
          <p className="text-sm font-bold text-brand-maroon dark:text-red-400">
            {completedCount}/{tasks.length} selesai
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-pink-50 dark:bg-zinc-800">
            <div
              className="h-full bg-brand-maroon transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-brand-maroon dark:text-red-400">{percent}%</span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Tiada tugasan lagi — semak semula sebaik sahaja Owner atau Manager anda menetapkannya.
        </p>
      ) : (
        <>
          {/* Belum Selesai */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-orange-400">
                <Clock className="h-3.5 w-3.5 text-orange-500" />
              </span>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Belum Selesai</h2>
            </div>
            {incompleteTasks.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                Semua tugasan sudah selesai! 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {incompleteTasks.map((task) => (
                  <DailyTaskCheckbox
                    key={task.id}
                    branchSlug={branchSlug}
                    taskId={task.id}
                    title={task.title}
                    isPriority={task.isPriority}
                    initialCompleted={task.isCompleted}
                    completedByName={task.completedByName}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Selesai Hari Ini */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-green-500">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              </span>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Selesai Hari Ini ({completedTasks.length})
              </h2>
            </div>
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-950">
                  <ClipboardList className="h-7 w-7 text-brand-maroon" />
                </span>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Belum ada tugasan selesai.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <DailyTaskCheckbox
                    key={task.id}
                    branchSlug={branchSlug}
                    taskId={task.id}
                    title={task.title}
                    isPriority={task.isPriority}
                    initialCompleted={task.isCompleted}
                    completedByName={task.completedByName}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
