import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { resolveBranchForUser } from "@/lib/tenancy/branch";
import { getMyPublishedScheduleForWeek, getDailyRoster } from "@/lib/roster/queries";
import { getBranchLocalDate, getBranchLocalDateString } from "@/lib/utils/branchDate";
import { getWeekStart, parseDateKey } from "@/lib/utils/week";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DailyRosterView } from "@/components/roster/DailyRosterView";

const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default async function StaffSchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ branchSlug: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { branchSlug } = await params;
  const { view: viewParam } = await searchParams;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  const branch = await resolveBranchForUser(branchSlug, session.userId);
  if (!branch) redirect("/branches");
  const view: "my" | "today" = viewParam === "today" ? "today" : "my";
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          📅 {view === "my" ? "Jadual Saya" : "Roster Hari Ini"}
        </h1>
        <div className="flex gap-2">
          <Link href="?view=my">
            <Button
              variant={view === "my" ? "primary" : "secondary"}
              className="px-3 py-1.5 text-sm"
            >
              Jadual Saya
            </Button>
          </Link>
          <Link href="?view=today">
            <Button
              variant={view === "today" ? "primary" : "secondary"}
              className="px-3 py-1.5 text-sm"
            >
              Hari Ini
            </Button>
          </Link>
        </div>
      </div>
      {view === "my" ? (
        <MySchedule branchId={branch.id} userId={session.userId} timezone={branch.timezone} />
      ) : (
        <TodaysRoster branchId={branch.id} userId={session.userId} timezone={branch.timezone} />
      )}
    </div>
  );
}

async function MySchedule({
  branchId,
  userId,
  timezone,
}: {
  branchId: string;
  userId: string;
  timezone: string;
}) {
  const weekStart = getWeekStart(getBranchLocalDate(timezone));
  const days = await getMyPublishedScheduleForWeek(branchId, userId, weekStart);
  const todayStr = getBranchLocalDateString(timezone);

  return (
    <div className="space-y-2">
      {days.map((day, i) => {
        const isToday = day.date === todayStr;
        return (
          <Card
            key={day.date}
            className={`flex items-center justify-between ${
              isToday ? "border-brand-maroon bg-brand-cream dark:bg-zinc-800" : ""
            }`}
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {DAY_LABELS[i]}{" "}
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                {day.date.slice(5)}
              </span>
              {isToday && (
                <span className="ml-2 rounded-full bg-brand-maroon px-2 py-0.5 text-xs text-white">
                  Hari Ini
                </span>
              )}
            </span>
            {day.status === "off" && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">🌴 Off</span>
            )}
            {day.status === "working" && (
              <span className="text-sm font-semibold text-brand-maroon dark:text-red-400">
                🕐 {day.startTime}–{day.endTime}
                {day.shiftName ? ` (${day.shiftName})` : ""}
              </span>
            )}
            {day.status === "unpublished" && (
              <span className="text-sm text-zinc-400 dark:text-zinc-600">Belum dijadualkan</span>
            )}
          </Card>
        );
      })}
    </div>
  );
}

async function TodaysRoster({
  branchId,
  userId,
  timezone,
}: {
  branchId: string;
  userId: string;
  timezone: string;
}) {
  const todayStr = getBranchLocalDateString(timezone);
  const rows = await getDailyRoster(branchId, userId, parseDateKey(todayStr));
  return <DailyRosterView rows={rows} date={todayStr} timezone={timezone} />;
}
