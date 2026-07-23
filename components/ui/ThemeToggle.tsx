"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

function getInitialIsDark() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  // Lazy initializer (not an effect) so there's no extra render pass. The value
  // legitimately differs between server (no `document`, defaults false) and
  // client (reads the class the bootstrap script already set) on first paint —
  // suppressHydrationWarning below is the standard, narrow way to accept that
  // for just this label's text, rather than a full effect-driven re-render.
  const [isDark, setIsDark] = useState(getInitialIsDark);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <Button
      variant="ghost"
      onClick={toggle}
      aria-label="Toggle theme"
      className="px-3"
      suppressHydrationWarning
    >
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </Button>
  );
}
