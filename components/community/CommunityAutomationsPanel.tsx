"use client";

import { DiscordCommunityBotSettings } from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  settings: DiscordCommunityBotSettings;
  runningAutomationAction: "all" | "missions" | "raids" | null;
  automationNotice: string;
  automationNoticeTone: "success" | "error";
  onRunAutomationAction: (mode: "all" | "missions" | "raids") => void;
};

function formatTimestamp(value: string) {
  return value ? new Date(value).toLocaleString() : "Not run yet";
}

export function CommunityAutomationsPanel({
  settings,
  runningAutomationAction,
  automationNotice,
  automationNoticeTone,
  onRunAutomationAction,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Automations"
      title="Scheduled community pressure"
      description="This is the first automation rail for Community OS: mission digests and raid waves can now be armed, tracked and kicked manually from the same project-private surface."
      action={
        <button
          onClick={() => onRunAutomationAction("all")}
          disabled={runningAutomationAction === "all"}
          className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {runningAutomationAction === "all" ? "Running automations..." : "Run all automations now"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard label="Mission cadence" value={settings.missionDigestCadence} sub="How aggressively the mission digest should pulse." emphasis={settings.missionDigestEnabled ? "primary" : "default"} />
          <OpsMetricCard label="Raid cadence" value={settings.raidCadence} sub="How often the raid rail expects automation pressure." emphasis={settings.raidAlertsEnabled || settings.raidRemindersEnabled ? "primary" : "default"} />
          <OpsMetricCard label="Last mission digest" value={formatTimestamp(settings.lastMissionDigestAt)} sub="Most recent mission automation pulse." />
          <OpsMetricCard label="Last automation run" value={formatTimestamp(settings.lastAutomationRunAt)} sub="The last time any v2 automation rail was run." />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
            <p className="text-sm font-bold text-text">Automation posture</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <OpsStatusPill tone={settings.missionDigestEnabled ? "success" : "default"}>
                Mission digest {settings.missionDigestEnabled ? "armed" : "parked"}
              </OpsStatusPill>
              <OpsStatusPill tone={settings.raidAlertsEnabled ? "success" : "default"}>
                Raid alerts {settings.raidAlertsEnabled ? "armed" : "parked"}
              </OpsStatusPill>
              <OpsStatusPill tone={settings.raidRemindersEnabled ? "success" : "default"}>
                Reminders {settings.raidRemindersEnabled ? "armed" : "parked"}
              </OpsStatusPill>
              <OpsStatusPill tone={settings.telegramCommandsEnabled ? "success" : "default"}>
                Telegram commands {settings.telegramCommandsEnabled ? "live" : "parked"}
              </OpsStatusPill>
            </div>
            <p className="mt-4 text-sm leading-6 text-sub">
              Once these are enabled and saved, the Community OS can run mission summaries and raid pulses without the project manager re-building every message by hand.
            </p>
          </div>

          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
            <p className="text-sm font-bold text-text">Manual runs</p>
            <p className="mt-2 text-sm text-sub">
              Fire individual rails if you want to test cadence, verify targets, or kick a specific pressure wave now.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                onClick={() => onRunAutomationAction("missions")}
                disabled={runningAutomationAction === "missions"}
                className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAutomationAction === "missions"
                  ? "Running missions..."
                  : "Run mission automation"}
              </button>
              <button
                onClick={() => onRunAutomationAction("raids")}
                disabled={runningAutomationAction === "raids"}
                className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAutomationAction === "raids" ? "Running raids..." : "Run raid automation"}
              </button>
            </div>

            {automationNotice ? (
              <p
                className={`mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6 ${
                  automationNoticeTone === "error"
                    ? "border-rose-400/30 bg-rose-500/[0.055] text-rose-200"
                    : "border-primary/20 bg-primary/[0.055] text-primary"
                }`}
              >
                {automationNotice}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
