"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import type { StockItemRow as StockItemData } from "@/lib/inventory/queries";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(date));
}

// Owner-only row: item details (Edit) and the on-hand count (Adjust Qty) are
// deliberately separate actions hitting separate endpoints — Edit never touches
// currentQuantity, Adjust Qty never touches name/unit/minAlertLevel. Same quantity
// route any branch member's own app uses; no stock-transaction log, just the balance.
export function StockItemRow({
  branchSlug,
  item,
}: {
  branchSlug: string;
  item: StockItemData;
}) {
  const router = useRouter();
  const [adjusting, setAdjusting] = useState(false);
  const [value, setValue] = useState(String(item.currentQuantity));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdjuster() {
    setValue(String(item.currentQuantity));
    setError(null);
    setAdjusting(true);
  }

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/branches/${branchSlug}/stock-items/${item.id}/quantity`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentQuantity: value }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't save. Try again.");
        return;
      }
      setAdjusting(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(
      `Permanently delete "${item.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/stock-items/${item.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
            {item.name}
            {!item.isActive && <Badge tone="neutral">Inactive</Badge>}
            {item.isActive && item.isLow && <Badge tone="warning">Low stock</Badge>}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {item.currentQuantity}
            {item.unit ? ` ${item.unit}` : ""} on hand · alert below {item.minAlertLevel}
            {item.unit ? ` ${item.unit}` : ""}
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            {item.updatedByName
              ? `Terakhir dikemaskini: ${formatDateTime(item.updatedAt)} oleh ${item.updatedByName}`
              : `Dicipta: ${formatDateTime(item.createdAt)} oleh ${item.creatorName}`}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <Button
          variant="secondary"
          className="flex-1 px-3 py-1.5 text-sm"
          onClick={() => (adjusting ? setAdjusting(false) : openAdjuster())}
        >
          {adjusting ? "Cancel" : "Adjust Qty"}
        </Button>
        <Link href={`/office/${branchSlug}/inventory/${item.id}/edit`} className="flex-1">
          <Button variant="secondary" className="w-full px-3 py-1.5 text-sm">
            Edit
          </Button>
        </Link>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60 dark:border-red-900 dark:text-red-400"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {deleting ? "Memadam…" : "Delete"}
        </button>
      </div>

      {adjusting && (
        <div className="mt-3 flex items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={saving}
            className="flex-1"
            autoFocus
          />
          {item.unit && (
            <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">{item.unit}</span>
          )}
          <Button onClick={onSave} disabled={saving} className="shrink-0 px-3 py-1.5 text-sm">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </Card>
  );
}
