/** Consistent "RM0.00" display across the Financials feature. */
export function formatMoney(value: number): string {
  return `RM${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Green when positive, red when negative, unset (neutral) at exactly zero — shared
 * by the KPI cards and the Daily Record's Cash Difference column. */
export function moneySignClass(value: number): string | undefined {
  if (value < 0) return "text-red-600 dark:text-red-400";
  if (value > 0) return "text-green-600 dark:text-green-400";
  return undefined;
}
