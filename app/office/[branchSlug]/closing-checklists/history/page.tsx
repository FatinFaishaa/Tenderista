import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getTodaysClosingChecklist } from "@/lib/closingChecklists/queries";
import { getBranchLocalDateString } from "@/lib/utils/branchDate";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DatePickerNav } from "@/components/ui/DatePickerNav";

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
}

export default async function ClosingChecklistHistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ branchSlug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { branchSlug } = await params;
  const { date: dateParam } = await searchParams;
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  if (branch.role !== "owner") redirect(`/office/${branchSlug}/closing-checklists`);

  const dateStr = dateParam ?? getBranchLocalDateString(branch.timezone);
  const selectedDate = new Date(`${dateStr}T00:00:00.000Z`);

  const groups = await getTodaysClosingChecklist(
    branch.id,
    session.userId,
    branch.timezone,
    undefined,
    selectedDate
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Closing Checklist History
        </h1>
        <DatePickerNav initialDate={dateStr} />
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.department}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {group.label}
            </h2>
            {group.items.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">No items.</p>
            ) : (
              <div className="space-y-2">
                {group.items.map((item) => (
                  <Card key={item.id} className="flex items-center justify-between gap-4">
                    <span className="text-zinc-900 dark:text-zinc-50">{item.title}</span>
                    {item.isCompleted ? (
                      <div className="text-right">
                        <Badge tone="success">Completed</Badge>
                        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                          {item.completedByName} · {formatTime(item.completedAt!)}
                        </p>
                      </div>
                    ) : (
                      <Badge tone="neutral">Not completed</Badge>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
