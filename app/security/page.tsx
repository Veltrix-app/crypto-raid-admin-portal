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
import { OpsCommandRead, OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

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
          description="This cockpit is reserved for VYNTRO super admins because it exposes cross-account security, compliance and request posture."
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
          description="VYNTRO is pulling enterprise policy posture, active sessions, compliance controls and request queues into one view."
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
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-2.5 md:grid-cols-4">
              <OpsMetricCard label="Weak posture" value={overview.counts.weakPostureAccounts} />
              <OpsMetricCard label="Open requests" value={overview.counts.openDataRequests} />
              <OpsMetricCard label="Active incidents" value={overview.queues.securityIncidents.length} />
              <OpsMetricCard label="SSO accounts" value={overview.counts.enterpriseHardenedAccounts} />
            </div>

            <OpsCommandRead
              eyebrow="Security command read"
              title="Read weak posture first, then choose policy cleanup, request handling, or incident control."
              description="This cockpit should tell you what is fragile, what is audit-sensitive, and where enterprise trust can erode if response timing slips."
              now={
                overview.counts.weakPostureAccounts > 0
                  ? `${overview.counts.weakPostureAccounts} accounts still need trust posture cleanup`
                  : "Account posture looks calm right now"
              }
              next={
                overview.queues.dataRequests.length > 0
                  ? `Review ${overview.queues.dataRequests.length} open export or delete requests`
                  : "No urgent request queue is waiting"
              }
              watch={
                overview.queues.securityIncidents.length > 0
                  ? `${overview.queues.securityIncidents.length} security incidents or postmortem items are open`
                  : "No active security incidents are open"
              }
              rail={
                <OpsPanel
                  eyebrow="Security routes"
                  title="Internal board"
                  description="Keep release and trust routes nearby without overloading the hero."
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <OpsStatusPill tone="default">{overview.counts.weakPostureAccounts} weak posture</OpsStatusPill>
                      <OpsStatusPill tone="default">{overview.counts.openDataRequests} requests</OpsStatusPill>
                      <OpsStatusPill tone="default">{overview.queues.securityIncidents.length} incidents</OpsStatusPill>
                    </div>
                    <Link
                      href="/releases"
                      className="inline-flex items-center rounded-full border border-white/[0.025] bg-white/[0.014] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sub transition hover:border-white/[0.045] hover:text-text"
                    >
                      Releases
                    </Link>
                  </div>
                </OpsPanel>
              }
            />
          </div>
        }
      >
        <div className="grid gap-4 xl:items-start xl:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-4">
            <SecurityOverviewPanel overview={overview} />
            <SecurityQueueTable
              title="Weak posture accounts"
              description="Accounts that still need 2FA, SSO or policy cleanup before they look enterprise-ready."
              accounts={overview.queues.weakPosture}
            />
          </div>

          <ComplianceControlsPanel controls={overview.controls} />
        </div>

        <div className="grid gap-4 xl:items-start xl:grid-cols-[1fr_1fr]">
            <OpsPanel
              eyebrow="Request queue"
              title="Data lifecycle pressure"
              description={
                overview.queues.dataRequests.length
                  ? `${overview.queues.dataRequests.length} export/delete requests currently need review.`
                  : "No export or delete requests currently need review."
              }
            >
              <div className="grid gap-2.5 md:grid-cols-2">
                <OpsMetricCard label="Open requests" value={overview.counts.openDataRequests} />
                <OpsMetricCard label="Hardened accounts" value={overview.counts.enterpriseHardenedAccounts} />
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
            >
              <div className="grid gap-2.5 md:grid-cols-2">
                <OpsMetricCard label="Active incidents" value={overview.queues.securityIncidents.length} />
                <OpsMetricCard label="Weak posture accounts" value={overview.counts.weakPostureAccounts} />
              </div>
            </OpsPanel>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
