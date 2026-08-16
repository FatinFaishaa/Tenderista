"use client";
import { useState } from "react";
import { InventorySearchBar } from "@/components/inventory/InventorySearchBar";
import { StockQuantityEditor } from "@/components/inventory/StockQuantityEditor";

type Item = {
  id: string;
  name: string;
  unit: string | null;
  currentQuantity: number;
  minAlertLevel: number;
};

export function StaffCategoryItemsList({
  branchSlug,
  items,
}: {
  branchSlug: string;
  items: Item[];
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <div>
      <InventorySearchBar value={query} onChange={setQuery} />
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {query ? "Tiada item sepadan." : "No stock items yet in this category."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <StockQuantityEditor
              key={item.id}
              branchSlug={branchSlug}
              itemId={item.id}
              name={item.name}
              unit={item.unit}
              initialQuantity={item.currentQuantity}
              minAlertLevel={item.minAlertLevel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
