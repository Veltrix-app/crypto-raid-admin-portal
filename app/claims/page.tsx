"use client";

import { useEffect, useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import SupportEscalationPanel from "@/components/observability/SupportEscalationPanel";
import OpsIncidentPanel from "@/components/platform/OpsIncidentPanel";
import OpsOverridePanel from "@/components/platform/OpsOverridePanel";
import PayoutCaseDetailPanel from "@/components/payout/PayoutCaseDetailPanel";
import PayoutCaseTimeline from "@/components/payout/PayoutCaseTimeline";
import PayoutQueuePanel from "@/components/payout/PayoutQueuePanel";
import type {
  PayoutCaseDetailRecord,
  PayoutCaseListRow,
  PayoutCaseTimelineEventRecord,
} from "@/components/payout/types";
import { useProjectOps } from "@/hooks/useProjectOps";
import type { PayoutCaseAction } from "@/lib/payout/payout-actions";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

type ClaimsMode = "queue" | "incidents" | "disputes" | "resolution_log";

export default function ClaimsPage() {
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const projects = useAdminPortalStore((s) => s.projects);
  const claims = useAdminPortalStore((s) => s.claims);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const [mode, setMode] = useState<ClaimsMode>("queue");
  const [search, setSearch] = useState("");
  const [payoutCases, setPayoutCases] = useState<PayoutCaseListRow[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [payoutCaseDetail, setPayoutCaseDetail] = useState<PayoutCaseDetailRecord | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<PayoutCaseTimelineEventRecord[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const claimsOps = useProjectOps(activeProjectId);

  const activeProjectName = activeProjectId
    ? projects.find((project) => project.id === activeProjectId)?.name ?? "Active project"
    : "No active project";

  const claimOverrideActions = [
    {
    label: "Pause claim workflow",
      description:
        "Freeze claim processing for the active project while the team works through payout blockers or delivery issues.",
      objectType: "claim" as const,
      objectId: "fulfillment-queue",
      overrideType: "pause" as const,
    reason: "Claim workflow paused from internal payout ops.",
    },
    {
      label: "Queue manual retry",
      description:
      "Mark the active project's payout workflow for a manual retry pass after blocked claims or finalization failures are reviewed.",
      objectType: "claim" as const,
      objectId: "fulfillment-queue",
      overrideType: "manual_retry" as const,
      reason: "Manual retry queued from internal payout ops.",
    },
  ];

  async function loadPayoutCases(preserveSelection = true) {
    try {
      setLoadingCases(true);
      setLoadError("");
      const response = await fetch("/api/payout/cases", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to load payout queue.");
      }

      const rows = (payload.cases ?? []) as PayoutCaseListRow[];
      setPayoutCases(rows);
      setSelectedCaseId((current) => {
        if (preserveSelection && current && rows.some((row) => row.id === current)) {
          return current;
        }
        return rows[0]?.id ?? null;
      });
    } catch (error) {
      setPayoutCases([]);
      setSelectedCaseId(null);
      setLoadError(error instanceof Error ? error.message : "Failed to load payout queue.");
    } finally {
      setLoadingCases(false);
    }
  }

  useEffect(() => {
    void loadPayoutCases(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPayoutCaseDetail() {
      if (!selectedCaseId) {
        setPayoutCaseDetail(null);
        setTimelineEvents([]);
        return;
      }

      try {
        setLoadingDetail(true);
        const [detailResponse, timelineResponse] = await Promise.all([
          fetch(`/api/payout/cases/${selectedCaseId}`, { cache: "no-store" }),
          fetch(`/api/payout/cases/${selectedCaseId}/events`, { cache: "no-store" }),
        ]);
        const [detailPayload, timelinePayload] = await Promise.all([
          detailResponse.json().catch(() => null),
          timelineResponse.json().catch(() => null),
        ]);

        if (!detailResponse.ok || !detailPayload?.ok) {
          throw new Error(detailPayload?.error ?? "Failed to load payout case detail.");
        }
        if (!timelineResponse.ok || !timelinePayload?.ok) {
          throw new Error(timelinePayload?.error ?? "Failed to load payout case timeline.");
        }

        if (!active) {
          return;
        }

        setPayoutCaseDetail((detailPayload.payoutCase ?? null) as PayoutCaseDetailRecord | null);
        setTimelineEvents(
          (timelinePayload.events ?? []) as PayoutCaseTimelineEventRecord[]
        );
      } catch (error) {
        if (!active) {
          return;
        }

        setPayoutCaseDetail(null);
        setTimelineEvents([]);
        setLoadError(error instanceof Error ? error.message : "Failed to load payout case detail.");
      } finally {
        if (active) {
          setLoadingDetail(false);
        }
      }
    }

    void loadPayoutCaseDetail();

    return () => {
      active = false;
    };
  }, [selectedCaseId]);

  const filteredCases = useMemo(() => {
    const term = search.trim().toLowerCase();
    const modeFiltered = payoutCases.filter((payoutCase) => {
      if (mode === "queue") {
        return (
          payoutCase.status === "open" ||
          payoutCase.status === "triaging" ||
          payoutCase.caseType === "claim_review" ||
          payoutCase.caseType === "manual_payout_review"
        );
      }
      if (mode === "incidents") {
        return (
          payoutCase.caseType === "delivery_failure" ||
          payoutCase.caseType === "reward_inventory_risk" ||
          payoutCase.caseType === "campaign_finalization_failure" ||
          payoutCase.status === "blocked" ||
          payoutCase.status === "retry_queued"
        );
      }
      if (mode === "disputes") {
        return (
          payoutCase.caseType === "payout_dispute" ||
          payoutCase.status === "needs_project_input" ||
          payoutCase.escalationState !== "none"
        );
      }
      return payoutCase.status === "resolved" || payoutCase.status === "dismissed";
    });

    if (!term) {
      return modeFiltered;
    }

    return modeFiltered.filter((payoutCase) =>
      [
        payoutCase.projectName,
        payoutCase.username,
        payoutCase.rewardTitle,
        payoutCase.campaignTitle,
        payoutCase.caseType,
        payoutCase.summary,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [mode, payoutCases, search]);

  useEffect(() => {
    if (!selectedCaseId || filteredCases.some((payoutCase) => payoutCase.id === selectedCaseId)) {
      return;
    }
    setSelectedCaseId(filteredCases[0]?.id ?? null);
  }, [filteredCases, selectedCaseId]);

  const openCount = payoutCases.filter(
    (payoutCase) =>
      payoutCase.status === "open" ||
      payoutCase.status === "triaging" ||
      payoutCase.status === "blocked"
  ).length;
  const criticalCount = payoutCases.filter(
    (payoutCase) => payoutCase.severity === "high" || payoutCase.severity === "critical"
  ).length;
  const awaitingProjectCount = payoutCases.filter(
    (payoutCase) => payoutCase.status === "needs_project_input"
  ).length;
  const retryQueuedCount = payoutCases.filter(
    (payoutCase) => payoutCase.status === "retry_queued"
  ).length;
  const pendingClaims = claims.filter((claim) => claim.status === "pending").length;
  const lowInventoryRewards = rewards.filter(
    (reward) => !reward.unlimitedStock && reward.stock !== undefined && reward.stock <= 3
  ).length;

  async function handleInternalAction(action: PayoutCaseAction, notes: string) {
    if (!selectedCaseId) {
      return;
    }

    try {
      setActionBusy(action);
      setLoadError("");

      const response = await fetch(`/api/payout/cases/${selectedCaseId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, notes }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to apply payout action.");
      }

      setPayoutCaseDetail((payload.payoutCase ?? null) as PayoutCaseDetailRecord | null);
      setTimelineEvents((payload.events ?? []) as PayoutCaseTimelineEventRecord[]);
      await loadPayoutCases();
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to apply payout action.");
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Payout operations"
        title="Claims"
        description="Run the internal payout queue, clear blocked claims, retry failed campaign finalizations and keep every resolution explainable."
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard
                label="Open cases"
                value={openCount}
                emphasis={openCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="High severity"
                value={criticalCount}
                emphasis={criticalCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Awaiting project"
                value={awaitingProjectCount}
                emphasis={awaitingProjectCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Retry queued"
                value={retryQueuedCount}
                emphasis={retryQueuedCount > 0 ? "warning" : "default"}
              />
            </div>

            <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.92))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Payout command read
                  </p>
                  <h2 className="mt-2 text-[1.02rem] font-extrabold tracking-tight text-text">
                    Keep the queue calm, separate incidents from disputes, and make each resolution legible.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    This workspace is no longer a mixed wall of claims and retry buttons. Treat it
                    as a bounded operator rail: clear the right cases, keep blocked claims
                    explainable and leave the active project surface visible while you work.
                  </p>
                </div>

                <SegmentToggle
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "queue", label: "Queue" },
                    { value: "incidents", label: "Incidents" },
                    { value: "disputes", label: "Disputes" },
                    { value: "resolution_log", label: "Resolution log" },
                  ]}
                />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="grid gap-3 md:grid-cols-3">
                  <ClaimsSignalCard
                    label="Queue pressure"
                    value={`${pendingClaims} pending claims`}
                    hint="Fresh reviews and manual payouts still waiting for a clear operator decision."
                    tone={pendingClaims > 0 ? "warning" : "default"}
                  />
                  <ClaimsSignalCard
                    label="Inventory risk"
                    value={`${lowInventoryRewards} low-stock rewards`}
                    hint="Reward availability that can turn normal delivery into payout drag."
                    tone={lowInventoryRewards > 0 ? "warning" : "default"}
                  />
                  <ClaimsSignalCard
                    label="Escalation load"
                    value={`${payoutCases.filter((row) => row.escalationState !== "none").length} escalated`}
                    hint="Cases that already need cross-team follow-through instead of more queue churn."
                    tone={payoutCases.some((row) => row.escalationState !== "none") ? "warning" : "default"}
                  />
                </div>

                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap gap-2">
                    <OpsStatusPill tone="default">{activeProjectName}</OpsStatusPill>
                    <OpsStatusPill tone={mode === "incidents" || mode === "disputes" ? "warning" : "success"}>
                      {mode.replace("_", " ")}
                    </OpsStatusPill>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <OpsSnapshotRow
                      label="Now"
                      value={getClaimsModeRead(mode)}
                    />
                    <OpsSnapshotRow
                      label="Next"
                      value={selectedCaseId ? "Work the selected payout case" : "Choose the first visible payout case"}
                    />
                    <OpsSnapshotRow
                      label="Watch"
                      value={
                        payoutCases.filter((row) => row.status === "blocked").length > 0
                          ? `${payoutCases.filter((row) => row.status === "blocked").length} blocked cases`
                          : "No blocked cases right now"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <OpsPanel
          eyebrow="Workspace lanes"
          title="How to read this payout workspace"
          description="Each mode changes the operator question. Keep the case queue and detail rail in sync instead of treating the page like a flat backlog."
          tone="accent"
        >
          <div className="grid gap-4 md:grid-cols-4">
            <ModeCard
              label="Queue"
              body="Fresh claim reviews and manual payout cases that still need an operator decision."
            />
            <ModeCard
              label="Incidents"
              body="Delivery failures, low stock pressure and campaign finalization failures that deserve immediate attention."
            />
            <ModeCard
              label="Disputes"
              body="Cases waiting on project input or bouncing back into internal payout ops."
            />
            <ModeCard
              label="Resolution log"
              body="Resolved or dismissed payout outcomes that should remain explainable afterwards."
            />
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Pressure mix"
          title="What is bending the queue right now"
          description="Use this shorter read to separate routine throughput from the issues that can poison fulfillment quality."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <ModeCard label="Pending claims" body={`${pendingClaims} claims are still waiting for review or delivery.`} />
            <ModeCard label="Low stock" body={`${lowInventoryRewards} rewards are at or below the low-stock threshold.`} />
            <ModeCard label="Blocked cases" body={`${payoutCases.filter((row) => row.status === "blocked").length} payout cases are currently blocked.`} />
            <ModeCard label="Escalated" body={`${payoutCases.filter((row) => row.escalationState !== "none").length} cases currently need cross-team follow-through.`} />
          </div>
        </OpsPanel>

        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search case type, project, contributor, reward or summary..."
            ariaLabel="Search payout queue"
            name="payout-search"
          />
          <div className="rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-sub md:col-span-2">
            {loadError || "Every payout action writes both a case timeline event and a broader audit record."}
          </div>
        </OpsFilterBar>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <PayoutQueuePanel
            eyebrow="Case queue"
            title="Internal payout cases"
            description="Pick a payout case from the queue to inspect reward, claim, delivery and campaign context."
            rows={filteredCases}
            loading={loadingCases}
            selectedCaseId={selectedCaseId}
            onSelect={setSelectedCaseId}
            emptyState="No payout cases match the current workspace filters."
            scope="internal"
          />

          <div className="grid gap-6">
            <PayoutCaseDetailPanel
              scope="internal"
              payoutCase={payoutCaseDetail}
              loading={loadingDetail}
              availableActions={[
                "annotate",
                "request_project_input",
                "escalate",
                "retry",
                "resolve",
                "dismiss",
                "freeze_reward",
                "pause_claim_rail",
                "payout_override",
              ]}
              actionBusy={actionBusy}
              onAction={handleInternalAction}
            />

            <PayoutCaseTimeline
              events={timelineEvents}
              loading={loadingDetail}
              emptyState="No timeline events have been recorded for this payout case yet."
            />
          </div>
        </div>

        <OpsPanel
          eyebrow="Platform Core"
          title={`Incidents and overrides for ${activeProjectName}`}
          description="Keep the active project's claim workflow and payout overrides visible while internal ops work the higher-risk payout cases."
        >
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Project ops incidents
                </p>
                <p className="mt-2 text-sm leading-6 text-sub">
                  Active project incidents still surface here so payout operators can see whether
                  provider instability or other runtime issues are contributing to the current case
                  load.
                </p>
              </div>
              <OpsIncidentPanel
                incidents={claimsOps.incidents}
                emptyTitle={
                  activeProjectId ? "No open incidents" : "Select an active project"
                }
                emptyDescription={
                  activeProjectId
                    ? "No active incidents are currently open for this project."
                    : "Pick an active project to inspect incident pressure."
                }
                workingIncidentId={claimsOps.workingIncidentId}
                onUpdateStatus={claimsOps.updateIncidentStatus}
              />
            </div>
            <div className="space-y-4">
              <div className="rounded-[24px] border border-line bg-card2 px-5 py-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Project overrides
                </p>
                <p className="mt-2 text-sm leading-6 text-sub">
              Override payout noise or pause the claim workflow when the active project needs a
                  calmer resolution window.
                </p>
              </div>
              <OpsOverridePanel
                overrides={claimsOps.overrides}
                quickActions={claimOverrideActions}
                emptyTitle={
                  activeProjectId ? "No active overrides" : "Select an active project"
                }
                emptyDescription={
                  activeProjectId
                    ? "No overrides are currently active for this project."
                    : "Pick an active project to manage overrides."
                }
                creatingOverride={claimsOps.creatingOverride}
                workingOverrideId={claimsOps.workingOverrideId}
                onCreateOverride={claimsOps.createOverride}
                onResolveOverride={claimsOps.resolveOverride}
              />
            </div>
          </div>
        </OpsPanel>

        <OpsPanel
          eyebrow="Support posture"
          title={`Escalations for ${activeProjectName}`}
          description="When payout pressure repeats or starts waiting on provider or project input, keep the named owner and next action visible here."
        >
          <SupportEscalationPanel
            title="Payout support escalations"
            description="Claims operators can keep cross-surface payout issues accountable here instead of losing them in ad hoc queue notes."
            projectId={activeProjectId}
            requireProjectContext
            emptyTitle={activeProjectId ? "No payout escalations" : "Select an active project"}
            emptyDescription={
              activeProjectId
                  ? "No support escalations are currently open for this project's payout workspace."
                : "Pick an active project to inspect payout escalations."
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

function ClaimsSignalCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className={`mt-3 text-lg font-extrabold ${tone === "warning" ? "text-amber-300" : "text-text"}`}>
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}

function getClaimsModeRead(mode: ClaimsMode) {
  if (mode === "incidents") {
    return "Separate delivery failures from normal claim traffic";
  }
  if (mode === "disputes") {
    return "Keep project-input and escalation-heavy cases explicit";
  }
  if (mode === "resolution_log") {
    return "Audit finished outcomes and resolution history";
  }
  return "Clear fresh reviews and manual payout cases first";
}
