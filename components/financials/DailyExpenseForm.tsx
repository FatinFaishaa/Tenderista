"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { dailyExpenseCategories, DAILY_EXPENSE_CATEGORY_LABELS } from "@/lib/validation/financials";

type Category = (typeof dailyExpenseCategories)[number];

type Props = {
  branchSlug: string;
  recordId: string;
  expenseId?: string;
  initialValues?: { title: string; amount: number; category: Category };
  onDone?: () => void;
};

/** Add form (no expenseId) posts to the record's expenses endpoint; edit form
 * (expenseId set) patches the expense directly — same shape either way. */
export function DailyExpenseForm({ branchSlug, recordId, expenseId, initialValues, onDone }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [amount, setAmount] = useState(initialValues ? String(initialValues.amount) : "");
  const [category, setCategory] = useState<Category>(initialValues?.category ?? "ingredients");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(expenseId);
  const endpoint = isEditing
    ? `/api/branches/${branchSlug}/daily-financials/expenses/${expenseId}`
    : `/api/branches/${branchSlug}/daily-financials/${recordId}/expenses`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, amount, category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      if (!isEditing) {
        setTitle("");
        setAmount("");
        setCategory("ingredients");
      }
      router.refresh();
      onDone?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="expenseTitle">Title</Label>
          <Input
            id="expenseTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Market run"
            maxLength={200}
            required
          />
        </div>
        <div>
          <Label htmlFor="expenseAmount">Amount</Label>
          <Input
            id="expenseAmount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="expenseCategory">Category</Label>
          <select
            id="expenseCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {dailyExpenseCategories.map((c) => (
              <option key={c} value={c}>
                {DAILY_EXPENSE_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isEditing ? (
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="px-3 py-1.5 text-sm">
            {loading ? "Saving…" : "Save Changes"}
          </Button>
          {onDone && (
            <Button
              type="button"
              variant="secondary"
              onClick={onDone}
              className="px-3 py-1.5 text-sm"
            >
              Cancel
            </Button>
          )}
        </div>
      ) : (
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Saving…" : "Add Expense"}
        </Button>
      )}
    </form>
  );
}
