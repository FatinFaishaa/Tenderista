"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MyProfileForm({
  branchSlug,
  initialName,
  initialDateOfBirth,
  initialAddress,
}: {
  branchSlug: string;
  initialName: string;
  initialDateOfBirth: string | null;
  initialAddress: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [dateOfBirth, setDateOfBirth] = useState(initialDateOfBirth ?? "");
  const [address, setAddress] = useState(initialAddress ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/my-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, dateOfBirth: dateOfBirth || null, homeAddress: address || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal simpan. Cuba lagi.");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Maklumat Peribadi</p>

      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Nama</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Tarikh Lahir</label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">Alamat</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {saved && <p className="text-xs text-green-600 dark:text-green-400">Berjaya disimpan ✓</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="min-h-11 w-full rounded-lg bg-brand-maroon px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Menyimpan…" : "Simpan"}
      </button>
    </div>
  );
}
