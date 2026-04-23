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
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

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
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Veltrix internal</p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={overview.counts.weakPostureAccounts > 0 ? "warning" : "success"}>
                {overview.counts.weakPostureAccounts} weak accounts
              </OpsStatusPill>
              <OpsStatusPill tone={overview.counts.openDataRequests > 0 ? "warning" : "default"}>
                {overview.counts.openDataRequests} open requests
              </OpsStatusPill>
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
            <StatePanel
              title="Request queue"
              description={
                overview.queues.dataRequests.length
                  ? `${overview.queues.dataRequests.length} export/delete requests currently need review.`
                  : "No export or delete requests currently need review."
              }
              tone={overview.queues.dataRequests.length ? "warning" : "success"}
            />
            <StatePanel
              title="Security incidents"
              description={
                overview.queues.securityIncidents.length
                  ? `${overview.queues.securityIncidents.length} active security incidents or postmortem items are open.`
                  : "No active security incidents are currently open."
              }
              tone={overview.queues.securityIncidents.length ? "warning" : "success"}
            />
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
