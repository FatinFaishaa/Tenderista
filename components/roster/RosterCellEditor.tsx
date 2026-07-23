"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type ShiftOption = { id: string; name: string; startTime: string; endTime: string };

type Cell = {
  isOffDay: boolean;
  shiftId: string | null;
  startTime: string | null;
  endTime: string | null;
  isPublished: boolean;
};

export function RosterCellEditor({
  branchSlug,
  staffId,
  date,
  cell,
  shifts,
}: {
  branchSlug: string;
  staffId: string;
  date: string;
  cell: Cell;
  shifts: ShiftOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isOffDay, setIsOffDay] = useState(cell.isOffDay);
  const [shiftId, setShiftId] = useState(cell.shiftId ?? "");
  const [startTime, setStartTime] = useState(cell.startTime ?? "");
  const [endTime, setEndTime] = useState(cell.endTime ?? "");
  const [saving, setSaving] = useState(false);

  function applyShiftDefaults(id: string) {
    setShiftId(id);
    const shift = shifts.find((s) => s.id === id);
    if (shift) {
      setStartTime(shift.startTime);
      setEndTime(shift.endTime);
    }
  }

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/branches/${branchSlug}/roster/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          date,
          isOffDay,
          shiftId: isOffDay ? null : shiftId || null,
          startTime: isOffDay ? null : startTime,
          endTime: isOffDay ? null : endTime,
        }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    const isAssigned = cell.isOffDay || Boolean(cell.startTime);
    return (
      <button
        onClick={() => setEditing(true)}
        className={cn(
          "min-h-11 w-full rounded-lg border px-2 py-1.5 text-left text-xs",
          isAssigned
            ? "border-zinc-200 hover:border-blue-400 dark:border-zinc-800"
            : "border-dashed border-zinc-200 text-zinc-300 hover:border-blue-400 dark:border-zinc-800 dark:text-zinc-700"
        )}
      >
        {cell.isOffDay ? (
          <span className="text-zinc-400 dark:text-zinc-500">Off</span>
        ) : cell.startTime ? (
          <span className="text-zinc-900 dark:text-zinc-50">
            {cell.startTime}–{cell.endTime}
          </span>
        ) : (
          <span>— set —</span>
        )}
        {!cell.isOffDay && cell.startTime && !cell.isPublished && (
          <span className="ml-1 text-amber-500" title="Not yet published">
            •
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-blue-400 p-2 dark:bg-zinc-900">
      <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={isOffDay}
          onChange={(e) => setIsOffDay(e.target.checked)}
          className="accent-blue-600"
        />
        Off day
      </label>
      {!isOffDay && (
        <>
          <select
            value={shiftId}
            onChange={(e) => applyShiftDefaults(e.target.value)}
            className="w-full rounded border border-zinc-300 px-1.5 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Custom</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded border border-zinc-300 px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded border border-zinc-300 px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </>
      )}
      <div className="flex gap-1">
        <Button onClick={save} disabled={saving} className="px-2 py-1 text-xs">
          {saving ? "…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="px-2 py-1 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
