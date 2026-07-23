"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteAnnouncementButton({
  branchSlug,
  announcementId,
}: {
  branchSlug: string;
  announcementId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!window.confirm("Delete this announcement? This can't be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/announcements/${announcementId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="danger" onClick={onDelete} disabled={loading} className="px-3 py-1.5 text-sm">
      {loading ? "Deleting…" : "Delete"}
    </Button>
  );
}
