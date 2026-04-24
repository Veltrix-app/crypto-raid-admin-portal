"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { LoadingState, StatePanel } from "@/components/layout/state/StatePrimitives";
import { SecurityOverviewPanel } from "@/components/security/SecurityOverviewPanel";
import { SecurityQueueTable } from "@/components/security/SecurityQueueTable";
import { ComplianceControlsPanel } from "@/components/security/ComplianceControlsPanel";
import { fetchSecurityOverview } from "@/lib/security/security-actions";
import type { AdminSecurityOverview } from "@/types/entities/security";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { OpsMetricCard, OpsPanel, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

export default function SecurityPage() {
  const role = useAdminAuthStore((s) => s.role);
  const [overview, setOverview] = useState<AdminSecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const nextOverview = await fetchSecurityOverview();
        if (!active) {
          return;
        }

        setOverview(nextOverview);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setOverview(null);
        setError(loadError instanceof Error ? loadError.message : "Failed to load security overview.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (role === "super_admin") {
      void load();
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [refreshNonce, role]);

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Security Control is internal-only"
          description="This cockpit is reserved for Veltrix super admins because it exposes cross-account security, compliance and request posture."
          tone="warning"
          actions={
            <Link
              href="/overview"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Back to overview
            </Link>
          }
        />
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading security cockpit"
          description="Veltrix is pulling enterprise policy posture, active sessions, compliance controls and request queues into one view."
        />
      </AdminShell>
    );
  }

  if (error || !overview) {
    return (
      <AdminShell>
        <StatePanel
          title="Security cockpit could not load"
          description={error ?? "The security layer did not return a valid overview payload."}
          tone="warning"
          actions={
            <button
              type="button"
              onClick={() => setRefreshNonce((value) => value + 1)}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Retry
            </button>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Security control"
        title="Security"
        description="Run trust, compliance and enterprise identity posture from one internal workspace."
        actions={
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">Veltrix internal</p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={overview.counts.weakPostureAccounts > 0 ? "warning" : "success"}>
                {overview.counts.weakPostureAccounts} weak accounts
              </OpsStatusPill>
              <OpsStatusPill tone={overview.counts.openDataRequests > 0 ? "warning" : "default"}>
                {overview.counts.openDataRequests} open requests
              </OpsStatusPill>
            </div>
            <Link
              href="/releases"
              className="inline-flex items-center rounded-full border border-white/12 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-text transition hover:border-primary/30 hover:text-primary"
            >
              Releases
            </Link>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard
                label="Weak posture"
                value={overview.counts.weakPostureAccounts}
                emphasis={overview.counts.weakPostureAccounts > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Open requests"
                value={overview.counts.openDataRequests}
                emphasis={overview.counts.openDataRequests > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Active incidents"
                value={overview.queues.securityIncidents.length}
                emphasis={overview.queues.securityIncidents.length > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="SSO accounts"
                value={overview.counts.enterpriseHardenedAccounts}
                emphasis={overview.counts.enterpriseHardenedAccounts > 0 ? "primary" : "default"}
              />
            </div>

            <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.82),rgba(12,16,24,0.92))] px-3.5 py-3.5 shadow-[0_10px_34px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Security command read
                  </p>
                  <h2 className="mt-1.5 text-[0.94rem] font-semibold tracking-tight text-text">
                    Read weak posture first, then decide whether the next move is policy cleanup, request handling, or incident control.
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-sub">
                    This cockpit should tell you what is fragile, what is audit-sensitive, and where enterprise trust can erode if response timing slips.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={overview.counts.weakPostureAccounts > 0 ? "warning" : "success"}>
                    {overview.counts.weakPostureAccounts} weak posture
                  </OpsStatusPill>
                  <OpsStatusPill tone={overview.counts.openDataRequests > 0 ? "warning" : "default"}>
                    {overview.counts.openDataRequests} requests
                  </OpsStatusPill>
                  <OpsStatusPill tone={overview.queues.securityIncidents.length > 0 ? "warning" : "success"}>
                    {overview.queues.securityIncidents.length} incidents
                  </OpsStatusPill>
                </div>
              </div>

              <div className="mt-3.5 grid gap-2.5 lg:grid-cols-3">
                <OpsSnapshotRow
                  label="Now"
                  value={
                    overview.counts.weakPostureAccounts > 0
                      ? `${overview.counts.weakPostureAccounts} accounts still need trust posture cleanup`
                      : "Account posture looks calm right now"
                  }
                />
                <OpsSnapshotRow
                  label="Next"
                  value={
                    overview.queues.dataRequests.length > 0
                      ? `Review ${overview.queues.dataRequests.length} open export or delete requests`
                      : "No urgent request queue is waiting"
                  }
                />
                <OpsSnapshotRow
                  label="Watch"
                  value={
                    overview.queues.securityIncidents.length > 0
                      ? `${overview.queues.securityIncidents.length} security incidents or postmortem items are open`
                      : "No active security incidents are open"
                  }
                />
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <SecurityOverviewPanel overview={overview} />

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SecurityQueueTable
              title="Weak posture accounts"
              description="Accounts that still need 2FA, SSO or policy cleanup before they look enterprise-ready."
              accounts={overview.queues.weakPosture}
            />
            <ComplianceControlsPanel controls={overview.controls} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <OpsPanel
              eyebrow="Request queue"
              title="Data lifecycle pressure"
              description={
                overview.queues.dataRequests.length
                  ? `${overview.queues.dataRequests.length} export/delete requests currently need review.`
                  : "No export or delete requests currently need review."
              }
              tone={overview.queues.dataRequests.length ? "accent" : "default"}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <OpsMetricCard label="Open requests" value={overview.counts.openDataRequests} emphasis={overview.counts.openDataRequests > 0 ? "warning" : "default"} />
                <OpsMetricCard label="Hardened accounts" value={overview.counts.enterpriseHardenedAccounts} emphasis={overview.counts.enterpriseHardenedAccounts > 0 ? "primary" : "default"} />
              </div>
            </OpsPanel>
            <OpsPanel
              eyebrow="Incident queue"
              title="Security incidents"
              description={
                overview.queues.securityIncidents.length
                  ? `${overview.queues.securityIncidents.length} active security incidents or postmortem items are open.`
                  : "No active security incidents are currently open."
              }
              tone={overview.queues.securityIncidents.length ? "accent" : "default"}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <OpsMetricCard label="Active incidents" value={overview.queues.securityIncidents.length} emphasis={overview.queues.securityIncidents.length > 0 ? "warning" : "default"} />
                <OpsMetricCard label="Weak posture accounts" value={overview.counts.weakPostureAccounts} emphasis={overview.counts.weakPostureAccounts > 0 ? "warning" : "default"} />
              </div>
            </OpsPanel>
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
