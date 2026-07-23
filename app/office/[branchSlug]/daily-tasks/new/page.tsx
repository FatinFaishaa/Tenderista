import { DailyTaskForm } from "@/components/dailyTasks/DailyTaskForm";

export default async function NewDailyTaskPage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Add Task
      </h1>
      <DailyTaskForm branchSlug={branchSlug} />
    </div>
  );
}
