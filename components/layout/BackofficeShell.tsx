"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { BranchSwitcher } from "@/components/layout/BranchSwitcher";
import type { AccessibleBranch } from "@/lib/tenancy/branch";
import { cn } from "@/lib/utils/cn";

const NAV_SECTIONS = [
  {
    heading: null,
    items: [{ label: "Dashboard", href: "dashboard" }],
  },
  {
    heading: "Team",
    items: [
      { label: "Staff", href: "staff" },
      { label: "Attendance", href: "attendance" },
      { label: "Roster", href: "roster" },
    ],
  },
  {
    heading: "Operations",
    items: [
      { label: "Daily Tasks", href: "daily-tasks" },
      { label: "Opening Checklist", href: "checklists" },
      { label: "Closing Checklist", href: "closing-checklists" },
    ],
  },
  {
    heading: "Inventory",
    items: [
      { label: "Inventory", href: "inventory" },
      { label: "SOPs", href: "sops" },
    ],
  },
  {
    heading: "Communication",
    items: [{ label: "Announcements", href: "announcements" }],
  },
  {
    heading: "Finance",
    items: [
      { label: "Financials", href: "financials" },
      { label: "Closing Sales", href: "closing" },
    ],
  },
] as const;

export function BackofficeShell({
  branchSlug,
  branchName,
  accessibleBranches,
  children,
}: {
  branchSlug: string;
  branchName: string;
  accessibleBranches: AccessibleBranch[];
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  const nav = (
    <nav>
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.heading ?? "top"} className={index === 0 ? undefined : "mt-4"}>
          {section.heading && (
            <p className="mb-1 px-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
              {section.heading}
            </p>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const href = `/office/${branchSlug}/${item.href}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={() => setNavOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
        <BranchSwitcher
          currentSlug={branchSlug}
          currentName={branchName}
          branches={accessibleBranches}
        />
        <div className="mt-6">{nav}</div>
      </aside>

      <div className="flex-1">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            className="rounded-lg p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:hidden"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50 lg:hidden">
            {branchName}
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        {/* Mobile nav drawer */}
        {navOpen && (
          <div className="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
            <BranchSwitcher
              currentSlug={branchSlug}
              currentName={branchName}
              branches={accessibleBranches}
            />
            <div className="mt-4">{nav}</div>
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
