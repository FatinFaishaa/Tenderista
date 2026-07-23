import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getDailyFinancialRecordByDate } from "@/lib/financials/queries";
import { getDailyClosingByDate } from "@/lib/closing/queries";
import { getBranchLocalDateString } from "@/lib/utils/branchDate";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DatePickerNav } from "@/components/ui/DatePickerNav";
import { FinancialSummary } from "@/components/financials/FinancialSummary";
import { CloseDayForm } from "@/components/closing/CloseDayForm";
import { ReopenDayForm } from "@/components/closing/ReopenDayForm";

const SECTION_HEADING = "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-MY", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ClosingPage({
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

  const dateStr = dateParam ?? getBranchLocalDateString(branch.timezone);
  const [record, closing] = await Promise.all([
    getDailyFinancialRecordByDate(branch.id, session.userId, dateStr),
    getDailyClosingByDate(branch.id, session.userId, dateStr),
  ]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Closing</h1>
        <DatePickerNav initialDate={dateStr} />
      </div>

      {!record && (
        <Card className="p-6">
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            No daily financial record yet for {dateStr} — create one before closing the day.
          </p>
          <Link href={`/office/${branchSlug}/financials/new?date=${dateStr}`}>
            <Button>+ Create Daily Record</Button>
          </Link>
        </Card>
      )}

      {record && (
        <div className="space-y-8">
          <FinancialSummary
            totalSales={record.totalSales}
            totalExpenses={record.totalExpenses}
            netCashFlow={record.netCashFlow}
            cashDifference={record.cashDifference}
          />

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className={SECTION_HEADING}>Status</h2>
              <Badge tone={closing.isClosed ? "success" : "neutral"}>
                {closing.isClosed ? "Closed" : "Open"}
              </Badge>
            </div>

            {closing.isClosed ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Closed by {closing.closedByName ?? "—"}
                {closing.closedAt ? ` on ${formatDateTime(closing.closedAt)}` : ""}
              </p>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Not yet closed for this date.
              </p>
            )}

            {closing.notes && (
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
                  {closing.notes}
                </p>
              </div>
            )}
          </Card>

          <div>
            <h2 className={`${SECTION_HEADING} mb-3`}>
              {closing.isClosed ? "Reopen Day" : "Close Day"}
            </h2>
            <Card className="p-6">
              {closing.isClosed ? (
                branch.role === "owner" ? (
                  <ReopenDayForm branchSlug={branchSlug} date={dateStr} />
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Only the Owner can reopen a closed day.
                  </p>
                )
              ) : (
                <CloseDayForm branchSlug={branchSlug} date={dateStr} />
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
