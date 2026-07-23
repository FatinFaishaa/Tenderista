"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";
import { STAFF_POSITION_SUGGESTIONS } from "@/lib/validation/staff";
import { CHECKLIST_DEPARTMENTS, DEPARTMENT_LABELS } from "@/lib/validation/checklist";

type Props = {
  branchSlug: string;
  staffId?: string;
  initialValues?: {
    name: string;
    email: string;
    jobPosition: string;
    department: string | null;
  };
};

export function StaffForm({ branchSlug, staffId, initialValues }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [jobPosition, setJobPosition] = useState(initialValues?.jobPosition ?? "");
  const [department, setDepartment] = useState(initialValues?.department ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(staffId);
  const endpoint = isEditing
    ? `/api/branches/${branchSlug}/staff/${staffId}`
    : `/api/branches/${branchSlug}/staff`;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, jobPosition, department, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/office/${branchSlug}/staff`);
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
          maxLength={150}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email (login)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="jobPosition">Role</Label>
        <Input
          id="jobPosition"
          value={jobPosition}
          onChange={(e) => setJobPosition(e.target.value)}
          list="staff-position-suggestions"
          placeholder="e.g. Kitchen Crew"
          maxLength={100}
          required
        />
        <datalist id="staff-position-suggestions">
          {STAFF_POSITION_SUGGESTIONS.map((position) => (
            <option key={position} value={position} />
          ))}
        </datalist>
      </div>
      <div>
        <Label htmlFor="department">Department</Label>
        <select
          id="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">— None —</option>
          {CHECKLIST_DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {DEPARTMENT_LABELS[dept]}
            </option>
          ))}
        </select>
      </div>
      {!isEditing && (
        <div>
          <Label htmlFor="password">Initial password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Only needed if this email has no account yet"
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEditing ? "Save Changes" : "Add Staff"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/office/${branchSlug}/staff`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
