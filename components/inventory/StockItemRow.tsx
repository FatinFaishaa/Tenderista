"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { StockItemStatusToggle } from "@/components/inventory/StockItemStatusToggle";
import type { StockItemRow as StockItemData } from "@/lib/inventory/queries";

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

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
            {item.name}
            {!item.isActive && <Badge tone="neutral">Inactive</Badge>}
            {item.isActive && item.isLow && <Badge tone="warning">Low stock</Badge>}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {item.currentQuantity}
            {item.unit ? ` ${item.unit}` : ""} on hand · alert below {item.minAlertLevel}
            {item.unit ? ` ${item.unit}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            className="px-3 py-1.5 text-sm"
            onClick={() => (adjusting ? setAdjusting(false) : openAdjuster())}
          >
            {adjusting ? "Cancel" : "Adjust Qty"}
          </Button>
          <Link href={`/office/${branchSlug}/inventory/${item.id}/edit`}>
            <Button variant="secondary" className="px-3 py-1.5 text-sm">
              Edit
            </Button>
          </Link>
          <StockItemStatusToggle
            branchSlug={branchSlug}
            itemId={item.id}
            isActive={item.isActive}
          />
        </div>
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
