"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

export function StockQuantityEditor({
  branchSlug,
  itemId,
  name,
  unit,
  initialQuantity,
  minAlertLevel,
}: {
  branchSlug: string;
  itemId: string;
  name: string;
  unit: string | null;
  initialQuantity: number;
  minAlertLevel: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialQuantity));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = value !== String(initialQuantity);
  const isLow = Number(value) <= minAlertLevel;

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/branches/${branchSlug}/stock-items/${itemId}/quantity`,
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
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex-1 font-medium text-zinc-900 dark:text-zinc-50">{name}</span>
        {isLow && <Badge tone="warning">Low</Badge>}
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={saving}
          className="flex-1"
        />
        {unit && (
          <span className="shrink-0 text-sm text-zinc-500 dark:text-zinc-400">{unit}</span>
        )}
        <Button
          onClick={onSave}
          disabled={saving || !isDirty}
          className={cn("shrink-0 px-3 py-1.5 text-sm", !isDirty && "opacity-50")}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
