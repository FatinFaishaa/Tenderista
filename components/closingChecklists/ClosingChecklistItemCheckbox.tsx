"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function ClosingChecklistItemCheckbox({
  branchSlug,
  itemId,
  title,
  initialCompleted,
  completedByName,
}: {
  branchSlug: string;
  itemId: string;
  title: string;
  initialCompleted: boolean;
  completedByName: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);

  async function onToggle() {
    const next = !completed;
    // Optimistic update — auto-save happens immediately, no submit button.
    setCompleted(next);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/branches/${branchSlug}/closing-checklist-items/${itemId}/toggle`,
        { method: "POST" }
      );
      if (!res.ok) {
        setCompleted(!next); // revert on failure
        return;
      }
      // Refresh to pick up who/when from the server rather than guessing client-side.
      router.refresh();
    } catch {
      setCompleted(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900",
        saving && "opacity-70"
      )}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={onToggle}
        disabled={saving}
        className="h-5 w-5 shrink-0 accent-blue-600"
      />
      <span className="flex-1">
        <span
          className={cn(
            "block text-sm font-medium",
            completed
              ? "text-zinc-400 line-through dark:text-zinc-600"
              : "text-zinc-900 dark:text-zinc-50"
          )}
        >
          {title}
        </span>
        {completed && completedByName && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">by {completedByName}</span>
        )}
      </span>
    </label>
  );
}
