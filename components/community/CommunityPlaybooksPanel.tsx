"use client";

import type {
  CommunityAutomationRecord,
  CommunityPlaybookConfig,
  CommunityPlaybookRunRecord,
} from "@/components/community/community-config";
import {
  COMMUNITY_AUTOMATION_LABELS,
  COMMUNITY_AUTOMATION_POSTURE_LABELS,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  playbooks: CommunityPlaybookConfig[];
  playbookRuns: CommunityPlaybookRunRecord[];
  automations: CommunityAutomationRecord[];
  saving: boolean;
  runningPlaybookKey: string | null;
  notice: string;
  noticeTone: "success" | "error";
  onUpdatePlaybook: (
    playbookKey: CommunityPlaybookConfig["key"],
    patch: Partial<Pick<CommunityPlaybookConfig, "enabled" | "providerScope">>
  ) => void;
  onSave: () => void;
  onRunPlaybook: (playbookKey: CommunityPlaybookConfig["key"]) => void;
};

function formatTimestamp(value: string) {
  return value ? new Date(value).toLocaleString() : "Not run yet";
}

function getPlaybookState(playbook: CommunityPlaybookConfig, automations: CommunityAutomationRecord[]) {
  const stepAutomations = playbook.steps.map((step) =>
    automations.find((automation) => automation.automationType === step)
  );
  const hasBlocked = stepAutomations.some(
    (automation) =>
      automation?.executionPosture === "blocked" || automation?.executionPosture === "degraded"
  );
  const hasReady = stepAutomations.some(
    (automation) =>
      automation?.executionPosture === "ready" || automation?.executionPosture === "running"
  );
  const missingSteps = stepAutomations.filter((automation) => !automation).length;

  return {
    stepAutomations,
    tone: hasBlocked ? "warning" : hasReady ? "success" : "default",
    label: hasBlocked
      ? "Stalled"
      : hasReady
        ? "Ready"
        : playbook.enabled
          ? "Watching"
          : "Parked",
    missingSteps,
    hasBlocked,
  } as const;
}

export function CommunityPlaybooksPanel({
  playbooks,
  playbookRuns,
  automations,
  saving,
  runningPlaybookKey,
  notice,
  noticeTone,
  onUpdatePlaybook,
  onSave,
  onRunPlaybook,
}: Props) {
  const enabledCount = playbooks.filter((playbook) => playbook.enabled).length;
  const readyCount = playbooks.filter(
    (playbook) => getPlaybookState(playbook, automations).label === "Ready"
  ).length;
  const stalledCount = playbooks.filter(
    (playbook) => getPlaybookState(playbook, automations).label === "Stalled"
  ).length;
  const failedCount = playbookRuns.filter((run) => run.status === "failed").length;

  return (
    <OpsPanel
      eyebrow="Playbooks"
      title="Reusable community operating modes"
      description="Playbooks bundle multiple rails into one repeatable execution move. Owners should be able to see which bundle is ready, which one is stalled, and which step is currently the bottleneck."
      action={
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving playbooks..." : "Save playbooks"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Playbooks"
            value={playbooks.length}
            sub="Reusable community execution presets for this project."
          />
          <OpsMetricCard
            label="Enabled"
            value={enabledCount}
            sub="Playbooks currently ready for manual or later scheduled use."
            emphasis={enabledCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Ready now"
            value={readyCount}
            sub="Playbooks with at least one step already in a ready or running posture."
            emphasis={readyCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Stalled"
            value={stalledCount || failedCount}
            sub="Playbooks blocked by a degraded automation step or recent failure."
            emphasis={stalledCount > 0 || failedCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            {playbooks.map((playbook) => {
              const state = getPlaybookState(playbook, automations);

              return (
                <div key={playbook.key} className="rounded-[24px] border border-line bg-card2 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-2xl">
                      <p className="text-sm font-bold text-text">{playbook.title}</p>
                      <p className="mt-2 text-sm leading-6 text-sub">{playbook.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <OpsStatusPill tone={playbook.enabled ? "success" : "default"}>
                        {playbook.enabled ? "Enabled" : "Disabled"}
                      </OpsStatusPill>
                      <OpsStatusPill tone={state.tone}>{state.label}</OpsStatusPill>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-[18px] border border-line bg-card px-4 py-3 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={playbook.enabled}
                        onChange={(event) =>
                          onUpdatePlaybook(playbook.key, { enabled: event.target.checked })
                        }
                      />
                      Enable {playbook.title}
                    </label>

                    <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      Provider scope
                      <select
                        value={playbook.providerScope}
                        onChange={(event) =>
                          onUpdatePlaybook(playbook.key, {
                            providerScope: event.target.value as CommunityPlaybookConfig["providerScope"],
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

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {playbook.steps.map((step, index) => {
                      const automation = state.stepAutomations[index];
                      const posture = automation?.executionPosture;

                      return (
                        <div
                          key={`${playbook.key}-${step}`}
                          className="rounded-[18px] border border-white/8 bg-card px-4 py-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-text">
                              {COMMUNITY_AUTOMATION_LABELS[step]}
                            </p>
                            <OpsStatusPill
                              tone={
                                posture === "blocked" || posture === "degraded"
                                  ? "warning"
                                  : posture === "ready" || posture === "running"
                                    ? "success"
                                    : "default"
                              }
                            >
                              {posture ? COMMUNITY_AUTOMATION_POSTURE_LABELS[posture] : "Unmapped"}
                            </OpsStatusPill>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-sub">
                            {automation?.ownerSummary ||
                              automation?.description ||
                              "This step has not been mapped into an automation rail yet."}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1 text-sm text-sub">
                      <p>Last run: {formatTimestamp(playbook.lastRunAt)}</p>
                      <p>
                        Sequencing note:{" "}
                        <span className="font-semibold text-text">
                          {state.hasBlocked
                            ? "One or more steps are stalled and need intervention."
                            : state.missingSteps > 0
                              ? `${state.missingSteps} step${state.missingSteps === 1 ? "" : "s"} still need an automation rail.`
                              : "This playbook is fully mapped to the current automation rail."}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRunPlaybook(playbook.key)}
                      disabled={runningPlaybookKey === playbook.key}
                      className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {runningPlaybookKey === playbook.key ? "Running..." : "Run playbook"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-sm font-bold text-text">Recent playbook history</p>
            <p className="mt-2 text-sm text-sub">
              The latest manual or scheduled playbook runs for this project.
            </p>

            <div className="mt-4 space-y-3">
              {playbookRuns.length > 0 ? (
                playbookRuns.map((run) => (
                  <div key={run.id} className="rounded-[20px] border border-line bg-card px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{run.playbookKey.replaceAll("_", " ")}</p>
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
                      {run.triggerSource} · {new Date(run.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                  No playbook runs are recorded yet.
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
