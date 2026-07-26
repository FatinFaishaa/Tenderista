"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Custom pull-to-refresh: on mobile, dragging down from the very top of the page
// (window.scrollY === 0) reveals a spinner and, past a threshold, triggers
// router.refresh() to re-fetch the current page's server data — no full page reload.
const PULL_THRESHOLD = 70;
const MAX_PULL = 100;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!pulling.current || startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullDistance(Math.min(delta * 0.5, MAX_PULL));
    } else {
      pulling.current = false;
      setPullDistance(0);
    }
  }

  function onTouchEnd() {
    if (pulling.current && pullDistance >= PULL_THRESHOLD) {
      startTransition(() => {
        router.refresh();
      });
    }
    pulling.current = false;
    startY.current = null;
    setPullDistance(0);
  }

  const indicatorHeight = isPending ? 56 : pullDistance;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: indicatorHeight }}
      >
        <RefreshCw
          className={cn("h-5 w-5 text-brand-maroon", isPending && "animate-spin")}
          style={
            !isPending
              ? { transform: `rotate(${Math.min((pullDistance / PULL_THRESHOLD) * 360, 360)}deg)` }
              : undefined
          }
        />
      </div>
      {children}
    </div>
  );
}
