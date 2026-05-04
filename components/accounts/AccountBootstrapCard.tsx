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
    <div id="workspace-bootstrap">
      <OpsPanel
        eyebrow="Workspace bootstrap"
        title="Name the workspace account"
        description="Create the account layer once. The first project and launch cockpit unlock directly after this."
        tone="accent"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
              Workspace name
            </label>
            <input
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              className="mt-2 w-full rounded-[16px] border border-white/[0.026] bg-white/[0.014] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/20"
              placeholder="Founders workspace"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={loading || !canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircle size={16} />
            {loading ? "Creating..." : "Create workspace"}
          </button>
        </div>

        {error ? (
          <div className="mt-3 rounded-[18px] border border-rose-400/20 bg-rose-500/[0.055] px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/[0.026] bg-white/[0.014] px-3.5 py-2 text-[12px] font-semibold text-sub">
            <Building2 size={15} />
            Creates owner membership and onboarding state
          </div>
        )}
      </OpsPanel>
    </div>
  );
}
