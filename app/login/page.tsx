"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, initialize } = useAdminAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await login(email, password);

    if (!result.ok) {
      setError(result.error || "Invalid credentials.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md rounded-[32px] border border-line bg-card p-8 shadow-neon">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Project Access
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-text">
              Admin Portal Login
            </h1>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-text">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none transition focus:border-primary/40"
              placeholder="admin@project.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-text">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none transition focus:border-primary/40"
              required
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-sm text-sub">
          Maak deze gebruiker eerst aan in Supabase Auth.
        </p>
      </div>
    </div>
  );
}