"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DailyExpenseForm } from "@/components/financials/DailyExpenseForm";
import { DAILY_EXPENSE_CATEGORY_LABELS } from "@/lib/validation/financials";
import { formatMoney } from "@/lib/utils/money";
import type { DailyExpenseRow as DailyExpenseData } from "@/lib/financials/queries";

// Renders as a single row inside a shared, divided list container (see the
// Financials page) rather than its own bordered card — a flat list of boxes reads
// as busier and harder to scan than one framed list with row dividers.
export function DailyExpenseRow({
  branchSlug,
  recordId,
  expense,
  readOnly,
}: {
  branchSlug: string;
  recordId: string;
  expense: DailyExpenseData;
  readOnly: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this expense? This can't be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/branches/${branchSlug}/daily-financials/expenses/${expense.id}`,
        { method: "DELETE" }
      );
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="bg-zinc-50 p-4 dark:bg-zinc-800/40">
        <DailyExpenseForm
          branchSlug={branchSlug}
          recordId={recordId}
          expenseId={expense.id}
          initialValues={{ title: expense.title, amount: expense.amount, category: expense.category }}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">{expense.title}</p>
          <Badge tone="neutral">{DAILY_EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatMoney(expense.amount)}
        </p>
        {!readOnly && (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-sm"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              className="px-3 py-1.5 text-sm"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
