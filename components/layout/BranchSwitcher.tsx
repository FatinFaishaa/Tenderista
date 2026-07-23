"use client";

import { useState } from "react";
import Link from "next/link";
import type { AccessibleBranch } from "@/lib/tenancy/branch";
import { cn } from "@/lib/utils/cn";

export function BranchSwitcher({
  currentSlug,
  currentName,
  branches,
}: {
  currentSlug: string;
  currentName: string;
  branches: AccessibleBranch[];
}) {
  const [open, setOpen] = useState(false);

  if (branches.length <= 1) {
    return (
      <div className="font-semibold text-zinc-900 dark:text-zinc-50">{currentName}</div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
      >
        {currentName}
        <span className="text-zinc-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {branches.map((branch) => (
            <Link
              key={branch.id}
              href={
                branch.role === "staff"
                  ? `/${branch.slug}`
                  : `/office/${branch.slug}/dashboard`
              }
              onClick={() => setOpen(false)}
              className={cn(
                "block px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
                branch.slug === currentSlug
                  ? "font-semibold text-blue-700 dark:text-blue-300"
                  : "text-zinc-700 dark:text-zinc-300"
              )}
            >
              {branch.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
