"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Folder, ChevronRight, Pencil } from "lucide-react";

export function StockCategoryRow({
  branchSlug,
  href,
  categoryId,
  categoryName,
  itemCount,
}: {
  branchSlug: string;
  href: string;
  categoryId: string;
  categoryName: string;
  itemCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(categoryName);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/stock-categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800">
        <Folder className="h-6 w-6 text-brand-maroon" />
      </span>
      <div className="min-w-0 flex-1">
        {editing ? (
          <form onSubmit={onSubmit} className="flex items-center gap-1.5">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={150}
              className="h-7 w-full max-w-[160px] rounded-lg border border-zinc-300 bg-white px-2 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-full bg-brand-maroon px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {saving ? "…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setName(categoryName);
                setError(null);
              }}
              className="text-xs text-zinc-400"
            >
              Cancel
            </button>
          </form>
        ) : (
          <Link href={href} className="block">
            <p className="font-bold text-zinc-900 dark:text-zinc-50">{categoryName}</p>
            <span className="mt-1.5 inline-block rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-brand-maroon dark:bg-pink-950 dark:text-red-400">
              {itemCount} item{itemCount === 1 ? "" : "s"}
            </span>
          </Link>
        )}
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
      {!editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Rename folder"
          className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {!editing && (
        <Link href={href}>
          <ChevronRight className="h-5 w-5 shrink-0 text-brand-maroon" />
        </Link>
      )}
    </div>
  );
}
