"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function StaffDeleteButton({
  branchSlug,
  staffId,
  staffName,
}: {
  branchSlug: string;
  staffId: string;
  staffName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const confirmed = window.confirm(
      `Padam ${staffName} secara KEKAL? Semua rekod kehadiran, jadual, dan gaji staf ini akan turut dipadam dan TIDAK boleh dipulihkan.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/staff/${staffId}`, {
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
      className="flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 disabled:opacity-60 dark:border-red-900 dark:text-red-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {loading ? "Memadam…" : "Delete"}
    </button>
  );
}
