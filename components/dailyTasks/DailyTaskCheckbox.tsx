"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function DailyTaskCheckbox({
  branchSlug,
  taskId,
  title,
  isPriority,
  initialCompleted,
  completedByName,
}: {
  branchSlug: string;
  taskId: string;
  title: string;
  isPriority: boolean;
  initialCompleted: boolean;
  completedByName: string | null;
}) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [saving, setSaving] = useState(false);

  async function onToggle() {
    const next = !completed;
    setCompleted(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/daily-tasks/${taskId}/toggle`, {
        method: "POST",
      });
      if (!res.ok) {
        setCompleted(!next);
        return;
      }
      router.refresh();
    } catch {
      setCompleted(!next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={saving}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-sm dark:bg-zinc-900",
        completed ? "border-zinc-200 dark:border-zinc-800" : "border-zinc-200 dark:border-zinc-800",
        saving && "opacity-70"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2",
          completed
            ? "border-brand-maroon bg-brand-maroon text-white"
            : "border-red-300 dark:border-red-900"
        )}
      >
        {completed && <Check className="h-4 w-4" />}
      </span>
      <span className="flex-1">
        <span
          className={cn(
            "block text-sm font-semibold",
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
      {isPriority && !completed && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400">
          <Star className="h-3 w-3 fill-current" />
          Penting
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
    </button>
  );
}
