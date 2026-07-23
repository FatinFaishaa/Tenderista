"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function StaffStatusButton({
  branchSlug,
  staffId,
  status,
}: {
  branchSlug: string;
  staffId: string;
  status: "active" | "inactive";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isActive = status === "active";
  const nextStatus = isActive ? "inactive" : "active";
  const confirmMessage = isActive
    ? "Disable this staff member? They'll immediately lose access to this branch."
    : "Reactivate this staff member? They'll regain access to this branch.";

  async function onToggle() {
    if (!window.confirm(confirmMessage)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/staff/${staffId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
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
      {loading ? "Saving…" : isActive ? "Disable" : "Reactivate"}
    </Button>
  );
}
