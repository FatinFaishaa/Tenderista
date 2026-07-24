"use client";


import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-brand-cream">
      {/* Decorative sparkles */}
      <span className="absolute top-8 left-10 text-lg text-brand-gold/40">✦</span>
      <span className="absolute top-20 right-14 text-sm text-brand-gold/30">✦</span>
      <span className="absolute top-40 left-1/4 text-xs text-brand-maroon/20">✦</span>

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-14">
        {/* Logo section */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-widest text-zinc-400">EST.</span>
          <img
            src="/brand/mascot-chick.png"
            alt="Tenderista mascot"
            width={110}
            height={120}
            className="drop-shadow-sm"
          />
          <span className="text-xs font-semibold tracking-widest text-zinc-400">2022</span>
        </div>
        <h1 className="font-display -mt-2 text-5xl text-brand-maroon">Tenderista</h1>
        <p className="mt-1 text-xs font-semibold tracking-[0.3em] text-zinc-500">
          FRIED CHICKEN
        </p>
        <div className="mt-2 flex items-center gap-2 text-brand-gold/50">
          <span className="h-px w-8 bg-brand-gold/30" />
          <span className="text-xs">♥</span>
          <span className="h-px w-8 bg-brand-gold/30" />
        </div>

        {/* Login card */}
        <div className="mt-8 w-full max-w-sm rounded-3xl border border-brand-gold/20 bg-white p-6 shadow-lg">
          <div className="text-center">
            <p className="text-lg text-brand-gold/60">✦ ✦</p>
            <h2 className="font-display mt-1 text-2xl text-zinc-900">Welcome back!</h2>
            <p className="mt-1 text-sm text-zinc-500">Sign in to your branch</p>
          </div>

          <div className="my-4 flex items-center gap-2">
            <span className="h-px flex-1 border-t border-dashed border-zinc-200" />
            <span className="text-xs text-red-400">♥</span>
            <span className="h-px flex-1 border-t border-dashed border-zinc-200" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {error}
              </p>
            )}

            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-800">
                Email or phone
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <User className="h-4 w-4 shrink-0 text-zinc-400" />
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  placeholder="Enter your email or phone"
                  required
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-800">Password</label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                <Lock className="h-4 w-4 shrink-0 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="shrink-0 text-zinc-400"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-maroon text-base font-bold text-white disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-zinc-500">
            <span className="text-red-400">♥</span> Let&apos;s make every bite count.
          </p>
        </div>
      </div>

      {/* Bottom maroon curve */}
      <div className="relative mt-10 h-28 rounded-t-[100%] bg-brand-maroon">
        <p className="absolute inset-x-0 top-8 text-center text-xs font-semibold tracking-[0.2em] text-white/80">
          GOOD FOOD, HAPPY MOOD
        </p>
      </div>
    </div>
  );
}
