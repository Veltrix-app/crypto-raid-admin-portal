"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
import { EnvironmentAuditPanel } from "@/components/releases/EnvironmentAuditPanel";
import { ReleaseChecksPanel } from "@/components/releases/ReleaseChecksPanel";
import { ReleaseServicesPanel } from "@/components/releases/ReleaseServicesPanel";
import { ReleaseSmokePanel } from "@/components/releases/ReleaseSmokePanel";
import { ReleaseTimelinePanel } from "@/components/releases/ReleaseTimelinePanel";
import {
  fetchQaOverview,
  fetchReleaseDetail,
  updatePortalRelease,
} from "@/lib/release/release-dashboard";
import { formatReleaseLabel, getReleaseDecisionTone } from "@/lib/release/release-contract";
import type { AdminQaOverview, AdminReleaseDetail } from "@/types/entities/release";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

function stateTone(state: string) {
  if (state === "verified") {
    return "success" as const;
  }
  if (state === "degraded" || state === "rolled_back") {
    return "danger" as const;
  }
  if (["approved", "deploying", "smoke_pending", "ready_for_review"].includes(state)) {
    return "warning" as const;
  }
  return "default" as const;
}

function ReleaseLifecyclePanel({
  detail,
  onUpdated,
}: {
  detail: AdminReleaseDetail;
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  const [state, setState] = useState(detail.release.state);
  const [summary, setSummary] = useState(detail.release.summary);
  const [decisionNotes, setDecisionNotes] = useState(detail.release.decisionNotes);
  const [blockerSummary, setBlockerSummary] = useState(detail.release.blockerSummary);
  const [rollbackNotes, setRollbackNotes] = useState(detail.release.rollbackNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setState(detail.release.state);
    setSummary(detail.release.summary);
    setDecisionNotes(detail.release.decisionNotes);
    setBlockerSummary(detail.release.blockerSummary);
    setRollbackNotes(detail.release.rollbackNotes);
  }, [detail.release]);

  async function handleSave() {
    try {
      setSaving(true);
      const nextDetail = await updatePortalRelease({
        releaseId: detail.release.id,
        state,
        summary,
        decisionNotes,
        blockerSummary,
        rollbackNotes,
      });
      onUpdated(nextDetail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <OpsPanel
      eyebrow="Lifecycle"
      title="Release state and decision posture"
      description="Keep the release lifecycle explicit and capture the human reasoning behind go, watch or no-go."
    >
      <div className="grid gap-4 xl:items-start xl:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <select
            value={state}
            onChange={(event) => setState(event.target.value as typeof state)}
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="ready_for_review">Ready for review</option>
            <option value="approved">Approved</option>
            <option value="deploying">Deploying</option>
            <option value="smoke_pending">Smoke pending</option>
            <option value="verified">Verified</option>
            <option value="degraded">Degraded</option>
            <option value="rolled_back">Rolled back</option>
          </select>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="w-full rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save lifecycle"}
          </button>
        </div>

        <div className="space-y-3">
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            placeholder="Release summary"
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
          />
          <textarea
            value={decisionNotes}
            onChange={(event) => setDecisionNotes(event.target.value)}
            rows={4}
            placeholder="Decision notes"
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          <textarea
            value={blockerSummary}
            onChange={(event) => setBlockerSummary(event.target.value)}
            rows={4}
            placeholder="Blocker summary"
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
          />
          <textarea
            value={rollbackNotes}
            onChange={(event) => setRollbackNotes(event.target.value)}
            rows={4}
            placeholder="Rollback or mitigation notes"
            className="w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>
    </OpsPanel>
  );
}

function MigrationLinkPanel({
  detail,
  onUpdated,
}: {
  detail: AdminReleaseDetail;
  onUpdated: (detail: AdminReleaseDetail) => void;
}) {
  const firstLink = detail.migrationLinks[0];
  const [migrationFilename, setMigrationFilename] = useState(firstLink?.migrationFilename ?? "");
  const [reviewState, setReviewState] = useState(firstLink?.reviewState ?? "not_reviewed");
  const [runState, setRunState] = useState(firstLink?.runState ?? "pending");
  const [mitigationNotes, setMitigationNotes] = useState(firstLink?.mitigationNotes ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextLink = detail.migrationLinks[0];
    setMigrationFilename(nextLink?.migrationFilename ?? "");
    setReviewState(nextLink?.reviewState ?? "not_reviewed");
    setRunState(nextLink?.runState ?? "pending");
    setMitigationNotes(nextLink?.mitigationNotes ?? "");
  }, [detail.migrationLinks]);

  async function handleSave() {
    if (!migrationFilename.trim()) {
      return;
    }

    try {
      setSaving(true);
      const nextDetail = await updatePortalRelease({
        releaseId: detail.release.id,
        migrationLinks: [
          {
            migrationFilename,
            reviewState,
            runState,
            mitigationNotes,
          },
        ],
      });
      onUpdated(nextDetail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <OpsPanel
      eyebrow="Database"
      title="Migration linkage"
      description="Attach the migration to this release and keep the review/run posture explicit instead of carrying it in side-channel memory."
    >
      <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1.1fr)_220px_220px_auto]">
        <input
          value={migrationFilename}
          onChange={(event) => setMigrationFilename(event.target.value)}
          placeholder="Migration filename"
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
        />
        <select
          value={reviewState}
          onChange={(event) => setReviewState(event.target.value as typeof reviewState)}
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
        >
          <option value="not_reviewed">Not reviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="approved">Approved</option>
        </select>
        <select
          value={runState}
          onChange={(event) => setRunState(event.target.value as typeof runState)}
          className="rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text focus:border-primary/50 focus:outline-none"
        >
          <option value="pending">Pending</option>
          <option value="not_needed">Not needed</option>
          <option value="run">Run</option>
          <option value="blocked">Blocked</option>
        </select>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save migration"}
        </button>
      </div>

      <textarea
        value={mitigationNotes}
        onChange={(event) => setMitigationNotes(event.target.value)}
        rows={4}
        placeholder="Mitigation or rollback notes for this migration"
        className="mt-4 w-full rounded-[18px] border border-white/[0.026] bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:border-primary/50 focus:outline-none"
      />
    </OpsPanel>
  );
}

