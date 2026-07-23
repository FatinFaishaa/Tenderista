"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function StockItemStatusToggle({
  branchSlug,
  itemId,
  isActive,
}: {
  branchSlug: string;
  itemId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onToggle() {
    const next = !isActive;
    if (
      !window.confirm(
        next
          ? "Reactivate this stock item? It will reappear for quantity updates."
          : "Deactivate this stock item? Staff will no longer see it to update quantity."
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/stock-items/${itemId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isActive ? "danger" : "secondary"}
      onClick={onToggle}
      disabled={loading}
      className="px-3 py-1.5 text-sm"
    >
      {loading ? "Saving…" : isActive ? "Deactivate" : "Reactivate"}
    </Button>
  );
}
