import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getDailyFinancialRecordByDate } from "@/lib/financials/queries";
import { getBranchLocalDateString } from "@/lib/utils/branchDate";
import { formatMoney, moneySignClass } from "@/lib/utils/money";
import { Card } from "@/components/ui/Card";
import { DatePickerNav } from "@/components/ui/DatePickerNav";
import { FinancialSummary } from "@/components/financials/FinancialSummary";
import { DailyExpenseRow } from "@/components/financials/DailyExpenseRow";

const SECTION_HEADING = "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400";

export default async function StaffFinancialsPage({
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
  const record = await getDailyFinancialRecordByDate(branch.id, session.userId, dateStr);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Financials</h1>
        <DatePickerNav initialDate={dateStr} />
      </div>

      {!record && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No daily record yet for {dateStr}.
        </p>
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
            <h2 className={`${SECTION_HEADING} mb-4`}>Daily Record</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Cash Sales</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatMoney(record.expectedCash)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Actual Cash</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {formatMoney(record.actualCash)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Cash Difference</p>
                <p
                  className={`mt-1 text-lg font-semibold ${
                    moneySignClass(record.cashDifference) ?? "text-zinc-900 dark:text-zinc-50"
                  }`}
                >
                  {formatMoney(record.cashDifference)}
                </p>
              </div>
            </div>
            {record.notes && (
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
                  {record.notes}
                </p>
              </div>
            )}
          </Card>

          <div>
            <h2 className={`${SECTION_HEADING} mb-3`}>Expenses</h2>
            {record.expenses.length === 0 ? (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">No expenses yet.</p>
            ) : (
              <div className="divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {record.expenses.map((expense) => (
                  <DailyExpenseRow
                    key={expense.id}
                    branchSlug={branchSlug}
                    recordId={record.id}
                    expense={expense}
                    readOnly
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
