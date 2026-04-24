"use client";

import type {
  CommunityCaptainCoverageSignal,
  CommunityCohortSnapshot,
  CommunityHealthRollup,
  CommunityHealthSignal,
  CommunityJourneyOutcomeRecord,
  CommunityOwnerRecommendation,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type ExecutionSummary = {
  automations: number;
  activeAutomationCount: number;
  readyAutomationCount: number;
  blockedAutomationCount: number;
  degradedAutomationCount: number;
  recentAutomationRuns: number;
  recentPlaybookRuns: number;
  recentCaptainActions: number;
  recentFailureCount: number;
  recentSuccessCount: number;
  automationSuccessRate: number;
};

type CaptainSummary = {
  activeAssignments: number;
  queueItemCount: number;
  blockedCount: number;
  dueSoonCount: number;
  escalatedCount: number;
  overdueCount: number;
  highPriorityCount: number;
  unassignedCount: number;
};

type Props = {
  mode: "owner" | "captain";
  recommendations: CommunityOwnerRecommendation[];
  healthSignals: CommunityHealthSignal[];
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  execution: ExecutionSummary;
  captainWorkspace: CaptainSummary;
  cohortSnapshots: CommunityCohortSnapshot[];
  healthRollups: CommunityHealthRollup[];
  captainCoverage: CommunityCaptainCoverageSignal;
};

function formatPercent(value: number) {
  return `${Math.max(0, Math.round(value))}%`;
}

export function CommunityOutcomesPanel({
  mode,
  recommendations,
  healthSignals,
  journeyOutcomes,
  execution,
  captainWorkspace,
  cohortSnapshots,
  healthRollups,
  captainCoverage,
}: Props) {
  const orderedOutcomes = [
    journeyOutcomes.onboarding,
    journeyOutcomes.comeback,
    journeyOutcomes.activation,
    journeyOutcomes.retention,
  ];
  const unresolvedPressure =
    captainWorkspace.overdueCount +
    captainWorkspace.unassignedCount +
    execution.blockedAutomationCount +
    execution.degradedAutomationCount;
  const visibleRollups = healthRollups.length > 0 ? healthRollups : healthSignals;

  return (
    <OpsPanel
      eyebrow={mode === "owner" ? "Owner mode" : "Project outcomes"}
      title={
        mode === "owner"
          ? "Recommended next play and operating feedback"
          : "Project outcomes and owner guidance"
      }
      description="This rail keeps the page aggregate-first: automation health, captain effectiveness, cohort pressure and funnel conversion stay visible without drifting into member-level management."
    >
      <div className="space-y-5">
        <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Outcome command read
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">
                Read this rail in order: execution health, captain effectiveness, then cohort and journey pressure. That keeps the panel aggregate-first instead of drifting into a member-by-member wall.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={execution.automationSuccessRate >= 70 ? "success" : "warning"}>
                Execution {formatPercent(execution.automationSuccessRate)}
              </OpsStatusPill>
              <OpsStatusPill tone={captainCoverage.coverageRate >= 70 ? "success" : "warning"}>
                Coverage {formatPercent(captainCoverage.coverageRate)}
              </OpsStatusPill>
              <OpsStatusPill tone={unresolvedPressure > 0 ? "warning" : "default"}>
                {unresolvedPressure} unresolved
              </OpsStatusPill>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-6">
          <OpsMetricCard
            label="Success rate"
            value={formatPercent(execution.automationSuccessRate)}
            sub="Recent automation success across recorded execution."
            emphasis={
              execution.automationSuccessRate >= 70
                ? "primary"
                : execution.automationSuccessRate > 0
                  ? "warning"
                  : "default"
            }
          />
          <OpsMetricCard
            label="Ready rails"
            value={execution.readyAutomationCount}
            sub="Automations prepared for the next owner move."
            emphasis={execution.readyAutomationCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Degraded rails"
            value={execution.blockedAutomationCount + execution.degradedAutomationCount}
            sub="Execution rails currently stalled or drifting."
            emphasis={execution.blockedAutomationCount + execution.degradedAutomationCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Captain coverage"
            value={formatPercent(captainCoverage.coverageRate)}
            sub="How much of the intended captain surface is actively covered."
            emphasis={captainCoverage.coverageRate >= 70 ? "primary" : captainCoverage.coverageRate > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="High priority queue"
            value={captainWorkspace.highPriorityCount}
            sub="Captain actions currently marked high or urgent."
            emphasis={captainWorkspace.highPriorityCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Unresolved pressure"
            value={unresolvedPressure}
            sub="Overdue, unassigned and degraded pressure still sitting in the rail."
            emphasis={unresolvedPressure > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.96fr_1.04fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Recommended next play</p>
              <p className="mt-2 text-sm text-sub">
                The owner rail keeps the highest-leverage moves visible for this project.
              </p>
              <div className="mt-4 space-y-3">
                {recommendations.length > 0 ? (
                  recommendations.map((recommendation, index) => (
                    <div
                      key={recommendation.key}
                      className={`rounded-[20px] border px-4 py-4 ${
                        index === 0
                          ? "border-primary/25 bg-primary/10"
                          : "border-line bg-card"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text">{recommendation.title}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">{recommendation.summary}</p>
                        </div>
                        <OpsStatusPill
                          tone={
                            recommendation.priority === "high"
                              ? "warning"
                              : recommendation.priority === "medium"
                                ? "success"
                                : "default"
                          }
                        >
                          {recommendation.priority}
                        </OpsStatusPill>
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                        {recommendation.actionLabel}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                    No owner recommendations are active yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Health rollups</p>
              <p className="mt-2 text-sm text-sub">
                These are the aggregate signals the owner should read before changing community posture.
              </p>
              <div className="mt-4 space-y-3">
                {visibleRollups.length > 0 ? (
                  visibleRollups.map((signal) => (
                    <div key={signal.key} className="rounded-[20px] border border-line bg-card px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text">{signal.label}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">{signal.summary}</p>
                        </div>
                        <OpsStatusPill
                          tone={
                            signal.tone === "danger"
                              ? "warning"
                              : signal.tone === "success"
                                ? "success"
                                : signal.tone === "warning"
                                  ? "default"
                                  : "default"
                          }
                        >
                          {signal.value}
                        </OpsStatusPill>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                    No health rollups are active yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Journey outcomes</p>
              <p className="mt-2 text-sm text-sub">
                Onboarding, comeback and retention stay visible as community lanes, not as a member list.
              </p>
              <div className="mt-4 space-y-3">
                {orderedOutcomes.map((outcome) => (
                  <div key={outcome.key} className="rounded-[20px] border border-line bg-card px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{outcome.label}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          {outcome.completedCount} completed from {outcome.startedCount} started.{" "}
                          {outcome.recentCompletedCount} completed recently.
                        </p>
                      </div>
                      <OpsStatusPill
                        tone={
                          outcome.completionRate >= 70
                            ? "success"
                            : outcome.completionRate >= 50
                              ? "default"
                              : "warning"
                        }
                      >
                        {outcome.completionRate}%
                      </OpsStatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Cohort posture</p>
              <p className="mt-2 text-sm text-sub">
                Aggregate segments that explain where growth or trust pressure is building.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {cohortSnapshots.length > 0 ? (
                  cohortSnapshots.map((snapshot) => (
                    <div key={snapshot.key} className="rounded-[20px] border border-line bg-card px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text">{snapshot.label}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">
                            {snapshot.readyCount} ready · {snapshot.blockedCount} blocked · trust{" "}
                            {snapshot.averageTrust.toFixed(1)}
                          </p>
                        </div>
                        <OpsStatusPill tone={snapshot.blockedCount > 0 ? "warning" : "success"}>
                          {snapshot.memberCount}
                        </OpsStatusPill>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub md:col-span-2">
                    No cohort snapshots are available yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
