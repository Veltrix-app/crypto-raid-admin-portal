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
import SupportEscalationPanel from "@/components/observability/SupportEscalationPanel";
import OpsIncidentPanel from "@/components/platform/OpsIncidentPanel";
import OpsOverridePanel from "@/components/platform/OpsOverridePanel";
import TrustCaseDetailPanel from "@/components/trust/TrustCaseDetailPanel";
import TrustCaseTimeline from "@/components/trust/TrustCaseTimeline";
import TrustHealthPanel from "@/components/trust/TrustHealthPanel";
import TrustQueuePanel from "@/components/trust/TrustQueuePanel";
import type {
  TrustCaseDetailRecord,
  TrustCaseListRow,
  TrustCaseTimelineEventRecord,
} from "@/components/trust/types";
import { useProjectOps } from "@/hooks/useProjectOps";
import type { TrustCaseAction } from "@/lib/trust/trust-actions";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type ModerationMode = "queue" | "investigations" | "escalations" | "resolution_log";

export default function ModerationPage() {
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const projects = useAdminPortalStore((s) => s.projects);
  const [mode, setMode] = useState<ModerationMode>("queue");
  const [search, setSearch] = useState("");
  const [trustCases, setTrustCases] = useState<TrustCaseListRow[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [trustCaseDetail, setTrustCaseDetail] = useState<TrustCaseDetailRecord | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TrustCaseTimelineEventRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const moderationOps = useProjectOps(activeProjectId);

  const activeProjectName = activeProjectId
    ? projects.find((project) => project.id === activeProjectId)?.name ?? "Active project"
    : "No active project";

  const moderationOverrideActions = [
    {
      label: "Pause provider rail",
      description:
        "Freeze provider-side moderation inputs for the active project while the team stabilizes callbacks or suspicious ingestion noise.",
      objectType: "provider_sync" as const,
      objectId: "moderation-provider-rail",
      overrideType: "pause" as const,
      reason: "Provider rail paused from internal trust ops.",
    },
    {
      label: "Mute incident noise",
      description:
        "Silence repetitive moderation and provider alerts while trust ops resolve the current incident.",
      objectType: "provider_sync" as const,
      objectId: "moderation-provider-rail",
      overrideType: "mute" as const,
      reason: "Provider rail muted from internal trust ops.",
    },
  ];

  async function loadTrustCases(preserveSelection = true) {
    try {
      setLoadingCases(true);
      setLoadError("");
      const response = await fetch("/api/trust/cases", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load trust queue.");
      }

      const rows = (payload.cases ?? []) as TrustCaseListRow[];
      setTrustCases(rows);
      setSelectedCaseId((current) => {
        if (preserveSelection && current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setTrustCases([]);
      setSelectedCaseId(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load trust queue.");
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    void loadTrustCases(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTrustCaseDetail() {
      if (!selectedCaseId) {
        setTrustCaseDetail(null);
        setTimelineEvents([]);
        return;
      }

      try {
        setLoadingDetail(true);
        const [detailResponse, timelineResponse] = await Promise.all([
          fetch(`/api/trust/cases/${selectedCaseId}`, { cache: "no-store" }),
          fetch(`/api/trust/cases/${selectedCaseId}/events`, { cache: "no-store" }),
        ]);
        const [detailPayload, timelinePayload] = await Promise.all([
          detailResponse.json().catch(() => null),
          timelineResponse.json().catch(() => null),
        ]);

        if (!detailResponse.ok || !detailPayload?.ok) {
          throw new Error(detailPayload?.error ?? "Failed to load trust case detail.");
        }
        if (!timelineResponse.ok || !timelinePayload?.ok) {
          throw new Error(timelinePayload?.error ?? "Failed to load trust case timeline.");
        }

        if (!active) {
          return;
        }

        setTrustCaseDetail((detailPayload.trustCase ?? null) as TrustCaseDetailRecord | null);
        setTimelineEvents(
          (timelinePayload.events ?? []) as TrustCaseTimelineEventRecord[]
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setTrustCaseDetail(null);
        setTimelineEvents([]);
        setLoadError(error instanceof Error ? error.message : "Failed to load trust case detail.");
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadTrustCaseDetail();

    return () => {
      active = false;
    };
  }, [selectedCaseId]);

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    const modeFiltered = trustCases.filter((trustCase) => {
      if (mode === "queue") {
        return trustCase.status === "open" || trustCase.status === "triaging";
      }
      if (mode === "investigations") {
        return (
          trustCase.status === "triaging" ||
          trustCase.severity === "high" ||
          trustCase.severity === "critical"
        );
      }
      if (mode === "escalations") {
        return (
          trustCase.status === "escalated" ||
          trustCase.status === "needs_project_input" ||
          trustCase.escalationState !== "none"
        );
      }
      return trustCase.status === "resolved" || trustCase.status === "dismissed";
    });

    if (!term) {
      return modeFiltered;
    }

    return modeFiltered.filter((trustCase) =>
      [trustCase.projectName, trustCase.username, trustCase.caseType, trustCase.summary]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [mode, search, trustCases]);

  useEffect(() => {
    if (!selectedCaseId || filteredCases.some((trustCase) => trustCase.id === selectedCaseId)) {
      return;
    }
    setSelectedCaseId(filteredCases[0]?.id ?? null);
  }, [filteredCases, selectedCaseId]);

  const openCount = trustCases.filter(
    (trustCase) => trustCase.status === "open" || trustCase.status === "triaging"
  ).length;
  const criticalCount = trustCases.filter(
    (trustCase) => trustCase.severity === "high" || trustCase.severity === "critical"
  ).length;
  const awaitingProjectCount = trustCases.filter(
    (trustCase) => trustCase.status === "needs_project_input"
  ).length;
  const escalatedCount = trustCases.filter(
    (trustCase) =>
      trustCase.status === "escalated" || trustCase.escalationState !== "none"
  ).length;

  async function handleInternalAction(action: TrustCaseAction, notes: string) {
    if (!selectedCaseId) {
      return;
    }

    try {
      setActionBusy(action);
      setLoadError("");

      const response = await fetch(`/api/trust/cases/${selectedCaseId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, notes }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to apply trust action.");
      }

      setTrustCaseDetail((payload.trustCase ?? null) as TrustCaseDetailRecord | null);
      setTimelineEvents((payload.events ?? []) as TrustCaseTimelineEventRecord[]);
      await loadTrustCases();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to apply trust action.");
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Trust operations"
        title="Moderation"
        description="Run the internal trust queue, work investigations, coordinate project input and keep every resolution explainable."
      >
        <TrustHealthPanel
          eyebrow="Internal posture"
          title="Trust and fraud workspace"
          description="Internal trust ops now runs on explicit cases, explicit escalations and explicit resolution history instead of improvised review flags."
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
              label: "Escalated",
              value: escalatedCount,
              emphasis: escalatedCount > 0 ? "warning" : "default",
            },
          ]}
        />

        <OpsPanel
          eyebrow="Work modes"
          title="Internal trust lanes"
          description="Split the workspace by what the operator is trying to do right now: clear the queue, push active investigations, coordinate escalations, or audit finished outcomes."
          action={
            <SegmentToggle
              value={mode}
              onChange={setMode}
              options={[
                { value: "queue", label: "Queue" },
                { value: "investigations", label: "Investigations" },
                { value: "escalations", label: "Escalations" },
                { value: "resolution_log", label: "Resolution log" },
              ]}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <ModeCard
              label="Queue"
              body="Fresh trust cases that still need an operator to pick them up."
            />
            <ModeCard
              label="Investigations"
              body="High-signal cases that deserve deeper evidence review and manual judgment."
            />
            <ModeCard
              label="Escalations"
              body="Cases waiting on project input or bouncing back from project reviewers."
            />
            <ModeCard
              label="Resolution log"
              body="Resolved or dismissed outcomes that should remain explainable afterwards."
            />
          </div>
        </OpsPanel>

        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search case type, project, contributor or summary..."
            ariaLabel="Search trust queue"
            name="trust-search"
          />
          <div className="rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-sub md:col-span-2">
            {loadError || "All trust actions write both a case timeline event and a broader audit record."}
          </div>
        </OpsFilterBar>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <TrustQueuePanel
            eyebrow="Case queue"
            title="Internal trust cases"
            description="Pick a case from the queue to inspect its evidence, status posture and escalation state."
            rows={filteredCases}
            loading={loadingCases}
            selectedCaseId={selectedCaseId}
            onSelect={setSelectedCaseId}
            emptyState="No trust cases match the current workspace filters."
            scope="internal"
          />

          <div className="grid gap-6">
            <TrustCaseDetailPanel
              scope="internal"
              trustCase={trustCaseDetail}
              loading={loadingDetail}
              availableActions={[
                "annotate",
                "request_project_input",
                "escalate",
                "resolve",
                "dismiss",
                "mute_member",
                "freeze_reward_eligibility",
                "trust_override",
                "reward_override",
              ]}
              actionBusy={actionBusy}
              onAction={handleInternalAction}
            />

            <TrustCaseTimeline
              events={timelineEvents}
              loading={loadingDetail}
              emptyState="No timeline events have been recorded for this trust case yet."
            />
          </div>
        </div>

        <OpsPanel
          eyebrow="Platform Core"
          title={`Incidents and overrides for ${activeProjectName}`}
          description="Keep the active project's provider rail and incident response visible while trust ops work the higher-risk trust cases."
        >
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Project ops incidents
                </p>
                <p className="mt-2 text-sm leading-6 text-sub">
                  Active project incidents still surface here so trust operators can see whether
                  provider instability or callback failures are contributing to the current case
                  load.
                </p>
              </div>
              <OpsIncidentPanel
                incidents={moderationOps.incidents}
                emptyTitle={
                  activeProjectId ? "No open incidents" : "Select an active project"
                }
                emptyDescription={
                  activeProjectId
                    ? "No active incidents are currently open for this project."
                    : "Pick an active project to inspect incident pressure."
                }
                workingIncidentId={moderationOps.workingIncidentId}
                onUpdateStatus={moderationOps.updateIncidentStatus}
              />
            </div>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Project overrides
                </p>
                <p className="mt-2 text-sm leading-6 text-sub">
                  Override provider noise or pause the rail when the active project needs a calmer
                  investigation window.
                </p>
              </div>
              <OpsOverridePanel
                overrides={moderationOps.overrides}
                quickActions={moderationOverrideActions}
                emptyTitle={
                  activeProjectId ? "No active overrides" : "Select an active project"
                }
                emptyDescription={
                  activeProjectId
                    ? "No overrides are currently active for this project."
                    : "Pick an active project to manage overrides."
                }
                creatingOverride={moderationOps.creatingOverride}
                workingOverrideId={moderationOps.workingOverrideId}
                onCreateOverride={moderationOps.createOverride}
                onResolveOverride={moderationOps.resolveOverride}
              />
            </div>
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Support posture"
          title={`Escalations for ${activeProjectName}`}
          description="When trust work starts crossing queue, project-input and provider boundaries, keep one explicit owner and next action visible here."
        >
          <SupportEscalationPanel
            title="Trust support escalations"
            description="Use this rail when moderation pressure can no longer be explained by one trust case or one provider incident alone."
            projectId={activeProjectId}
            requireProjectContext
            emptyTitle={activeProjectId ? "No trust escalations" : "Select an active project"}
            emptyDescription={
              activeProjectId
                ? "No support escalations are currently open for this project's trust rail."
                : "Pick an active project to inspect trust escalations."
            }
          />
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
