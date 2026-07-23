import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { formatMoney, moneySignClass } from "@/lib/utils/money";

const NEUTRAL_VALUE = "text-zinc-900 dark:text-zinc-50";

export function FinancialSummary({
  totalSales,
  totalExpenses,
  netCashFlow,
  cashDifference,
}: {
  totalSales: number;
  totalExpenses: number;
  netCashFlow: number;
  cashDifference: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <Card className="p-5 sm:p-6">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider">
          Total Sales
        </CardTitle>
        <CardValue className={`mt-2 text-2xl sm:text-3xl ${NEUTRAL_VALUE}`}>
          {formatMoney(totalSales)}
        </CardValue>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider">
          Total Expenses
        </CardTitle>
        <CardValue className={`mt-2 text-2xl sm:text-3xl ${NEUTRAL_VALUE}`}>
          {formatMoney(totalExpenses)}
        </CardValue>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider">
          Net Cash Flow
        </CardTitle>
        <CardValue className={`mt-2 text-2xl sm:text-3xl ${moneySignClass(netCashFlow) ?? NEUTRAL_VALUE}`}>
          {formatMoney(netCashFlow)}
        </CardValue>
      </Card>
      <Card className="p-5 sm:p-6">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider">
          Cash Difference
        </CardTitle>
        <CardValue
          className={`mt-2 text-2xl sm:text-3xl ${moneySignClass(cashDifference) ?? NEUTRAL_VALUE}`}
        >
          {formatMoney(cashDifference)}
        </CardValue>
      </Card>
    </div>
  );
}