export default function ReleaseDetailPage() {
  const params = useParams<{ id: string }>();
  const role = useAdminAuthStore((state) => state.role);
  const [detail, setDetail] = useState<AdminReleaseDetail | null>(null);
  const [qaOverview, setQaOverview] = useState<AdminQaOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!params?.id) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [nextDetail, nextQaOverview] = await Promise.all([
          fetchReleaseDetail(params.id),
          fetchQaOverview().catch(() => null),
        ]);
        if (!cancelled) {
          setDetail(nextDetail);
          setQaOverview(nextQaOverview);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDetail(null);
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load release detail."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (role === "super_admin") {
      void loadDetail();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [params?.id, refreshNonce, role]);

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Release detail is internal-only"
          description="Only Veltrix super admins can inspect and operate release lifecycle, gate and smoke posture."
          tone="warning"
          actions={
            <Link
              href="/releases"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Back to releases
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
          title="Loading release detail"
          description="Veltrix is resolving the full release posture: services, checks, smoke, environment audits and migration linkage."
        />
      </AdminShell>
    );
  }

  if (error || !detail) {
    return (
      <AdminShell>
        <StatePanel
          title="Release detail could not load"
          description={error ?? "This release did not return a valid detail payload."}
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

  const releaseCommandRead = {
    now:
      detail.release.counts.blockingFailures > 0
        ? `${detail.release.counts.blockingFailures} blocking failures are still holding this release back.`
        : detail.release.counts.smokePending > 0
          ? `Hard gates are clear, but ${detail.release.counts.smokePending} smoke scenarios still need proof.`
          : "Blocking failures and smoke pressure are both currently calm on this release.",
    next:
      detail.release.counts.smokePending > 0
        ? "Record the remaining smoke outcomes before you move the lifecycle toward verified."
        : "Keep the lifecycle state and decision posture aligned so go / watch / no-go stays explicit.",
    watch:
      detail.release.counts.envWarnings > 0 || detail.release.counts.migrationLinks > 0
        ? `${detail.release.counts.envWarnings} environment warnings and ${detail.release.counts.migrationLinks} linked migrations still need watch discipline.`
        : "Environment and migration posture are currently calm for this candidate.",
  };

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Release detail"
        title={detail.release.title}
        description="Operate the full release candidate from one place: state, services, checks, smoke, environment posture and migration discipline."
        actions={
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
              {detail.release.releaseRef}
            </p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={stateTone(detail.release.state)}>
                {formatReleaseLabel(detail.release.state)}
              </OpsStatusPill>
              <OpsStatusPill tone={getReleaseDecisionTone(detail.release.decision)}>
                {formatReleaseLabel(detail.release.decision)}
              </OpsStatusPill>
              <OpsStatusPill>{detail.release.targetEnvironment}</OpsStatusPill>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/releases"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08]"
              >
                Releases
              </Link>
              <Link
                href="/qa"
                className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white transition hover:bg-white/[0.08]"
              >
                QA
              </Link>
            </div>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <OpsMetricCard
                label="Blocking failures"
                value={detail.release.counts.blockingFailures}
                emphasis={detail.release.counts.blockingFailures > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Warnings"
                value={detail.release.counts.warnings}
                emphasis={detail.release.counts.warnings > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Smoke pending"
                value={detail.release.counts.smokePending}
                emphasis={detail.release.counts.smokePending > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Env warnings"
                value={detail.release.counts.envWarnings}
                emphasis={detail.release.counts.envWarnings > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Linked migrations"
                value={detail.release.counts.migrationLinks}
                emphasis={detail.release.counts.migrationLinks > 0 ? "primary" : "default"}
              />
            </div>

            <OpsPanel
              eyebrow="Command read"
              title="Keep the release story explicit"
              description="This screen should tell you what currently blocks rollout, what still needs proof, and what still requires migration or environment discipline before the release is truly calm."
              tone="accent"
            >
              <div className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-3">
                  <OpsSnapshotRow label="Now" value={releaseCommandRead.now} />
                  <OpsSnapshotRow label="Next" value={releaseCommandRead.next} />
                  <OpsSnapshotRow label="Watch" value={releaseCommandRead.watch} />
                </div>
                <p className="text-xs leading-6 text-sub">
                  {detail.release.summary ||
                    detail.release.decisionNotes ||
                    "No extra release summary has been recorded yet, so this command read is currently driven by lifecycle, checks and smoke posture only."}
                </p>
              </div>
            </OpsPanel>
          </div>
        }
      >
        <div className="space-y-4">
          <ReleaseLifecyclePanel detail={detail} onUpdated={setDetail} />
          <MigrationLinkPanel detail={detail} onUpdated={setDetail} />
          <ReleaseServicesPanel releaseId={detail.release.id} services={detail.services} onUpdated={setDetail} />
          <ReleaseChecksPanel releaseId={detail.release.id} checks={detail.checks} onUpdated={setDetail} />
          <ReleaseSmokePanel releaseId={detail.release.id} smokeResults={detail.smokeResults} onUpdated={setDetail} />
          <EnvironmentAuditPanel
            releaseId={detail.release.id}
            audits={detail.environmentAudits}
            deployChecks={qaOverview?.deployChecks ?? null}
            onUpdated={setDetail}
          />
          <ReleaseTimelinePanel detail={detail} />
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
