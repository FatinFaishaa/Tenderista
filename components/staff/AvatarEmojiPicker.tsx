"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AvatarEmojiPicker({
  branchSlug,
  currentEmoji,
  options,
}: {
  branchSlug: string;
  currentEmoji: string;
  options: readonly string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentEmoji);
  const [saving, setSaving] = useState(false);

  async function onPick(emoji: string) {
    if (emoji === selected || saving) return;
    const previous = selected;
    setSelected(emoji);
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/my-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) {
        setSelected(previous);
        return;
      }
      router.refresh();
    } catch {
      setSelected(previous);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Pilih Avatar Anda
      </p>
      <div className="grid grid-cols-4 gap-2">
        {options.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick(emoji)}
            disabled={saving}
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl transition ${
              selected === emoji
                ? "bg-brand-maroon/10 ring-2 ring-brand-maroon"
                : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
