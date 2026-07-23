"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CancelLeaveButton({
  branchSlug,
  requestId,
}: {
  branchSlug: string;
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onCancel() {
    if (!window.confirm("Cancel this leave request?")) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/branches/${branchSlug}/leave-requests/${requestId}/cancel`,
        { method: "POST" }
      );
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      onClick={onCancel}
      disabled={loading}
      className="px-3 py-1.5 text-sm"
    >
      {loading ? "Cancelling…" : "Cancel"}
    </Button>
  );
}
