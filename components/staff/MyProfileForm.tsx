"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Calendar, MapPin, Phone, ShieldAlert, Pencil } from "lucide-react";

type ProfileData = {
  name: string;
  dateOfBirth: string | null;
  homeAddress: string | null;
  contactPhone: string | null;
  emergencyContact: string | null;
};

function formatDateDisplay(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function MyProfileForm({
  branchSlug,
  initialName,
  initialDateOfBirth,
  initialAddress,
  initialContactPhone,
  initialEmergencyContact,
}: {
  branchSlug: string;
  initialName: string;
  initialDateOfBirth: string | null;
  initialAddress: string | null;
  initialContactPhone: string | null;
  initialEmergencyContact: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saved, setSaved] = useState<ProfileData>({
    name: initialName,
    dateOfBirth: initialDateOfBirth,
    homeAddress: initialAddress,
    contactPhone: initialContactPhone,
    emergencyContact: initialEmergencyContact,
  });

  const [name, setName] = useState(saved.name);
  const [dateOfBirth, setDateOfBirth] = useState(saved.dateOfBirth ?? "");
  const [address, setAddress] = useState(saved.homeAddress ?? "");
  const [contactPhone, setContactPhone] = useState(saved.contactPhone ?? "");
  const [emergencyContact, setEmergencyContact] = useState(saved.emergencyContact ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function enterEditMode() {
    setName(saved.name);
    setDateOfBirth(saved.dateOfBirth ?? "");
    setAddress(saved.homeAddress ?? "");
    setContactPhone(saved.contactPhone ?? "");
    setEmergencyContact(saved.emergencyContact ?? "");
    setError(null);
    setMode("edit");
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/my-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dateOfBirth: dateOfBirth || null,
          homeAddress: address || null,
          contactPhone: contactPhone || null,
          emergencyContact: emergencyContact || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal simpan. Cuba lagi.");
        return;
      }
      setSaved({
        name,
        dateOfBirth: dateOfBirth || null,
        homeAddress: address || null,
        contactPhone: contactPhone || null,
        emergencyContact: emergencyContact || null,
      });
      setMode("view");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (mode === "view") {
    const rows = [
      { icon: User, label: "Nama", value: saved.name || "—" },
      { icon: Calendar, label: "Tarikh Lahir", value: formatDateDisplay(saved.dateOfBirth) },
      { icon: MapPin, label: "Alamat", value: saved.homeAddress || "—" },
      { icon: Phone, label: "No. Telefon", value: saved.contactPhone || "—" },
      { icon: ShieldAlert, label: "Kontak Kecemasan", value: saved.emergencyContact || "—" },
    ];

    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800">
            <User className="h-4 w-4 text-brand-maroon" />
          </span>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Maklumat Peribadi</p>
        </div>
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <div
              key={row.label}
              className={`flex items-center gap-3 px-4 py-3 ${
                i !== rows.length - 1 ? "border-t border-zinc-100 dark:border-zinc-800" : ""
              }`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-cream dark:bg-zinc-800">
                <Icon className="h-4 w-4 text-brand-maroon" />
              </span>
              <span className="flex-1 text-sm text-zinc-500 dark:text-zinc-400">{row.label}</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {row.value}
              </span>
            </div>
          );
        })}
        <div className="p-3">
          <button
            type="button"
            onClick={enterEditMode}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-maroon px-4 py-2.5 text-sm font-medium text-white"
          >
            <Pencil className="h-4 w-4" />
            Edit Maklumat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Edit Maklumat Peribadi</p>

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

      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">No. Telefon</label>
        <input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="012-345 6789"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-zinc-500 dark:text-zinc-400">
          Kontak Kecemasan
        </label>
        <input
          type="text"
          value={emergencyContact}
          onChange={(e) => setEmergencyContact(e.target.value)}
          placeholder="019-876 5432 (Ibu)"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="min-h-11 flex-1 rounded-lg bg-brand-maroon px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setMode("view")}
          disabled={saving}
          className="min-h-11 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
