"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function BranchPartnerRowControls({
  branchSlug,
  partnerId,
}: {
  branchSlug: string;
  partnerId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    const confirmed = window.confirm(
      "Remove this Partner Cawangan's access? They won't be able to access this branch anymore."
    );
    if (!confirmed) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/branch-partners/${partnerId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="danger" onClick={onDelete} disabled={loading} className="px-3 py-1.5 text-sm">
      {loading ? "Memadam…" : "Remove"}
    </Button>
  );
}
