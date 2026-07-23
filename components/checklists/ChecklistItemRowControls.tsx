"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ChecklistItemRowControls({
  branchSlug,
  itemId,
  isFirst,
  isLast,
}: {
  branchSlug: string;
  itemId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function move(direction: "up" | "down") {
    setLoading(true);
    try {
      await fetch(`/api/branches/${branchSlug}/checklist-items/${itemId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this checklist item? This can't be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/checklist-items/${itemId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        onClick={() => move("up")}
        disabled={loading || isFirst}
        aria-label="Move up"
        className="px-2 py-1 text-sm"
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        onClick={() => move("down")}
        disabled={loading || isLast}
        aria-label="Move down"
        className="px-2 py-1 text-sm"
      >
        ↓
      </Button>
      <Button variant="danger" onClick={onDelete} disabled={loading} className="px-3 py-1.5 text-sm">
        Delete
      </Button>
    </div>
  );
}
