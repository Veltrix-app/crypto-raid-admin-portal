"use client";

import type {
  CommunityHealthSignal,
  CommunityJourneyOutcomeRecord,
  CommunityOwnerRecommendation,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type ExecutionSummary = {
  automations: number;
  recentAutomationRuns: number;
  recentPlaybookRuns: number;
  recentCaptainActions: number;
  recentFailureCount: number;
  recentSuccessCount: number;
};

type CaptainSummary = {
  activeAssignments: number;
  queueItemCount: number;
  blockedCount: number;
  dueSoonCount: number;
  escalatedCount: number;
};

type Props = {
  mode: "owner" | "captain";
  recommendations: CommunityOwnerRecommendation[];
  healthSignals: CommunityHealthSignal[];
  journeyOutcomes: CommunityJourneyOutcomeRecord;
  execution: ExecutionSummary;
  captainWorkspace: CaptainSummary;
};

export function CommunityOutcomesPanel({
  mode,
  recommendations,
  healthSignals,
  journeyOutcomes,
  execution,
  captainWorkspace,
}: Props) {
  const orderedOutcomes = [
    journeyOutcomes.onboarding,
    journeyOutcomes.comeback,
    journeyOutcomes.activation,
    journeyOutcomes.retention,
  ];

  return (
    <OpsPanel
      eyebrow={mode === "owner" ? "Owner mode" : "Project outcomes"}
      title={
        mode === "owner"
          ? "Recommended next play and funnel outcomes"
          : "Project outcomes and owner guidance"
      }
      description="This rail keeps the page aggregate-first: funnel conversion, queue health and recommended moves stay visible without drifting into member-level management."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Recent failures"
            value={execution.recentFailureCount}
            sub="Automation, playbook and captain failures visible in V5."
            emphasis={execution.recentFailureCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Recent successes"
            value={execution.recentSuccessCount}
            sub="Successful project execution signals sampled from recent runs."
            emphasis={execution.recentSuccessCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Captain coverage"
            value={captainWorkspace.activeAssignments}
            sub="Active captain seats covering the current project."
            emphasis={captainWorkspace.activeAssignments > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Queue pressure"
            value={captainWorkspace.blockedCount + captainWorkspace.escalatedCount}
            sub="Blocked and escalated captain queue pressure."
            emphasis={captainWorkspace.blockedCount + captainWorkspace.escalatedCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-sm font-bold text-text">Recommended next play</p>
            <p className="mt-2 text-sm text-sub">
              The owner rail keeps the highest-leverage moves visible for this project.
            </p>
            <div className="mt-4 space-y-3">
              {recommendations.length > 0 ? (
                recommendations.map((recommendation) => (
                  <div key={recommendation.key} className="rounded-[20px] border border-line bg-card px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{recommendation.title}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">{recommendation.summary}</p>
                      </div>
                      <OpsStatusPill tone={recommendation.priority === "high" ? "warning" : recommendation.priority === "medium" ? "success" : "default"}>
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

          <div className="space-y-4">
            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Journey outcomes</p>
              <p className="mt-2 text-sm text-sub">
                Onboarding and comeback stay visible as aggregate lanes, not as a member list.
              </p>
              <div className="mt-4 space-y-3">
                {orderedOutcomes.map((outcome) => (
                  <div key={outcome.key} className="rounded-[20px] border border-line bg-card px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{outcome.label}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          {outcome.completedCount} completed from {outcome.startedCount} started. {outcome.recentCompletedCount} completed recently.
                        </p>
                      </div>
                      <OpsStatusPill tone={outcome.completionRate >= 70 ? "success" : outcome.completionRate >= 50 ? "default" : "warning"}>
                        {outcome.completionRate}%
                      </OpsStatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Health signals</p>
              <div className="mt-4 grid gap-3">
                {healthSignals.map((signal) => (
                  <div key={signal.key} className="rounded-[20px] border border-line bg-card px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{signal.label}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">{signal.summary}</p>
                      </div>
                      <OpsStatusPill tone={signal.tone === "danger" ? "warning" : signal.tone === "success" ? "success" : signal.tone === "warning" ? "default" : "default"}>
                        {signal.value}
                      </OpsStatusPill>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
