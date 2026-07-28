"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClosingDutyCell({
  branchSlug,
  dateKey,
  currentStaffId,
  options,
}: {
  branchSlug: string;
  dateKey: string;
  currentStaffId: string | null;
  options: { staffId: string; firstName: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onChange(staffId: string) {
    if (!staffId || staffId === currentStaffId) return;
    setSaving(true);
    try {
      await fetch(`/api/branches/${branchSlug}/closing-duty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateKey, staffId }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (options.length === 0) {
    return <span className="block text-center text-xs text-zinc-300 dark:text-zinc-700">—</span>;
  }

  return (
    <select
      value={currentStaffId ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={saving}
      className="w-full rounded-lg border border-zinc-200 bg-white px-1 py-1.5 text-center text-xs font-medium text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {options.map((o) => (
        <option key={o.staffId} value={o.staffId}>
          🧹 {o.firstName}
        </option>
      ))}
    </select>
  );
}
