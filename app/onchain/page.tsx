"use client";

import { useEffect, useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsPanel,
  OpsSearchInput,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import OnchainCaseDetailPanel from "@/components/onchain/OnchainCaseDetailPanel";
import OnchainCaseTimeline from "@/components/onchain/OnchainCaseTimeline";
import OnchainHealthPanel from "@/components/onchain/OnchainHealthPanel";
import OnchainQueuePanel from "@/components/onchain/OnchainQueuePanel";
import SupportEscalationPanel from "@/components/observability/SupportEscalationPanel";
import { SupportSurfaceContextPanel } from "@/components/support/SupportSurfaceContextPanel";
import type {
  OnchainCaseDetailRecord,
  OnchainCaseListRow,
  OnchainCaseTimelineEventRecord,
} from "@/components/onchain/types";
import OpsIncidentPanel from "@/components/platform/OpsIncidentPanel";
import OpsOverridePanel from "@/components/platform/OpsOverridePanel";
import { useProjectOps } from "@/hooks/useProjectOps";
import type { OnchainCaseAction } from "@/lib/onchain/onchain-actions";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type OnchainMode = "queue" | "failures" | "signals" | "resolution_log";

export default function OnchainPage() {
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const projects = useAdminPortalStore((s) => s.projects);
  const [mode, setMode] = useState<OnchainMode>("queue");
  const [search, setSearch] = useState("");
  const [onchainCases, setOnchainCases] = useState<OnchainCaseListRow[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [onchainCaseDetail, setOnchainCaseDetail] = useState<OnchainCaseDetailRecord | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<OnchainCaseTimelineEventRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const onchainOps = useProjectOps(activeProjectId);

  const activeProjectName = activeProjectId
    ? projects.find((project) => project.id === activeProjectId)?.name ?? "Active project"
    : "No active project";

  const onchainOverrideActions = [
    {
      label: "Pause provider sync",
      description:
        "Freeze provider-side sync pressure for the active project while operators stabilize failed ingest or enrichment issues.",
      objectType: "provider_sync" as const,
      objectId: "onchain-provider-rail",
      overrideType: "pause" as const,
      reason: "Provider sync paused from internal on-chain ops.",
    },
    {
      label: "Queue manual retry",
      description:
      "Mark the active project's on-chain workflow for a manual retry and enrichment pass after case review.",
      objectType: "provider_sync" as const,
      objectId: "onchain-provider-rail",
      overrideType: "manual_retry" as const,
      reason: "Manual retry queued from internal on-chain ops.",
    },
  ];

  async function loadOnchainCases(preserveSelection = true) {
    try {
      setLoadingCases(true);
      setLoadError("");
      const response = await fetch("/api/onchain/cases", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load on-chain queue.");
      }

      const rows = (payload.cases ?? []) as OnchainCaseListRow[];
      setOnchainCases(rows);
      setSelectedCaseId((current) => {
        if (preserveSelection && current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setOnchainCases([]);
      setSelectedCaseId(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load on-chain queue.");
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    void loadOnchainCases(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOnchainCaseDetail() {
      if (!selectedCaseId) {
        setOnchainCaseDetail(null);
        setTimelineEvents([]);
        return;
      }

      try {
        setLoadingDetail(true);
        const [detailResponse, timelineResponse] = await Promise.all([
          fetch(`/api/onchain/cases/${selectedCaseId}`, { cache: "no-store" }),
          fetch(`/api/onchain/cases/${selectedCaseId}/events`, { cache: "no-store" }),
        ]);
        const [detailPayload, timelinePayload] = await Promise.all([
          detailResponse.json().catch(() => null),
          timelineResponse.json().catch(() => null),
        ]);

        if (!detailResponse.ok || !detailPayload?.ok) {
          throw new Error(detailPayload?.error ?? "Failed to load on-chain case detail.");
        }
        if (!timelineResponse.ok || !timelinePayload?.ok) {
          throw new Error(timelinePayload?.error ?? "Failed to load on-chain case timeline.");
        }

        if (!active) {
          return;
        }

        setOnchainCaseDetail((detailPayload.onchainCase ?? null) as OnchainCaseDetailRecord | null);
        setTimelineEvents((timelinePayload.events ?? []) as OnchainCaseTimelineEventRecord[]);
      } catch (error) {
        if (!active) {
          return;
        }

        setOnchainCaseDetail(null);
        setTimelineEvents([]);
        setLoadError(error instanceof Error ? error.message : "Failed to load on-chain case detail.");
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadOnchainCaseDetail();

    return () => {
      active = false;
    };
  }, [selectedCaseId]);

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    const modeFiltered = onchainCases.filter((onchainCase) => {
      if (mode === "queue") {
        return onchainCase.status === "open" || onchainCase.status === "triaging";
      }
      if (mode === "failures") {
        return (
          onchainCase.caseType === "ingress_rejected" ||
          onchainCase.caseType === "ingress_retry_failed" ||
          onchainCase.caseType === "enrichment_failed" ||
          onchainCase.caseType === "provider_sync_failure" ||
          onchainCase.status === "blocked" ||
          onchainCase.status === "retry_queued"
        );
      }
      if (mode === "signals") {
        return (
          onchainCase.caseType === "unmatched_project_asset" ||
          onchainCase.caseType === "unlinked_wallet_activity" ||
          onchainCase.caseType === "suspicious_onchain_pattern" ||
          onchainCase.status === "needs_project_input" ||
          onchainCase.escalationState !== "none"
        );
      }
      return onchainCase.status === "resolved" || onchainCase.status === "dismissed";
    });

    if (!term) {
      return modeFiltered;
    }

    return modeFiltered.filter((onchainCase) =>
      [
        onchainCase.projectName,
        onchainCase.username,
        onchainCase.walletAddress,
        onchainCase.assetSymbol,
        onchainCase.caseType,
        onchainCase.summary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [mode, onchainCases, search]);

  useEffect(() => {
    if (!selectedCaseId || filteredCases.some((onchainCase) => onchainCase.id === selectedCaseId)) {
      return;
    }
    setSelectedCaseId(filteredCases[0]?.id ?? null);
  }, [filteredCases, selectedCaseId]);

  const openCount = onchainCases.filter(
    (onchainCase) =>
      onchainCase.status === "open" ||
      onchainCase.status === "triaging" ||
      onchainCase.status === "blocked"
  ).length;
  const criticalCount = onchainCases.filter(
    (onchainCase) => onchainCase.severity === "high" || onchainCase.severity === "critical"
  ).length;
  const awaitingProjectCount = onchainCases.filter(
    (onchainCase) => onchainCase.status === "needs_project_input"
  ).length;
  const retryQueuedCount = onchainCases.filter(
    (onchainCase) => onchainCase.status === "retry_queued"
  ).length;

  async function handleInternalAction(action: OnchainCaseAction, notes: string) {
    if (!selectedCaseId) {
      return;
    }

    try {
      setActionBusy(action);
      setLoadError("");

      const response = await fetch(`/api/onchain/cases/${selectedCaseId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, notes }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to apply on-chain action.");
      }

      setOnchainCaseDetail((payload.onchainCase ?? null) as OnchainCaseDetailRecord | null);
      setTimelineEvents((payload.events ?? []) as OnchainCaseTimelineEventRecord[]);
      await loadOnchainCases();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to apply on-chain action.");
    } finally {
      setActionBusy(null);
    }
  }

  const failureCount = onchainCases.filter((row) =>
    [
      "ingress_rejected",
      "ingress_retry_failed",
      "enrichment_failed",
      "provider_sync_failure",
    ].includes(row.caseType)
  ).length;
  const signalCount = onchainCases.filter((row) =>
    [
      "unmatched_project_asset",
      "unlinked_wallet_activity",
      "suspicious_onchain_pattern",
    ].includes(row.caseType)
  ).length;
  const resolvedCount = onchainCases.filter(
    (row) => row.status === "resolved" || row.status === "dismissed"
  ).length;

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="On-chain operations"
        title="On-chain"
        description="Run the internal on-chain queue, resolve ingest and enrichment failures, and keep every project-safe recovery action explainable."
      >
        <OnchainHealthPanel
          eyebrow="Internal posture"
          title="On-chain resolution workspace"
          description="Internal on-chain ops now runs on explicit on-chain cases, bounded project follow-through and visible recovery history instead of raw retry buttons."
          metrics={[
            {
              label: "Open cases",
              value: openCount,
              emphasis: openCount > 0 ? "warning" : "default",
            },
            {
              label: "High severity",
              value: criticalCount,
              emphasis: criticalCount > 0 ? "warning" : "default",
            },
            {
              label: "Awaiting project",
              value: awaitingProjectCount,
              emphasis: awaitingProjectCount > 0 ? "primary" : "default",
            },
            {
              label: "Retry queued",
              value: retryQueuedCount,
              emphasis: retryQueuedCount > 0 ? "warning" : "default",
            },
          ]}
        />

        <OpsPanel
          eyebrow="Work modes"
          title="Internal on-chain workflows"
          description="Split the workspace by what the operator is trying to do right now: clear the active queue, stabilize failures, inspect signals, or audit finished outcomes."
          action={
            <SegmentToggle
              value={mode}
              onChange={setMode}
              options={[
                { value: "queue", label: "Queue" },
                { value: "failures", label: "Failures" },
                { value: "signals", label: "Signals" },
                { value: "resolution_log", label: "Resolution log" },
              ]}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <ModeCard
              label="Queue"
              body="Fresh on-chain cases that still need an operator to pick up the recovery path."
            />
            <ModeCard
              label="Failures"
              body="Ingress, retry, enrichment and provider-sync failures that deserve immediate stabilization."
            />
            <ModeCard
              label="Signals"
              body="Wallet, asset and suspicious-pattern cases that need evidence review or project follow-through."
            />
            <ModeCard
              label="Resolution log"
              body="Resolved or dismissed on-chain outcomes that should remain explainable afterwards."
            />
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Volume read"
          title="Current on-chain mix"
          description="A quick read on how much live ingest, enrichment and signal pressure sits underneath the case queue."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <ModeCard label="Failures" body={`${failureCount} failure-led cases are currently open or recently touched.`} />
            <ModeCard label="Signals" body={`${signalCount} signal-led cases are currently visible in the workspace.`} />
            <ModeCard label="Retry queued" body={`${retryQueuedCount} cases currently have a retry, rerun or rescan queued.`} />
            <ModeCard label="Resolved" body={`${resolvedCount} cases already have a recorded outcome in the resolution log.`} />
          </div>
        </OpsPanel>

        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search case type, project, wallet, asset or summary..."
            ariaLabel="Search on-chain queue"
            name="onchain-search"
          />
          <div className="rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-sub md:col-span-2">
            {loadError || "All on-chain actions write both a case timeline event and a broader audit record."}
          </div>
        </OpsFilterBar>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <OnchainQueuePanel
            eyebrow="Case queue"
            title="Internal on-chain cases"
            description="Pick an on-chain case from the queue to inspect wallet, asset, source and recovery context."
            rows={filteredCases}
            loading={loadingCases}
            selectedCaseId={selectedCaseId}
            onSelect={setSelectedCaseId}
            emptyState="No on-chain cases match the current workspace filters."
            scope="internal"
          />

          <div className="grid gap-6">
            <OnchainCaseDetailPanel
              scope="internal"
              onchainCase={onchainCaseDetail}
              loading={loadingDetail}
              availableActions={[
                "annotate",
                "request_project_input",
                "escalate",
                "retry",
                "rerun_enrichment",
                "rescan_assets",
                "resolve",
                "dismiss",
              ]}
              actionBusy={actionBusy}
              onAction={handleInternalAction}
            />

            <OnchainCaseTimeline
              events={timelineEvents}
              loading={loadingDetail}
              emptyState="No timeline events have been recorded for this on-chain case yet."
            />
          </div>
        </div>

        <OpsPanel
          eyebrow="Platform Core"
          title={`Incidents and overrides for ${activeProjectName}`}
          description="Keep the active project's provider workflow and incident response visible while on-chain ops work the higher-risk ingest and enrichment cases."
        >
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Project ops incidents
                </p>
                <p className="mt-2 text-sm leading-6 text-sub">
                  Active project incidents still surface here so on-chain operators can see
                  whether provider instability or callback failures are contributing to the current
                  case load.
                </p>
              </div>
              <OpsIncidentPanel
                incidents={onchainOps.incidents}
                emptyTitle={activeProjectId ? "No open incidents" : "Select an active project"}
                emptyDescription={
                  activeProjectId
                    ? "No active incidents are currently open for this project."
                    : "Pick an active project to inspect incident pressure."
                }
                workingIncidentId={onchainOps.workingIncidentId}
                onUpdateStatus={onchainOps.updateIncidentStatus}
              />
            </div>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Project overrides
                </p>
                <p className="mt-2 text-sm leading-6 text-sub">
              Override provider noise or pause the sync workflow when the active project needs a
                  calmer on-chain recovery window.
                </p>
              </div>
              <OpsOverridePanel
                overrides={onchainOps.overrides}
                quickActions={onchainOverrideActions}
                emptyTitle={activeProjectId ? "No active overrides" : "Select an active project"}
                emptyDescription={
                  activeProjectId
                    ? "No overrides are currently active for this project."
                    : "Pick an active project to manage overrides."
                }
                creatingOverride={onchainOps.creatingOverride}
                workingOverrideId={onchainOps.workingOverrideId}
                onCreateOverride={onchainOps.createOverride}
                onResolveOverride={onchainOps.resolveOverride}
              />
            </div>
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Support posture"
          title={`Escalations for ${activeProjectName}`}
          description="When sync, enrichment or provider drift starts repeating, keep one accountable owner and one next recovery move visible here."
        >
          <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <SupportEscalationPanel
              title="On-chain support escalations"
              description="Use this workspace when on-chain issues cross queue, provider and deploy boundaries and need stronger operator follow-through."
              projectId={activeProjectId}
              requireProjectContext
              emptyTitle={activeProjectId ? "No on-chain escalations" : "Select an active project"}
              emptyDescription={
                activeProjectId
                  ? "No support escalations are currently open for this project's on-chain workspace."
                  : "Pick an active project to inspect on-chain escalations."
              }
            />
            <SupportSurfaceContextPanel
              title="Support handoffs into on-chain"
              description="Tickets that start in support but require sync, ingest or recovery work stay visible here with the original handoff reason."
              handoffType="onchain"
              targetProjectId={activeProjectId}
            />
          </div>
        </OpsPanel>
      </PortalPageFrame>
    </AdminShell>
  );
}

function ModeCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{body}</p>
    </div>
  );
}
