import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Placeholder only — clock in/out, checklists, schedule, SOPs, and announcements are
// built in later sprints.
export default async function StaffHomePage({
  params,
}: {
  params: Promise<{ branchSlug: string }>;
}) {
  const { branchSlug } = await params;

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Today</p>
        <p className="mt-1 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Not clocked in
        </p>
        <Button disabled className="mt-4 w-full">
          Clock In (coming soon)
        </Button>
      </Card>
      <Card>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Today&apos;s checklist</p>
        <p className="mt-1 text-zinc-400 dark:text-zinc-600">Coming soon</p>
      </Card>
      <Card>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">My schedule</p>
        <p className="mt-1 text-zinc-400 dark:text-zinc-600">Coming soon</p>
      </Card>
      <Card>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">My Leave</p>
        <Link href={`/${branchSlug}/leave`}>
          <Button variant="secondary" className="mt-4 w-full">
            View My Leave Requests
          </Button>
        </Link>
      </Card>
    </div>
  );
}
