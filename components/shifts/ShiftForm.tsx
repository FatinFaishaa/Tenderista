"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";

type Props = {
  branchSlug: string;
  shiftId?: string;
  initialValues?: { name: string; startTime: string; endTime: string };
};

export function ShiftForm({ branchSlug, shiftId, initialValues }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [startTime, setStartTime] = useState(initialValues?.startTime ?? "");
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(shiftId);
  const endpoint = isEditing
    ? `/api/branches/${branchSlug}/shifts/${shiftId}`
    : `/api/branches/${branchSlug}/shifts`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/office/${branchSlug}/shifts`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning Shift"
          maxLength={100}
          required
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="startTime">Start</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="endTime">End</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Shift"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/office/${branchSlug}/shifts`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
