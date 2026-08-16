"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import { Pencil, Lock } from "lucide-react";

type ShiftOption = { id: string; name: string; startTime: string; endTime: string };

type Cell = {
  isOffDay: boolean;
  shiftId: string | null;
  startTime: string | null;
  endTime: string | null;
  isPublished: boolean;
  isOnLeave: boolean;
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

  if (cell.isOnLeave) {
    return (
      <div
        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300"
        title="Staff ini sedang bercuti (diluluskan) — batalkan cuti dulu untuk assign shift."
      >
        <Lock className="h-3 w-3" />
        Cuti
      </div>
    );
  }

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
    // Colour-coded pill: gray = off, amber = morning shift (starts before noon),
    // pink = evening shift (starts noon or later), dashed = nothing assigned yet.
    const startHour = cell.startTime ? Number(cell.startTime.split(":")[0]) : null;
    const isMorning = startHour !== null && startHour < 12;

    let pillClass =
      "border-dashed border-zinc-200 text-zinc-300 hover:border-blue-400 dark:border-zinc-800 dark:text-zinc-700";
    let content: React.ReactNode = <span>—</span>;

    if (cell.isOffDay) {
      pillClass =
        "border-zinc-200 bg-zinc-100 text-zinc-500 hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
      content = <span className="font-semibold">OFF</span>;
    } else if (cell.startTime && cell.endTime) {
      pillClass = isMorning
        ? "border-amber-200 bg-amber-100 text-amber-800 hover:border-blue-400 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
        : "border-pink-200 bg-pink-100 text-pink-700 hover:border-blue-400 dark:border-pink-900 dark:bg-pink-950 dark:text-pink-300";
      content = (
        <span className="font-semibold">
          {cell.startTime}–{cell.endTime}
        </span>
      );
    }

    return (
      <button
        onClick={() => setEditing(true)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs",
          pillClass
        )}
      >
        <span className="flex items-center gap-1">
          {content}
          {!cell.isOffDay && cell.startTime && !cell.isPublished && (
            <span className="text-amber-600" title="Not yet published">
              •
            </span>
          )}
        </span>
        <Pencil className="h-3.5 w-3.5 shrink-0 opacity-60" />
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
