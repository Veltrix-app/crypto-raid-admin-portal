"use client";

import type { CommunityAutomationRecord, CommunityAutomationRunRecord } from "@/components/community/community-config";
import {
  COMMUNITY_AUTOMATION_LABELS,
  COMMUNITY_AUTOMATION_POSTURE_LABELS,
  COMMUNITY_AUTOMATION_SEQUENCE_LABELS,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  automations: CommunityAutomationRecord[];
  automationRuns: CommunityAutomationRunRecord[];
  journeyAutomationCount: number;
  recommendedPlayTitle: string;
  saving: boolean;
  runningAutomationId: string | null;
  notice: string;
  noticeTone: "success" | "error";
  onUpdateAutomation: (
    automationId: string,
    patch: Partial<Pick<CommunityAutomationRecord, "status" | "cadence" | "providerScope" | "targetProvider">>
  ) => void;
  onSave: () => void;
  onRunAutomation: (automationId: string) => void;
};

function formatTimestamp(value?: string) {
  return value ? new Date(value).toLocaleString() : "Not scheduled";
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.round(value))}%`;
}

function getPostureTone(posture?: CommunityAutomationRecord["executionPosture"]) {
  if (posture === "blocked" || posture === "degraded") return "warning";
  if (posture === "ready" || posture === "running") return "success";
  return "default";
}

function getOutcomeTone(run: CommunityAutomationRunRecord["status"]) {
  if (run === "failed") return "warning";
  if (run === "success") return "success";
  return "default";
}

function groupAutomationsBySequence(automations: CommunityAutomationRecord[]) {
  return automations.reduce<Record<string, CommunityAutomationRecord[]>>((groups, automation) => {
    const key = automation.sequencingKey ?? "standalone";
    groups[key] = [...(groups[key] ?? []), automation];
    return groups;
  }, {});
}

export function CommunityAutomationCenterPanel({
  automations,
  automationRuns,
  journeyAutomationCount,
  recommendedPlayTitle,
  saving,
  runningAutomationId,
  notice,
  noticeTone,
  onUpdateAutomation,
  onSave,
  onRunAutomation,
}: Props) {
  const activeCount = automations.filter((automation) => automation.status === "active").length;
  const readyCount = automations.filter((automation) => automation.executionPosture === "ready").length;
  const blockedCount = automations.filter((automation) => automation.executionPosture === "blocked").length;
  const degradedCount = automations.filter(
    (automation) => automation.executionPosture === "degraded"
  ).length;
  const dueCount = automations.filter(
    (automation) =>
      automation.status === "active" &&
      automation.nextRunAt &&
      new Date(automation.nextRunAt).getTime() <= Date.now()
  ).length;
  const failedRuns = automationRuns.filter((run) => run.status === "failed").length;
  const completedRuns = automationRuns.filter(
    (run) => run.status === "success" || run.status === "failed"
  ).length;
  const successRuns = automationRuns.filter((run) => run.status === "success").length;
  const successRate = completedRuns > 0 ? (successRuns / completedRuns) * 100 : 0;
  const groupedAutomations = groupAutomationsBySequence(automations);

  return (
    <OpsPanel
      eyebrow="Automation Center"
      title="Scheduled community execution"
      description="These are the durable Community OS workflows. Owners should be able to see what is armed, what is ready, what is degraded and where execution is currently stalling."
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving automations..." : "Save automation center"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <OpsMetricCard
            label="Automations"
            value={automations.length}
            sub="Project-owned automations tracked in Community OS."
            emphasis={automations.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Armed"
            value={activeCount}
            sub="Automations currently active and allowed to run."
            emphasis={activeCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Ready"
            value={readyCount}
            sub="Automations already in a ready posture for the next move."
            emphasis={readyCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Blocked"
            value={blockedCount + degradedCount}
            sub="Execution workflows that are stalled or drifting."
            emphasis={blockedCount + degradedCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Due now"
            value={dueCount}
            sub="Automations that are already due based on next run."
            emphasis={dueCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Success rate"
            value={formatPercent(successRate)}
            sub="Recent recorded automation outcomes."
            emphasis={successRate >= 70 ? "primary" : successRate > 0 ? "warning" : "default"}
          />
        </div>

        {recommendedPlayTitle ? (
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5 text-sm text-sub">
            <span className="font-bold uppercase tracking-[0.14em] text-primary">Owner cue</span>
            <p className="mt-3 leading-7">
              Current recommended play: <span className="font-semibold text-text">{recommendedPlayTitle}</span>
            </p>
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(groupedAutomations).map(([sequence, sequenceAutomations]) => {
            const blockedInSequence = sequenceAutomations.filter(
              (automation) =>
                automation.executionPosture === "blocked" ||
                automation.executionPosture === "degraded"
            ).length;
            const readyInSequence = sequenceAutomations.filter(
              (automation) =>
                automation.executionPosture === "ready" ||
                automation.executionPosture === "running"
            ).length;

            return (
              <div
                key={sequence}
                className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary/90">
                      {sequence === "standalone"
                        ? "Standalone"
                        : COMMUNITY_AUTOMATION_SEQUENCE_LABELS[
                            sequence as keyof typeof COMMUNITY_AUTOMATION_SEQUENCE_LABELS
                          ]}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold text-text">
                      {sequenceAutomations.length} automation rails
                    </p>
                  </div>
                  <OpsStatusPill tone={blockedInSequence > 0 ? "warning" : "success"}>
                    {blockedInSequence > 0 ? "Needs action" : "Readable"}
                  </OpsStatusPill>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <OpsMetricCard
                    label="Ready"
                    value={readyInSequence}
                    sub="Rails with healthy execution posture."
                    emphasis={readyInSequence > 0 ? "primary" : "default"}
                  />
                  <OpsMetricCard
                    label="Blocked"
                    value={blockedInSequence}
                    sub="Rails that need owner attention."
                    emphasis={blockedInSequence > 0 ? "warning" : "default"}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <p className="text-sm font-bold text-text">
                      {automation.ownerLabel || automation.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      {automation.ownerSummary || automation.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <OpsStatusPill tone={automation.status === "active" ? "success" : "default"}>
                      {automation.status === "active" ? "Armed" : "Paused"}
                    </OpsStatusPill>
                    <OpsStatusPill tone={getPostureTone(automation.executionPosture)}>
                      {automation.executionPosture
                        ? COMMUNITY_AUTOMATION_POSTURE_LABELS[automation.executionPosture]
                        : "Watching"}
                    </OpsStatusPill>
                    {automation.sequencingKey ? (
                      <OpsStatusPill tone="default">
                        {COMMUNITY_AUTOMATION_SEQUENCE_LABELS[automation.sequencingKey]}
                      </OpsStatusPill>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <OpsStatusPill tone="default">
                    {COMMUNITY_AUTOMATION_LABELS[automation.automationType]}
                  </OpsStatusPill>
                  <OpsStatusPill tone={automation.cadence === "manual" ? "default" : "success"}>
                    {automation.cadence}
                  </OpsStatusPill>
                  <OpsStatusPill tone="default">
                    {automation.providerScope === "both"
                      ? "Discord + Telegram"
                      : automation.providerScope}
                  </OpsStatusPill>
                  {automation.pausedReason ? (
                    <OpsStatusPill tone="warning">{automation.pausedReason}</OpsStatusPill>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                    Status
                    <select
                      value={automation.status}
                      onChange={(event) =>
                        onUpdateAutomation(automation.id, {
                          status: event.target.value as CommunityAutomationRecord["status"],
                        })
                      }
                      className="w-full rounded-[16px] border border-white/[0.026] bg-panel px-4 py-3 text-sm normal-case tracking-normal text-text"
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                    Cadence
                    <select
                      value={automation.cadence}
                      onChange={(event) =>
                        onUpdateAutomation(automation.id, {
                          cadence: event.target.value as CommunityAutomationRecord["cadence"],
                        })
                      }
                      className="w-full rounded-[16px] border border-white/[0.026] bg-panel px-4 py-3 text-sm normal-case tracking-normal text-text"
                    >
                      <option value="manual">Manual</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                    Provider scope
                    <select
                      value={automation.providerScope}
                      onChange={(event) =>
                        onUpdateAutomation(automation.id, {
                          providerScope: event.target.value as CommunityAutomationRecord["providerScope"],
                          targetProvider: event.target.value as CommunityAutomationRecord["targetProvider"],
                        })
                      }
                      className="w-full rounded-[16px] border border-white/[0.026] bg-panel px-4 py-3 text-sm normal-case tracking-normal text-text"
                    >
                      <option value="both">Discord + Telegram</option>
                      <option value="discord">Discord only</option>
                      <option value="telegram">Telegram only</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.012] px-4 py-3 text-sm text-sub">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">Next run</p>
                    <p className="mt-2 font-semibold text-text">{formatTimestamp(automation.nextRunAt)}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.012] px-4 py-3 text-sm text-sub">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">Last run</p>
                    <p className="mt-2 font-semibold text-text">{formatTimestamp(automation.lastRunAt)}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.012] px-4 py-3 text-sm text-sub">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">Last success</p>
                    <p className="mt-2 font-semibold text-text">{formatTimestamp(automation.lastSuccessAt)}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/[0.032] bg-white/[0.012] px-4 py-3 text-sm text-sub">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">Last error</p>
                    <p className="mt-2 font-semibold text-text">
                      {automation.lastErrorCode || formatTimestamp(automation.lastErrorAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1 text-sm text-sub">
                    <p>
                      Latest result: {automation.lastResultSummary || automation.lastResult || "No runs yet"}
                    </p>
                    <p>
                      Execution confidence:{" "}
                      <span className="font-semibold text-text">
                        {automation.executionPosture === "ready" || automation.executionPosture === "running"
                          ? "Execution looks healthy"
                          : automation.executionPosture === "blocked" || automation.executionPosture === "degraded"
                            ? "Needs owner attention"
                            : "Watching for the next trigger"}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRunAutomation(automation.id)}
                    disabled={runningAutomationId === automation.id}
                    className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runningAutomationId === automation.id ? "Running..." : "Run now"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
              <p className="text-sm font-bold text-text">Execution posture</p>
              <p className="mt-2 text-sm text-sub">
                Keep the owner view focused on confidence, not just on/off settings.
              </p>

              <div className="mt-4 grid gap-3">
                <div className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                    Journey-linked automations
                  </p>
                  <p className="mt-2 text-lg font-bold text-text">{journeyAutomationCount}</p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Automations tied directly to newcomer, comeback and activation outcomes.
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                    Failed runs
                  </p>
                  <p className="mt-2 text-lg font-bold text-text">{failedRuns}</p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Recent automation failures visible in project history.
                  </p>
                </div>
                <div className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                    Blocked or degraded automations
                  </p>
                  <p className="mt-2 text-lg font-bold text-text">{blockedCount + degradedCount}</p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    These automations need a config fix, operator action or captain follow-through.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
              <p className="text-sm font-bold text-text">Recent automation history</p>
              <p className="mt-2 text-sm text-sub">
                The latest scheduled or manual execution records for this project's automations.
              </p>

              <div className="mt-4 space-y-3">
                {automationRuns.length > 0 ? (
                  automationRuns.map((run) => (
                    <div key={run.id} className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-text">{COMMUNITY_AUTOMATION_LABELS[run.automationType]}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">
                            {run.summary || "No summary recorded."}
                          </p>
                        </div>
                        <OpsStatusPill tone={getOutcomeTone(run.status)}>
                          {run.status}
                        </OpsStatusPill>
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                        {run.triggerSource} · {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-white/[0.026] bg-white/[0.01] px-4 py-5 text-sm text-sub">
                    No automation runs have been recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className={`rounded-[20px] border px-4 py-3 text-sm ${
              noticeTone === "error"
                ? "border-rose-500/30 bg-rose-500/[0.055] text-rose-200"
                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {notice}
          </div>
        ) : null}
      </div>
    </OpsPanel>
  );
}
