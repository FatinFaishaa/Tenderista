"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";

type Props = {
  branchSlug: string;
  recordId?: string;
  initialValues?: {
    date: string;
    totalSales: number;
    expectedCash: number;
    actualCash: number;
    notes: string | null;
  };
  defaultDate?: string;
};

export function DailyFinancialRecordForm({
  branchSlug,
  recordId,
  initialValues,
  defaultDate,
}: Props) {
  const router = useRouter();
  const [date, setDate] = useState(initialValues?.date ?? defaultDate ?? "");
  const [totalSales, setTotalSales] = useState(
    initialValues ? String(initialValues.totalSales) : "0"
  );
  const [expectedCash, setExpectedCash] = useState(
    initialValues ? String(initialValues.expectedCash) : "0"
  );
  const [actualCash, setActualCash] = useState(
    initialValues ? String(initialValues.actualCash) : "0"
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(recordId);
  const endpoint = isEditing
    ? `/api/branches/${branchSlug}/daily-financials/${recordId}`
    : `/api/branches/${branchSlug}/daily-financials`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? { totalSales, expectedCash, actualCash, notes }
            : { date, totalSales, expectedCash, actualCash, notes }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/office/${branchSlug}/financials?date=${date}`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div>
        <Label htmlFor="date">Date</Label>
        {isEditing ? (
          <p className="text-base text-zinc-900 dark:text-zinc-50">{date}</p>
        ) : (
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        )}
      </div>
      <div>
        <Label htmlFor="totalSales">Total sales (from Niagawan)</Label>
        <Input
          id="totalSales"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={totalSales}
          onChange={(e) => setTotalSales(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="expectedCash">Cash Sales</Label>
        <Input
          id="expectedCash"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={expectedCash}
          onChange={(e) => setExpectedCash(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="actualCash">Actual cash</Label>
        <Input
          id="actualCash"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={actualCash}
          onChange={(e) => setActualCash(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Create Daily Record"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/office/${branchSlug}/financials${date ? `?date=${date}` : ""}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
