"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Home, Calendar, ListTodo, BookOpen, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PullToRefresh } from "@/components/layout/PullToRefresh";

const NAV_ITEMS = [
  { label: "Utama", icon: Home, href: "" },
  { label: "Jadual", icon: Calendar, href: "schedule" },
  { label: "Tugasan", icon: ListTodo, href: "daily-tasks" },
  { label: "SOP", icon: BookOpen, href: "sops" },
  { label: "Akaun", icon: User, href: "account" },
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
      <header className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-[#5c0f0f] to-brand-maroon px-4 pb-8 pt-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-brand-gold bg-white/10">
              <Image
                src="/brand/mascot-chick.png"
                alt="Tenderista"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </span>
            <div>
              <p className="font-display text-lg leading-none tracking-wide">TENDERISTA</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                {branchName}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
        <PullToRefresh>{children}</PullToRefresh>
      </main>
      <nav className="sticky bottom-0 grid grid-cols-5 border-t border-zinc-200 bg-white px-2 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        {NAV_ITEMS.map((item) => {
          const href = `/${branchSlug}${item.href ? `/${item.href}` : ""}`;
          const active = item.href
            ? pathname === href || pathname.startsWith(`${href}/`)
            : pathname === href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={href}
              className="flex flex-col items-center gap-1 py-1 text-xs font-medium"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                  active ? "bg-brand-maroon text-white" : "text-zinc-400 dark:text-zinc-500"
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  active ? "text-brand-maroon dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
