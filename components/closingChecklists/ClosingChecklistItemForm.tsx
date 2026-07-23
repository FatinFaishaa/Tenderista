"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { CHECKLIST_DEPARTMENTS, DEPARTMENT_LABELS } from "@/lib/validation/checklist";

type Props = {
  branchSlug: string;
  itemId?: string;
  initialValues?: { title: string; department: (typeof CHECKLIST_DEPARTMENTS)[number] };
};

export function ClosingChecklistItemForm({ branchSlug, itemId, initialValues }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [department, setDepartment] = useState<(typeof CHECKLIST_DEPARTMENTS)[number]>(
    initialValues?.department ?? "kitchen"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(itemId);
  const endpoint = isEditing
    ? `/api/branches/${branchSlug}/closing-checklist-items/${itemId}`
    : `/api/branches/${branchSlug}/closing-checklist-items`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, department }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/office/${branchSlug}/closing-checklists`);
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
        <Label htmlFor="department">Department</Label>
        <select
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value as (typeof CHECKLIST_DEPARTMENTS)[number])}
          className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {CHECKLIST_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {DEPARTMENT_LABELS[dept]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Item"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/office/${branchSlug}/closing-checklists`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
