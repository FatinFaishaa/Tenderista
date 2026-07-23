"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { label: "Home", icon: "🏠", href: "", available: true },
  { label: "Attendance", icon: "⏱️", href: "attendance", available: true },
  { label: "Checklist", icon: "✅", href: "checklists", available: true },
  { label: "Closing", icon: "🔒", href: "closing-checklists", available: true },
  { label: "Tasks", icon: "📝", href: "daily-tasks", available: true },
  { label: "Schedule", icon: "📅", href: "schedule", available: true },
  { label: "Inventory", icon: "📦", href: "inventory", available: true },
  { label: "Financials", icon: "💰", href: "financials", available: true },
  { label: "Announcements", icon: "📢", href: "announcements", available: true },
  { label: "SOPs", icon: "📄", href: "sops", available: true },
] as const;

export function StaffShell({
  branchSlug,
  branchName,
  children,
}: {
  branchSlug: string;
  branchName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">{branchName}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">{children}</main>

      <nav className="sticky bottom-0 grid grid-cols-10 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {NAV_ITEMS.map((item) => {
          const href = `/${branchSlug}${item.href ? `/${item.href}` : ""}`;
          const active = item.href
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;
          return item.available ? (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ) : (
            <span
              key={item.label}
              className="flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-zinc-300 dark:text-zinc-700"
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </span>
          );
        })}
      </nav>
    </div>
  );
}
