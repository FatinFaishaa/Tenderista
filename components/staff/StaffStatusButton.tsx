"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw } from "lucide-react";

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
  const Icon = isActive ? Ban : RotateCcw;

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
    <button
      type="button"
      onClick={onToggle}
      disabled={loading}
      className={`flex min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium disabled:opacity-60 ${
        isActive
          ? "border-red-200 text-red-600 dark:border-red-900 dark:text-red-400"
          : "border-zinc-200 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{loading ? "…" : isActive ? "Disable" : "Reactivate"}</span>
    </button>
  );
}
