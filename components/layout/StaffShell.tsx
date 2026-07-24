"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();

  async function onLogout() {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    const data = await res.json();
    router.push(data.redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream dark:bg-zinc-950">
      <header className="relative flex items-center justify-center bg-brand-maroon px-4 py-3 text-white">
        <span className="font-display text-xl">{branchName}</span>
        <button
          onClick={onLogout}
          aria-label="Log out"
          className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-lg hover:bg-white/10"
        >
          🚪
        </button>
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
