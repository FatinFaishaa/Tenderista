"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";

type Props = {
  branchSlug: string;
  itemId?: string;
  initialValues?: { name: string; unit: string | null; minAlertLevel: number };
};

export function StockItemForm({ branchSlug, itemId, initialValues }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [unit, setUnit] = useState(initialValues?.unit ?? "");
  const [minAlertLevel, setMinAlertLevel] = useState(
    initialValues ? String(initialValues.minAlertLevel) : "0"
  );
  // Starting on-hand count — set once, at creation, by the Owner. After that,
  // currentQuantity is only ever changed via the quantity update (any branch
  // member), never through this form, so there's no field for it when editing.
  const [currentQuantity, setCurrentQuantity] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(itemId);
  const endpoint = isEditing
    ? `/api/branches/${branchSlug}/stock-items/${itemId}`
    : `/api/branches/${branchSlug}/stock-items`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing ? { name, unit, minAlertLevel } : { name, unit, minAlertLevel, currentQuantity }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/office/${branchSlug}/inventory`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chicken Breast"
          maxLength={150}
          required
        />
      </div>
      <div>
        <Label htmlFor="unit">Unit (optional)</Label>
        <Input
          id="unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="e.g. kg, pcs, liter"
          maxLength={20}
        />
      </div>
      {!isEditing && (
        <div>
          <Label htmlFor="currentQuantity">Current quantity</Label>
          <Input
            id="currentQuantity"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={currentQuantity}
            onChange={(e) => setCurrentQuantity(e.target.value)}
            required
          />
        </div>
      )}
      <div>
        <Label htmlFor="minAlertLevel">Minimum alert level</Label>
        <Input
          id="minAlertLevel"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={minAlertLevel}
          onChange={(e) => setMinAlertLevel(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Stock Item"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/office/${branchSlug}/inventory`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
