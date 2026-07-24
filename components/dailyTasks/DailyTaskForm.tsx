"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";

type Props = {
  branchSlug: string;
  taskId?: string;
  jobPositionOptions: string[];
  initialValues?: { title: string; isPriority?: boolean; assignedJobPosition?: string | null };
};

export function DailyTaskForm({ branchSlug, taskId, jobPositionOptions, initialValues }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [isPriority, setIsPriority] = useState(initialValues?.isPriority ?? false);
  const [assignedJobPosition, setAssignedJobPosition] = useState(
    initialValues?.assignedJobPosition ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(taskId);
  const endpoint = isEditing
    ? `/api/branches/${branchSlug}/daily-tasks/${taskId}`
    : `/api/branches/${branchSlug}/daily-tasks`;
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          isPriority,
          assignedJobPosition: assignedJobPosition || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/office/${branchSlug}/daily-tasks`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
      </div>
      <div>
        <Label htmlFor="assignedJobPosition">Assign to Job Position</Label>
        <select
          id="assignedJobPosition"
          value={assignedJobPosition}
          onChange={(e) => setAssignedJobPosition(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">— Semua Staff —</option>
          {jobPositionOptions.map((position) => (
            <option key={position} value={position}>
              {position}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Pilih "Semua Staff" untuk tugasan yang dilihat oleh semua orang.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        <input
          type="checkbox"
          checked={isPriority}
          onChange={(e) => setIsPriority(e.target.checked)}
          className="h-5 w-5 accent-brand-maroon"
        />
        ⭐ Tandakan sebagai Penting
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Task"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/office/${branchSlug}/daily-tasks`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
