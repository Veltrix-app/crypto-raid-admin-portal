"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck } from "lucide-react";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function LoginPage() {
  const router = useRouter();
  const {
    login,
    loginWithSso,
    verifyTotp,
    isAuthenticated,
    mfaPending,
    currentAal,
    verifiedFactorCount,
    initialize,
  } = useAdminAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ssoSubmitting, setSsoSubmitting] = useState(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFeedback("");
    setSubmitting(true);

    const result = await login(email, password);

    if (!result.ok) {
      setError(result.error || "Invalid credentials.");
      setSubmitting(false);
      return;
    }

    if (result.requiresMfa) {
      setSubmitting(false);
      setFeedback("Authenticator code required before VYNTRO can finish portal access.");
      return;
    }

    router.push("/dashboard");
  }

  async function handleVerifyTotp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFeedback("");
    setSubmitting(true);

    const result = await verifyTotp(totpCode);
    if (!result.ok) {
      setError(result.error || "Invalid authenticator code.");
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleSso() {
    setError("");
    setFeedback("");
    setSsoSubmitting(true);
    const result = await loginWithSso(email);

    if (!result.ok) {
      setError(result.error || "Enterprise SSO could not be started.");
      setSsoSubmitting(false);
      return;
    }

    setFeedback("Redirecting to your workspace identity provider...");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md rounded-[20px] border border-white/[0.04] bg-white/[0.02] p-6 shadow-neon">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck size={26} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Project Access
            </p>
            <h1 className="mt-1 text-[1.45rem] font-extrabold text-text">
              Admin Portal Login
            </h1>
          </div>
        </div>

        {mfaPending ? (
          <form onSubmit={handleVerifyTotp} className="space-y-4">
            <div className="rounded-[22px] border border-primary/20 bg-primary/10 px-4 py-4 text-sm leading-6 text-sub">
              Current step-up posture: <span className="font-semibold text-text">{currentAal ?? "aal1"}</span>.
              VYNTRO detected {verifiedFactorCount} verified factor{verifiedFactorCount === 1 ? "" : "s"} and is waiting for your authenticator code.
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-text">Authenticator code</label>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                className="w-full rounded-2xl border border-white/[0.04] bg-white/[0.025] px-4 py-3 outline-none transition focus:border-primary/40"
                placeholder="123456"
                required
              />
            </div>

            {feedback ? <p className="text-sm text-primary">{feedback}</p> : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Verifying..." : "Verify and continue"}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-text">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/[0.04] bg-white/[0.025] px-4 py-3 outline-none transition focus:border-primary/40"
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
                  className="w-full rounded-2xl border border-white/[0.04] bg-white/[0.025] px-4 py-3 outline-none transition focus:border-primary/40"
                  required
                />
              </div>

              {feedback ? <p className="text-sm text-primary">{feedback}</p> : null}
              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-primary px-4 py-3 font-bold text-black transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Signing in..." : "Sign in with password"}
              </button>
            </form>

            <div className="mt-5 rounded-[18px] border border-white/10 bg-card2 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-black/20 text-text">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">Enterprise SSO</p>
                  <p className="text-xs leading-5 text-sub">
                    Use your workspace email and VYNTRO will route you into the right identity provider.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSso()}
                disabled={ssoSubmitting}
                className="mt-4 w-full rounded-2xl border border-white/12 px-4 py-3 font-semibold text-text transition hover:border-primary/30 hover:text-primary disabled:opacity-60"
              >
                {ssoSubmitting ? "Redirecting..." : "Continue with enterprise SSO"}
              </button>
            </div>
          </>
        )}

        <p className="mt-5 text-sm text-sub">Maak deze gebruiker eerst aan in Supabase Auth of koppel hem aan een enterprise identity provider.</p>
      </div>
    </div>
  );
}
