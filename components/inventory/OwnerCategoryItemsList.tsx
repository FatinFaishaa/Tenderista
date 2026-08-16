"use client";
import { useState } from "react";
import { InventorySearchBar } from "@/components/inventory/InventorySearchBar";
import { StockItemRow } from "@/components/inventory/StockItemRow";
import type { StockItemRow as StockItemData } from "@/lib/inventory/queries";

export function OwnerCategoryItemsList({
  branchSlug,
  items,
}: {
  branchSlug: string;
  items: StockItemData[];
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
            <StockItemRow key={item.id} branchSlug={branchSlug} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
