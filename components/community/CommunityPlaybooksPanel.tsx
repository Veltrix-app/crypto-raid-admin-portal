"use client";

import type {
  CommunityPlaybookConfig,
  CommunityPlaybookRunRecord,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  playbooks: CommunityPlaybookConfig[];
  playbookRuns: CommunityPlaybookRunRecord[];
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

export function CommunityPlaybooksPanel({
  playbooks,
  playbookRuns,
  saving,
  runningPlaybookKey,
  notice,
  noticeTone,
  onUpdatePlaybook,
  onSave,
  onRunPlaybook,
}: Props) {
  const enabledCount = playbooks.filter((playbook) => playbook.enabled).length;

  return (
    <OpsPanel
      eyebrow="Playbooks"
      title="Reusable community operating modes"
      description="Playbooks bundle multiple rails into one repeatable execution move for launches, raid weeks and campaign pushes."
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
            label="Recent runs"
            value={playbookRuns.length}
            sub="Latest playbook execution records."
          />
          <OpsMetricCard
            label="Failures"
            value={playbookRuns.filter((run) => run.status === "failed").length}
            sub="Playbooks that most recently ended in failure."
            emphasis={playbookRuns.some((run) => run.status === "failed") ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            {playbooks.map((playbook) => (
              <div key={playbook.key} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{playbook.title}</p>
                    <p className="mt-2 text-sm leading-6 text-sub">{playbook.description}</p>
                  </div>
                  <OpsStatusPill tone={playbook.enabled ? "success" : "default"}>
                    {playbook.enabled ? "Enabled" : "Disabled"}
                  </OpsStatusPill>
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

                <div className="mt-4 rounded-[18px] border border-white/8 bg-card px-4 py-4 text-sm text-sub">
                  Steps: {playbook.steps.map((step) => step.replaceAll("_", " ")).join(" • ")}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-sub">Last run: {formatTimestamp(playbook.lastRunAt)}</p>
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
            ))}
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
                      {run.triggerSource} • {new Date(run.createdAt).toLocaleString()}
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
