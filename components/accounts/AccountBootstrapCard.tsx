"use client";

import { useMemo, useState } from "react";
import { Building2, PlusCircle } from "lucide-react";
import { bootstrapPortalAccount } from "@/lib/accounts/account-onboarding";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { OpsPanel } from "@/components/layout/ops/OpsPrimitives";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

function deriveWorkspaceName(email: string | null) {
  const label = email?.split("@")[0]?.trim();
  if (!label) {
    return "New workspace";
  }

  return label.toLowerCase().endsWith("workspace") ? label : `${label} workspace`;
}

export default function AccountBootstrapCard() {
  const email = useAdminAuthStore((s) => s.email);
  const { refresh } = useAccountEntryGuard();
  const [workspaceName, setWorkspaceName] = useState(() => deriveWorkspaceName(email));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => workspaceName.trim().length > 0, [workspaceName]);

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await bootstrapPortalAccount(workspaceName.trim());
      await refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Workspace bootstrap did not complete."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <OpsPanel
      eyebrow="Workspace bootstrap"
      title="Create the first workspace account"
      description="This portal session is authenticated, but it still needs the account layer that sits above projects. Create that once and the next move becomes first-project setup."
      tone="accent"
    >
      <div className="space-y-4">
        <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
          Workspace name
        </label>
        <input
          value={workspaceName}
          onChange={(event) => setWorkspaceName(event.target.value)}
          className="w-full rounded-[22px] border border-line bg-black/20 px-4 py-4 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          placeholder="Founders workspace"
        />

        {error ? (
          <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || !canSubmit}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle size={16} />
            {loading ? "Creating workspace..." : "Create workspace"}
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card2 px-4 py-3 text-sm font-semibold text-sub">
            <Building2 size={16} />
            Creates owner membership and onboarding state
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
