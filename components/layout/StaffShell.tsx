"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils/cn";

const NAV_ITEMS = [
  { label: "Utama", icon: "🏠", href: "" },
  { label: "Jadual", icon: "📅", href: "schedule" },
  { label: "Tugasan", icon: "📝", href: "daily-tasks" },
  { label: "SOP", icon: "📖", href: "sops" },
  { label: "Akaun", icon: "👤", href: "account" },
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
    <div className="flex min-h-screen flex-col bg-brand-cream dark:bg-zinc-950">
      <header className="flex items-center justify-between bg-brand-maroon px-4 py-3 text-white">
        <span className="font-display text-xl">{branchName}</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">{children}</main>
      <nav className="sticky bottom-0 grid grid-cols-5 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {NAV_ITEMS.map((item) => {
          const href = `/${branchSlug}${item.href ? `/${item.href}` : ""}`;
          const active = item.href
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;
          return (
            <Link
              key={item.label}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                active ? "text-brand-maroon dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
