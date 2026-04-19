"use client";

import type { DbAuditLog } from "@/types/database";
import { OpsMetricCard, OpsPanel } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  callbackFailures: number;
  onchainFailures: number;
  watchlistCount: number;
  openFlagCount: number;
  latestIssue: string;
  recentActivity: DbAuditLog[];
  loadingActivity: boolean;
  automationRunCount: number;
  playbookRunCount: number;
  captainActionCount: number;
  recentAutomationFailureCount: number;
  onboardingRecentCompleted: number;
  comebackRecentCompleted: number;
  captainPriorityCount: number;
  captainBlockedCount: number;
};

function formatActionLabel(action: string) {
  return action
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CommunityActivityPanel({
  callbackFailures,
  onchainFailures,
  watchlistCount,
  openFlagCount,
  latestIssue,
  recentActivity,
  loadingActivity,
  automationRunCount,
  playbookRunCount,
  captainActionCount,
  recentAutomationFailureCount,
  onboardingRecentCompleted,
  comebackRecentCompleted,
  captainPriorityCount,
  captainBlockedCount,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Activity"
      title="Recent incidents and execution signal"
      description="This keeps the project team close to what the community rail is doing without exposing any other workspace."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-10">
          <OpsMetricCard
            label="Callback failures"
            value={callbackFailures}
            sub="Verification callbacks that have failed on this project rail."
            emphasis={callbackFailures > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="On-chain failures"
            value={onchainFailures}
            sub="Rejected or failed on-chain events tied to this project."
            emphasis={onchainFailures > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Recent activity"
            value={recentActivity.length}
            sub="Latest project-scoped bot and audit events visible in this page."
            emphasis={recentActivity.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Quality pressure"
            value={watchlistCount + openFlagCount}
            sub="Open trust or watch pressure inside this project rail."
            emphasis={watchlistCount + openFlagCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Automation runs"
            value={automationRunCount}
            sub="Recent automation execution history."
            emphasis={automationRunCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Playbook runs"
            value={playbookRunCount}
            sub="Recent multi-step community operating runs."
            emphasis={playbookRunCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Captain actions"
            value={captainActionCount}
            sub="Captain-triggered actions recorded for this project."
            emphasis={captainActionCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Execution failures"
            value={recentAutomationFailureCount}
            sub="Failed automation or playbook runs visible in v4 history."
            emphasis={recentAutomationFailureCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Onboarding wins"
            value={onboardingRecentCompleted}
            sub="Recent onboarding completions visible in aggregate journey outcomes."
            emphasis={onboardingRecentCompleted > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Comebacks"
            value={comebackRecentCompleted}
            sub="Recent comeback completions visible in aggregate journey outcomes."
            emphasis={comebackRecentCompleted > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Captain pressure"
            value={captainPriorityCount + captainBlockedCount}
            sub="Current captain priorities plus blocked queue pressure."
            emphasis={captainPriorityCount + captainBlockedCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Latest issue</p>
          <p className="mt-3 text-sm leading-7 text-text">{latestIssue}</p>
        </div>

        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Recent log stream</p>
              <p className="mt-2 text-sm text-sub">
                The newest project-scoped audit events for community, verification, automation and on-chain rails.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {loadingActivity ? (
              <div className="rounded-[22px] border border-line bg-card px-4 py-5 text-sm text-sub">
                Loading community activity...
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((log) => (
                <div key={log.id} className="rounded-[22px] border border-line bg-card px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-text">{formatActionLabel(log.action)}</p>
                      <p className="mt-2 text-sm leading-6 text-sub">{log.summary}</p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-sub">
                    <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                      {log.source_table}
                    </span>
                    {log.project_id ? (
                      <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                        project scoped
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                No recent community activity has been logged for this project yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
