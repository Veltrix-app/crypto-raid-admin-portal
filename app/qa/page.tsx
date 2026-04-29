"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { LoadingState, StatePanel } from "@/components/layout/state/StatePrimitives";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { QaReadinessBoard } from "@/components/qa/QaReadinessBoard";
import { fetchQaOverview } from "@/lib/release/release-dashboard";
import type { AdminQaOverview } from "@/types/entities/release";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function QaPage() {
  const role = useAdminAuthStore((state) => state.role);
  const [overview, setOverview] = useState<AdminQaOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setError(null);
        const nextOverview = await fetchQaOverview();
        if (!cancelled) {
          setOverview(nextOverview);
        }
      } catch (loadError) {
        if (!cancelled) {
          setOverview(null);
          setError(loadError instanceof Error ? loadError.message : "Failed to load QA overview.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (role === "super_admin") {
      void loadOverview();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [refreshNonce, role]);

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="QA control is internal-only"
          description="Only VYNTRO super admins can inspect release readiness, smoke packs and environment warnings across the stack."
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
          title="Loading QA board"
          description="VYNTRO is combining release candidates, smoke posture, environment warnings and deploy hygiene into one readiness board."
        />
      </AdminShell>
    );
  }

  if (error || !overview) {
    return (
      <AdminShell>
        <StatePanel
          title="QA board could not load"
          description={error ?? "The QA workspace did not return a valid overview payload."}
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
        eyebrow="QA readiness"
        title="QA"
        description="One internal board for release verification, smoke completeness, environment warnings and the surfaces that still need operator proof."
        actions={
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">VYNTRO internal</p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={overview.blockingChecks.length > 0 ? "warning" : "success"}>
                {overview.blockingChecks.length} blocking failures
              </OpsStatusPill>
              <OpsStatusPill tone={overview.incompleteSmoke.length > 0 ? "warning" : "default"}>
                {overview.incompleteSmoke.length} smoke pending
              </OpsStatusPill>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/releases"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08]"
              >
                Releases
              </Link>
            </div>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <OpsMetricCard
                label="Waiting on QA"
                value={overview.releaseCandidatesWaitingOnQa.length}
                emphasis={overview.releaseCandidatesWaitingOnQa.length > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Blocking failures"
                value={overview.blockingChecks.length}
                emphasis={overview.blockingChecks.length > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Smoke pending"
                value={overview.incompleteSmoke.length}
                emphasis={overview.incompleteSmoke.length > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Env warnings"
                value={overview.environmentWarnings.length}
                emphasis={overview.environmentWarnings.length > 0 ? "warning" : "default"}
              />
            </div>

            <OpsPanel
              eyebrow="Command read"
              title="Keep QA in go / watch / no-go language"
              description="The board should make one thing obvious: which candidate is active, what still blocks launch, and what still needs operator proof before anyone calls a release safe."
              tone="accent"
            >
              <div className="grid gap-3 lg:grid-cols-3">
                <OpsSnapshotRow
                  label="Now"
                  value={
                    overview.activeRelease
                      ? `${overview.activeRelease.title} is the active release candidate currently under QA.`
                      : "No active release candidate is currently moving through QA."
                  }
                />
                <OpsSnapshotRow
                  label="Next"
                  value={`${overview.blockingChecks.length} blocking checks and ${overview.incompleteSmoke.length} smoke items still need explicit operator attention.`}
                />
                <OpsSnapshotRow
                  label="Watch"
                  value={`${overview.environmentWarnings.length} environment warnings and ${overview.deployChecks?.warningCount ?? 0} deploy hygiene warnings are still on watch.`}
                />
              </div>
            </OpsPanel>
          </div>
        }
      >
        <QaReadinessBoard overview={overview} />
      </PortalPageFrame>
    </AdminShell>
  );
}
