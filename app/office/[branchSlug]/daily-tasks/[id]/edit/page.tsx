import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getDailyTaskById } from "@/lib/dailyTasks/queries";
import { DailyTaskForm } from "@/components/dailyTasks/DailyTaskForm";

export default async function EditDailyTaskPage({
  params,
}: {
  params: Promise<{ branchSlug: string; id: string }>;
}) {
  const { branchSlug, id } = await params;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");

  const task = await getDailyTaskById(branch.id, session.userId, id);
  if (!task) notFound();

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Edit Task
      </h1>
      <DailyTaskForm branchSlug={branchSlug} taskId={task.id} initialValues={{ title: task.title }} />
    </div>
  );
}
