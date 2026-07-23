import { LogoutButton } from "@/components/layout/LogoutButton";
import { Card } from "@/components/ui/Card";

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Card className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          No branch access yet
        </h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          Your account isn&apos;t linked to a branch yet. Ask your Owner to add you as
          staff, or a Platform Admin if you believe this is a mistake.
        </p>
        <LogoutButton />
      </Card>
    </div>
  );
}
