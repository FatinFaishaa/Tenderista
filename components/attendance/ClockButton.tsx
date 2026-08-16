"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FormError } from "@/components/ui/FormError";

export function ClockButton({
  branchSlug,
  clockInTime,
  clockOutTime,
  status,
}: {
  branchSlug: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  status: "present" | "late" | "absent" | "on_leave" | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onAction(action: "clock-in" | "clock-out") {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/attendance/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!clockInTime) {
    return (
      <div className="space-y-2">
        <FormError message={error} />
        <Button onClick={() => onAction("clock-in")} disabled={loading} className="w-full">
          {loading ? "Clocking in…" : "Clock In"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <FormError message={error} />
      <p className={`flex items-center gap-2 text-sm font-medium ${clockOutTime ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}`}>
        Clocked in at {clockInTime}
        {status === "late" && <Badge tone="warning">Late</Badge>}
        {status === "present" && <Badge tone="success">On time</Badge>}
      </p>
      {clockOutTime ? (
        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Clocked out at {clockOutTime} — done for today.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex flex-1 items-center gap-1.5 rounded-full bg-green-50 px-3 py-2 text-sm font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            On Duty
          </span>
          <Button
            onClick={() => onAction("clock-out")}
            disabled={loading}
            variant="secondary"
            className="flex-1"
          >
            {loading ? "Clocking out…" : "Clock Out"}
          </Button>
        </div>
      )}
    </div>
  );
}
