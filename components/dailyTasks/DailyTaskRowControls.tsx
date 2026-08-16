"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DailyTaskRowControls({
  branchSlug,
  taskId,
}: {
  branchSlug: string;
  taskId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this task? This can't be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/daily-tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={loading}
      className="flex items-center gap-1 text-xs font-medium text-red-600 disabled:opacity-50 dark:text-red-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </button>
  );
}
