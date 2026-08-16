import { CheckCircle2, MinusCircle, AlertCircle, Clock } from "lucide-react";
import type { DailyRosterCardRow } from "@/lib/roster/queries";
import { Avatar } from "@/components/staff/Avatar";

const STATUS_CONFIG: Record<
  DailyRosterCardRow["status"],
  { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  working: {
    label: "Working",
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
    icon: CheckCircle2,
  },
  off: {
    label: "Off Day",
    bg: "bg-zinc-100 dark:bg-zinc-800",
    text: "text-zinc-600 dark:text-zinc-400",
    icon: MinusCircle,
  },
  unscheduled: {
    label: "Not Scheduled",
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-400",
    icon: AlertCircle,
  },
};

function formatTime12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export function DailyRosterCards({
  rows,
  lateCount,
}: {
  rows: DailyRosterCardRow[];
  lateCount: number;
}) {
  const workingCount = rows.filter((r) => r.status === "working").length;
  const offCount = rows.filter((r) => r.status === "off").length;
  const unscheduledCount = rows.filter((r) => r.status === "unscheduled").length;

  return (
    <div>
      <h2 className="mb-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
        Who's on Duty Today
      </h2>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No active staff.</p>
        ) : (
          rows.map((row) => {
            const config = STATUS_CONFIG[row.status];
            const StatusIcon = config.icon;
            return (
              <div
                key={row.staffId}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Avatar avatarEmoji={row.avatarEmoji} avatarImage={row.avatarImage} size={44} />
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {row.staffName.split(" ")[0]}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    Staff{row.jobPosition ? ` • ${row.jobPosition}` : ""}
                  </p>
                  {row.status === "working" && row.startTime && row.endTime && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <Clock className="h-3 w-3" />
                      {formatTime12h(row.startTime)} – {formatTime12h(row.endTime)}
                    </p>
                  )}
                </div>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" />
                  {config.label}
                </span>
              </div>
            );
          })
        )}
      </div>

      <h2 className="mb-2 mt-5 text-sm font-bold text-zinc-900 dark:text-zinc-50">
        Today's Summary
      </h2>
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          </span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{workingCount}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Working</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <MinusCircle className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{offCount}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Off</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {unscheduledCount}
          </p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Not Scheduled</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <span className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </span>
          <p className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50">{lateCount}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Late</p>
        </div>
      </div>
    </div>
  );
}
