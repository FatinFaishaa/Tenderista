import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-sm font-medium text-zinc-500 dark:text-zinc-400", className)}
      {...props}
    />
  );
}

export function CardValue({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // Text color is replaced, not appended, when a caller passes one (e.g. a
      // green/red signed value) — cn() has no Tailwind class deduping, so two
      // text-color utilities of equal specificity would otherwise both land in
      // the compiled CSS and the visual result would depend on generation order,
      // not on which one appears later in this class list.
      className={cn("mt-1 text-2xl font-semibold", className ?? "text-zinc-900 dark:text-zinc-50")}
      {...props}
    />
  );
}
