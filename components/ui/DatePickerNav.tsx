"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/Input";

/** Generic "pick a date, navigate to ?date=" widget — no checklist-specific logic,
 * just URL navigation, so it's safe to share across Opening/Closing history pages
 * without coupling their business logic together. `extraParams` is optional and only
 * needed by callers that must preserve another query param (e.g. the office Roster
 * page's `view=daily`) across the date change — existing callers are unaffected. */
export function DatePickerNav({
  initialDate,
  extraParams,
}: {
  initialDate: string;
  extraParams?: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Input
      type="date"
      defaultValue={initialDate}
      onChange={(e) => {
        if (!e.target.value) return;
        const params = new URLSearchParams({ date: e.target.value, ...extraParams });
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="w-auto"
    />
  );
}
