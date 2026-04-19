"use client";

import type { CommunityAutomationRecord } from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  newcomerCount: number;
  reactivationCount: number;
  watchlistCount: number;
  automations: CommunityAutomationRecord[];
  runningAutomationId: string | null;
  onRunAutomation: (automationId: string) => void;
};

function formatTimestamp(value: string) {
  return value ? new Date(value).toLocaleString() : "Not scheduled";
}

export function CommunityFunnelsPanel({
  newcomerCount,
  reactivationCount,
  watchlistCount,
  automations,
  runningAutomationId,
  onRunAutomation,
}: Props) {
  const funnelAutomations = automations.filter(
    (automation) =>
      automation.automationType === "newcomer_pulse" ||
      automation.automationType === "reactivation_pulse"
  );

  return (
    <OpsPanel
      eyebrow="Funnels"
      title="Onboarding and comeback execution"
      description="Funnels turn the contributor cohorts into repeatable execution rails instead of one-off manual pushes."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Starter queue"
            value={newcomerCount}
            sub="Fresh contributors waiting for a structured first lane."
            emphasis={newcomerCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Comeback queue"
            value={reactivationCount}
            sub="Dormant contributors ready for a reactivation wave."
            emphasis={reactivationCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Watchlist"
            value={watchlistCount}
            sub="People who should not be blindly pulled into funnels."
            emphasis={watchlistCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Funnel rails"
            value={funnelAutomations.length}
            sub="Durable newcomer and comeback automation definitions."
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {funnelAutomations.map((automation) => (
            <div key={automation.id} className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-text">{automation.title}</p>
                  <p className="mt-2 text-sm leading-6 text-sub">{automation.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={automation.status === "active" ? "success" : "default"}>
                    {automation.status === "active" ? "Armed" : "Paused"}
                  </OpsStatusPill>
                  <OpsStatusPill tone={automation.cadence === "manual" ? "default" : "success"}>
                    {automation.cadence}
                  </OpsStatusPill>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-sub">
                <p>Next run: {formatTimestamp(automation.nextRunAt)}</p>
                <p>Last run: {formatTimestamp(automation.lastRunAt)}</p>
                <p>Latest result: {automation.lastResultSummary || automation.lastResult || "No runs yet"}</p>
              </div>

              <button
                type="button"
                onClick={() => onRunAutomation(automation.id)}
                disabled={runningAutomationId === automation.id}
                className="mt-4 rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAutomationId === automation.id ? "Running..." : "Run funnel now"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </OpsPanel>
  );
}
