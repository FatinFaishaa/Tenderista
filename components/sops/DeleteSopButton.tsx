"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteSopButton({
  branchSlug,
  sopId,
}: {
  branchSlug: string;
  sopId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this SOP? This can't be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/sops/${sopId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/office/${branchSlug}/sops`);
        router.refresh();
      }
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
