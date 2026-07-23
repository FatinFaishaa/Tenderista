"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LeaveReviewActions({
  branchSlug,
  requestId,
}: {
  branchSlug: string;
  requestId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/branches/${branchSlug}/leave-requests/${requestId}/approve`,
        { method: "POST" }
      );
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    const input = window.prompt("Reason for rejecting (optional):");
    if (input === null) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/branches/${branchSlug}/leave-requests/${requestId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNotes: input || undefined }),
        }
      );
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button onClick={approve} disabled={loading} className="px-3 py-1.5 text-sm">
        Approve
      </Button>
      <Button
        variant="danger"
        onClick={reject}
        disabled={loading}
        className="px-3 py-1.5 text-sm"
      >
        Reject
      </Button>
    </div>
  );
}
