"use client";

import type { CommunityAutomationRecord, CommunityAutomationRunRecord } from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  automations: CommunityAutomationRecord[];
  automationRuns: CommunityAutomationRunRecord[];
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

function formatTimestamp(value: string) {
  return value ? new Date(value).toLocaleString() : "Not scheduled";
}

export function CommunityAutomationCenterPanel({
  automations,
  automationRuns,
  saving,
  runningAutomationId,
  notice,
  noticeTone,
  onUpdateAutomation,
  onSave,
  onRunAutomation,
}: Props) {
  const activeCount = automations.filter((automation) => automation.status === "active").length;
  const dueCount = automations.filter(
    (automation) =>
      automation.status === "active" &&
      automation.nextRunAt &&
      new Date(automation.nextRunAt).getTime() <= Date.now()
  ).length;
  const failedRuns = automationRuns.filter((run) => run.status === "failed").length;

  return (
    <OpsPanel
      eyebrow="Automation Center"
      title="Scheduled community execution"
      description="These are the durable Community OS rails. Each automation keeps its own cadence, next run, latest result and manual override."
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
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Automation rails"
            value={automations.length}
            sub="Project-owned automations tracked in Community OS."
            emphasis={automations.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Active"
            value={activeCount}
            sub="Rails currently armed for scheduled execution."
            emphasis={activeCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Due now"
            value={dueCount}
            sub="Automations that are already due based on next run."
            emphasis={dueCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Recent failures"
            value={failedRuns}
            sub="Failed automation runs visible in the recent history."
            emphasis={failedRuns > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            {automations.map((automation) => (
              <div
                key={automation.id}
                className="rounded-[24px] border border-line bg-card2 p-5"
              >
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
                      className="w-full rounded-[16px] border border-line bg-panel px-4 py-3 text-sm normal-case tracking-normal text-text"
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
                      className="w-full rounded-[16px] border border-line bg-panel px-4 py-3 text-sm normal-case tracking-normal text-text"
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
                      className="w-full rounded-[16px] border border-line bg-panel px-4 py-3 text-sm normal-case tracking-normal text-text"
                    >
                      <option value="both">Discord + Telegram</option>
                      <option value="discord">Discord only</option>
                      <option value="telegram">Telegram only</option>
                    </select>
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1 text-sm text-sub">
                    <p>Next run: {formatTimestamp(automation.nextRunAt)}</p>
                    <p>Last run: {formatTimestamp(automation.lastRunAt)}</p>
                    <p>
                      Latest result: {automation.lastResultSummary || automation.lastResult || "No runs yet"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRunAutomation(automation.id)}
                    disabled={runningAutomationId === automation.id}
                    className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runningAutomationId === automation.id ? "Running..." : "Run now"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-sm font-bold text-text">Recent automation history</p>
            <p className="mt-2 text-sm text-sub">
              The latest scheduled or manual execution records for this project's automation rails.
            </p>

            <div className="mt-4 space-y-3">
              {automationRuns.length > 0 ? (
                automationRuns.map((run) => (
                  <div key={run.id} className="rounded-[20px] border border-line bg-card px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{run.automationType.replaceAll("_", " ")}</p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          {run.summary || "No summary recorded."}
                        </p>
                      </div>
                      <OpsStatusPill
                        tone={
                          run.status === "success"
                            ? "success"
                            : run.status === "failed"
                              ? "warning"
                              : "default"
                        }
                      >
                        {run.status}
                      </OpsStatusPill>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      {run.triggerSource} • {new Date(run.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                  No automation runs have been recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className={`rounded-[20px] border px-4 py-3 text-sm ${
              noticeTone === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
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
