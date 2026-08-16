"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AvatarImagePicker({
  branchSlug,
  currentImage,
  options,
}: {
  branchSlug: string;
  currentImage: string | null;
  options: readonly string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentImage);
  const [saving, setSaving] = useState(false);

  async function onPick(image: string) {
    if (image === selected || saving) return;
    const previous = selected;
    setSelected(image);
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/my-avatar-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
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
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">Choose Your Avatar</p>
      <div className="grid grid-cols-4 gap-2">
        {options.map((image) => (
          <button
            key={image}
            type="button"
            onClick={() => onPick(image)}
            disabled={saving}
            className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full transition ${
              selected === image
                ? "ring-2 ring-brand-maroon ring-offset-2 dark:ring-offset-zinc-900"
                : "opacity-80 hover:opacity-100"
            }`}
          >
            <Image
              src={`/avatars/${image}.png`}
              alt={image}
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
