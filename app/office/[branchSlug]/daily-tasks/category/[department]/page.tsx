import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, CheckCircle2, Pencil } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getTodaysDailyTasks } from "@/lib/dailyTasks/queries";
import {
  DAILY_TASK_DEPARTMENTS,
  DEPARTMENT_LABELS,
  type DailyTaskDepartmentValue,
} from "@/lib/validation/checklist";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DailyTaskRowControls } from "@/components/dailyTasks/DailyTaskRowControls";

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(date));
}

export default async function DailyTasksCategoryPage({
  params,
}: {
  params: Promise<{ branchSlug: string; department: string }>;
}) {
  const { branchSlug, department } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  if (!DAILY_TASK_DEPARTMENTS.includes(department as DailyTaskDepartmentValue)) notFound();
  const departmentValue = department as DailyTaskDepartmentValue;

  const allTasks = await getTodaysDailyTasks(branch.id, session.userId, branch.timezone);
  const tasks = allTasks.filter((t) => t.department === departmentValue);

  return (
    <div>
      <Link
        href={`/office/${branchSlug}/daily-tasks`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-maroon dark:text-red-400"
      >
        <ChevronLeft className="h-4 w-4" /> Back to Departments
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {DEPARTMENT_LABELS[departmentValue]}
        </h1>
        <Link href={`/office/${branchSlug}/daily-tasks/new`}>
          <Button>+ Add Task</Button>
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-600">No tasks in this department yet.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-sm font-bold text-brand-maroon dark:bg-pink-950 dark:text-red-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{task.title}</p>
                {task.isCompleted ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed by {task.completedByName}
                    {task.completedAt ? ` · ${formatTime(task.completedAt)}` : ""}
                  </p>
                ) : (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    Not completed
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link
                  href={`/office/${branchSlug}/daily-tasks/${task.id}/edit`}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Link>
                <DailyTaskRowControls branchSlug={branchSlug} taskId={task.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
