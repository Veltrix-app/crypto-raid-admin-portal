"use client";

import type {
  CommunityAutomationRecord,
  CommunityCohortSnapshot,
  CommunityHealthRollup,
} from "@/components/community/community-config";
import {
  COMMUNITY_AUTOMATION_POSTURE_LABELS,
  COMMUNITY_AUTOMATION_SEQUENCE_LABELS,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  newcomerCount: number;
  reactivationCount: number;
  watchlistCount: number;
  automations: CommunityAutomationRecord[];
  cohortSnapshots: CommunityCohortSnapshot[];
  healthRollups: CommunityHealthRollup[];
  onboardingCompletionRate: number;
  comebackCompletionRate: number;
  onboardingRecentCompleted: number;
  comebackRecentCompleted: number;
  runningAutomationId: string | null;
  onRunAutomation: (automationId: string) => void;
};

function formatTimestamp(value: string) {
  return value ? new Date(value).toLocaleString() : "Not scheduled";
}

function findCohortSnapshot(
  snapshots: CommunityCohortSnapshot[],
  key: CommunityCohortSnapshot["key"]
) {
  return snapshots.find((snapshot) => snapshot.key === key) ?? null;
}

export function CommunityFunnelsPanel({
  newcomerCount,
  reactivationCount,
  watchlistCount,
  automations,
  cohortSnapshots,
  healthRollups,
  onboardingCompletionRate,
  comebackCompletionRate,
  onboardingRecentCompleted,
  comebackRecentCompleted,
  runningAutomationId,
  onRunAutomation,
}: Props) {
  const funnelAutomations = automations.filter(
    (automation) =>
      automation.automationType === "newcomer_pulse" ||
      automation.automationType === "reactivation_pulse"
  );
  const newcomer = findCohortSnapshot(cohortSnapshots, "newcomer");
  const reactivation = findCohortSnapshot(cohortSnapshots, "reactivation");
  const conversionSignal =
    healthRollups.find((rollup) => rollup.key === "conversion_posture") ?? null;
  const retentionSignal =
    healthRollups.find((rollup) => rollup.key === "retention_posture") ?? null;

  return (
    <OpsPanel
      eyebrow="Funnels"
      title="Onboarding and comeback execution"
      description="Funnels should feel like controlled rails with visible posture, not like one-off waves that disappear into the bot runtime."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <OpsMetricCard
            label="Starter queue"
            value={newcomerCount}
            sub={`${newcomer?.readyCount ?? 0} newcomer seats are already reachable.`}
            emphasis={newcomerCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Comeback queue"
            value={reactivationCount}
            sub={`${reactivation?.readyCount ?? 0} comeback seats are already armed.`}
            emphasis={reactivationCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Watch drag"
            value={watchlistCount}
            sub="Contributors who should not be pulled into funnel pressure blindly."
            emphasis={watchlistCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Onboarding"
            value={`${onboardingCompletionRate}%`}
            sub={`${onboardingRecentCompleted} recent newcomer graduations.`}
            emphasis={onboardingCompletionRate >= 70 ? "primary" : onboardingCompletionRate >= 50 ? "default" : "warning"}
          />
          <OpsMetricCard
            label="Comeback"
            value={`${comebackCompletionRate}%`}
            sub={`${comebackRecentCompleted} recent comeback recoveries.`}
            emphasis={comebackCompletionRate >= 60 ? "primary" : comebackCompletionRate >= 40 ? "default" : "warning"}
          />
          <OpsMetricCard
            label="Funnel rails"
            value={funnelAutomations.length}
            sub="Durable automation rails feeding starter and comeback lanes."
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="space-y-4">
            {funnelAutomations.map((automation) => (
              <div key={automation.id} className="rounded-[20px] border border-line bg-card2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{automation.title}</p>
                    <p className="mt-2 text-sm leading-5.5 text-sub">{automation.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OpsStatusPill
                      tone={
                        automation.executionPosture === "blocked" || automation.executionPosture === "degraded"
                          ? "warning"
                          : automation.status === "active"
                            ? "success"
                            : "default"
                      }
                    >
                      {automation.executionPosture
                        ? COMMUNITY_AUTOMATION_POSTURE_LABELS[automation.executionPosture]
                        : automation.status === "active"
                          ? "Armed"
                          : "Paused"}
                    </OpsStatusPill>
                    {automation.sequencingKey ? (
                      <OpsStatusPill tone="default">
                        {COMMUNITY_AUTOMATION_SEQUENCE_LABELS[automation.sequencingKey]}
                      </OpsStatusPill>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
                  <div className="rounded-[16px] border border-line bg-card px-3.5 py-2.5 text-sm text-sub">
                    <p className="font-bold text-text">Cadence</p>
                    <p className="mt-2">{automation.cadence}</p>
                  </div>
                  <div className="rounded-[16px] border border-line bg-card px-3.5 py-2.5 text-sm text-sub">
                    <p className="font-bold text-text">Next run</p>
                    <p className="mt-2">{formatTimestamp(automation.nextRunAt)}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-sub">
                  <p>Last run: {formatTimestamp(automation.lastRunAt)}</p>
                  <p>
                    Latest result:{" "}
                    {automation.lastResultSummary || automation.lastResult || "No runs yet"}
                  </p>
                  {automation.ownerSummary ? <p>{automation.ownerSummary}</p> : null}
                </div>

                <button
                  type="button"
                  onClick={() => onRunAutomation(automation.id)}
                  disabled={runningAutomationId === automation.id}
                  className="mt-3.5 rounded-[16px] border border-line bg-card px-3.5 py-2.5 text-[13px] font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningAutomationId === automation.id ? "Running..." : "Run funnel now"}
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {[conversionSignal, retentionSignal].filter(Boolean).map((signal) => (
              <div key={signal?.key} className="rounded-[20px] border border-line bg-card2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{signal?.label}</p>
                    <p className="mt-2 text-sm leading-5.5 text-sub">{signal?.summary}</p>
                  </div>
                  <OpsStatusPill
                    tone={
                      signal?.tone === "danger"
                        ? "danger"
                        : signal?.tone === "warning"
                          ? "warning"
                          : signal?.tone === "success"
                            ? "success"
                            : "default"
                    }
                  >
                    {signal?.value || "Live"}
                  </OpsStatusPill>
                </div>
              </div>
            ))}

            <div className="rounded-[20px] border border-line bg-card2 p-4">
              <p className="text-sm font-bold text-text">Queue balance</p>
              <p className="mt-2 text-sm text-sub">
                Owners should use this read to decide whether to arm another funnel wave or first
                let the active rail absorb the current pressure.
              </p>

              <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
                <div className="rounded-[16px] border border-line bg-card px-3.5 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                    Starter pressure
                  </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{newcomerCount}</p>
                  <p className="mt-2 text-sm text-sub">
                    {newcomer?.blockedCount ?? 0} seats are currently blocked from graduating cleanly.
                  </p>
                </div>
                <div className="rounded-[16px] border border-line bg-card px-3.5 py-2.5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                    Comeback pressure
                  </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{reactivationCount}</p>
                  <p className="mt-2 text-sm text-sub">
                    {reactivation?.blockedCount ?? 0} returning seats still need cleanup or better timing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
