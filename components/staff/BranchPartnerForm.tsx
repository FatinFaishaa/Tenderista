"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { FormError } from "@/components/ui/FormError";

export function BranchPartnerForm({ branchSlug }: { branchSlug: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/branches/${branchSlug}/branch-partners`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(`/office/${branchSlug}/branch-partners`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={150}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email (login)</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Initial password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Only needed if this email has no account yet"
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        A Partner Cawangan gets full Owner-level access to this branch only —
        Staff, Roster, Inventory, Financials, everything — but no access to your
        other branches.
      </p>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Add Partner Cawangan"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/office/${branchSlug}/branch-partners`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
