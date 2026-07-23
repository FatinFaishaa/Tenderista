"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ClosingChecklistPhotoUpload({
  branchSlug,
  allCompleted,
  existingSubmission,
}: {
  branchSlug: string;
  allCompleted: boolean;
  existingSubmission: { submittedByName: string; submittedAt: string } | null;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch(`/api/branches/${branchSlug}/closing-checklist-submissions`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit photo.");
        setPreview(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  if (existingSubmission) {
    return (
      <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-900 dark:bg-green-950">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          ✓ Photo submitted by {existingSubmission.submittedByName}
        </p>
        <p className="text-xs text-green-600 dark:text-green-400">
          {new Date(existingSubmission.submittedAt).toLocaleTimeString("en-MY", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  }

  if (!allCompleted) {
    return (
      <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
        Complete every item above to unlock photo submission.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={onFileSelected}
        className="hidden"
        disabled={uploading}
      />
      {preview && (
        <img src={preview} alt="Preview" className="mb-2 h-32 w-32 rounded-lg object-cover" />
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="min-h-11 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {uploading ? "Uploading…" : "📷 Take Photo & Submit"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
