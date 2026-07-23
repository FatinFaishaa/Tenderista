"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function PublishWeekButton({
  branchSlug,
  weekStart,
}: {
  branchSlug: string;
  weekStart: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onPublish() {
    if (!window.confirm("Publish this week's roster? Staff will immediately see it.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/roster/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={onPublish} disabled={loading}>
      {loading ? "Publishing…" : "Publish Week"}
    </Button>
  );
}
