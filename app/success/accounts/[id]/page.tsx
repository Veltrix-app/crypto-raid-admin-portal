"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { OpsMetricCard, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { SuccessAccountDetail } from "@/components/success/SuccessAccountDetail";
import type { AdminSuccessAccountDetail } from "@/types/entities/success";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function SuccessAccountPage({ params }: PageProps) {
  const [accountId, setAccountId] = useState<string>("");
  const [detail, setDetail] = useState<AdminSuccessAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then((resolved) => setAccountId(resolved.id));
  }, [params]);

  async function loadDetail(nextAccountId: string) {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/success/accounts/${nextAccountId}`, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; detail?: AdminSuccessAccountDetail; error?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.detail) {
        throw new Error(payload?.error ?? "Failed to load success account detail.");
      }

      setDetail(payload.detail);
    } catch (nextError) {
      setDetail(null);
      setError(nextError instanceof Error ? nextError.message : "Failed to load success account detail.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!accountId) {
      return;
    }

    void loadDetail(accountId);
  }, [accountId]);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Success account"
        title={detail ? detail.accountName : "Success account"}
        description="Drill into one workspace account with its activation posture, derived signals, member health read and follow-up layer."
        actions={
          detail ? (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Success state</p>
              <div className="flex flex-wrap gap-2">
                <OpsStatusPill tone={detail.workspaceHealthState === "stalled" ? "warning" : "success"}>
                  {detail.workspaceHealthState.replaceAll("_", " ")}
                </OpsStatusPill>
                <OpsStatusPill
                  tone={
                    detail.successHealthState === "expansion_ready"
                      ? "success"
                      : detail.successHealthState === "churn_risk"
                        ? "warning"
                        : "default"
                  }
                >
                  {detail.successHealthState.replaceAll("_", " ")}
                </OpsStatusPill>
              </div>
              <Link
                href="/success"
                className="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary"
              >
                Back to success
              </Link>
            </div>
          ) : undefined
        }
        statusBand={
          detail ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <OpsMetricCard label="Workspace" value={detail.accountName} emphasis="primary" />
                <OpsMetricCard label="Projects" value={detail.projectCount} />
                <OpsMetricCard label="Campaigns" value={detail.activeCampaignCount} emphasis={detail.activeCampaignCount > 0 ? "primary" : "default"} />
                <OpsMetricCard label="Blockers" value={detail.blockers.length} emphasis={detail.blockers.length > 0 ? "warning" : "default"} />
              </div>

              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.92))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      Account command read
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
                      Read activation drag first, then decide whether this account needs rescue, product guidance, or expansion follow-up.
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      This drilldown should keep the missing setup steps, current success posture and the clearest next move visible before you drop into tasks and notes.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <OpsSnapshotRow label="Now" value={detail.blockers[0] ?? "Activation flow is moving without a dominant blocker"} />
                  <OpsSnapshotRow label="Next" value={detail.nextBestActionLabel ?? "Continue workspace activation"} />
                  <OpsSnapshotRow label="Watch" value={detail.successHealthState === "expansion_ready" ? "Expansion posture is building" : detail.successHealthState === "churn_risk" ? "Watch churn pressure closely" : "No severe success drift right now"} />
                </div>
              </div>
            </div>
          ) : undefined
        }
      >
        {loading ? (
          <div className="rounded-[22px] border border-line bg-card2 px-4 py-4 text-sm text-sub">
            Loading success account...
          </div>
        ) : error ? (
          <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-sm text-rose-200">
            {error}
          </div>
        ) : detail ? (
          <SuccessAccountDetail detail={detail} onRefresh={() => loadDetail(accountId)} />
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}
