"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteShiftButton({ branchSlug, shiftId }: { branchSlug: string; shiftId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this shift template? Past roster assignments keep their times.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/shifts/${shiftId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="danger" onClick={onDelete} disabled={loading} className="px-3 py-1.5 text-sm">
      {loading ? "Deleting…" : "Delete"}
    </Button>
  );
}
