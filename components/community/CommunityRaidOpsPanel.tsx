"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { DiscordCommunityBotSettings } from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type RaidItem = {
  id: string;
  title: string;
  rewardXp?: number;
};

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  raids: RaidItem[];
  savingDiscordBotSettings: boolean;
  runningRaidAction: "live" | "reminder" | "result" | null;
  raidNotice: string;
  raidNoticeTone: "success" | "error";
  onSaveDiscordBotConfig: () => void;
  onRunRaidAction: (raidId: string, mode: "live" | "reminder" | "result") => void;
};

export function CommunityRaidOpsPanel({
  settings,
  setSettings,
  raids,
  savingDiscordBotSettings,
  runningRaidAction,
  raidNotice,
  raidNoticeTone,
  onSaveDiscordBotConfig,
  onRunRaidAction,
}: Props) {
  const [selectedRaidId, setSelectedRaidId] = useState("");

  useEffect(() => {
    if (!selectedRaidId && raids[0]?.id) {
      setSelectedRaidId(raids[0].id);
    }
  }, [raids, selectedRaidId]);

  return (
    <OpsPanel
      eyebrow="Raid Ops"
      title="Raid alerts, reminders and result rails"
      description="Arm the project raid rail, choose how it should pulse, and trigger live or reminder waves without leaving the Community OS."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard label="Live raids" value={raids.length} sub="Active raids currently attached to this project." emphasis={raids.length > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Raid ops" value={settings.raidOpsEnabled ? "Armed" : "Parked"} sub="Whether the raid rail is live in this community." emphasis={settings.raidOpsEnabled ? "primary" : "default"} />
          <OpsMetricCard label="Alerts" value={settings.raidAlertsEnabled ? "On" : "Off"} sub="Automatic live raid alerts." />
          <OpsMetricCard label="Reminders" value={settings.raidRemindersEnabled ? "On" : "Off"} sub="Follow-up reminder waves." />
        </div>

        <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center justify-between rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text">
              <span>Enable raid ops</span>
              <input
                type="checkbox"
                checked={settings.raidOpsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    raidOpsEnabled: event.target.checked,
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text">
              <span>Auto live alerts</span>
              <input
                type="checkbox"
                checked={settings.raidAlertsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    raidAlertsEnabled: event.target.checked,
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text">
              <span>Reminder waves</span>
              <input
                type="checkbox"
                checked={settings.raidRemindersEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    raidRemindersEnabled: event.target.checked,
                  }))
                }
              />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text">
              <span>Result wraps</span>
              <input
                type="checkbox"
                checked={settings.raidResultsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    raidResultsEnabled: event.target.checked,
                  }))
                }
              />
            </label>
          </div>

          <label className="mt-4 block rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
              Raid cadence
            </span>
            <select
              value={settings.raidCadence}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  raidCadence: event.target.value as "manual" | "daily" | "weekly",
                }))
              }
              className="w-full bg-transparent text-sm text-text outline-none"
            >
              <option value="manual">Manual only</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onSaveDiscordBotConfig}
              disabled={savingDiscordBotSettings}
              className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDiscordBotSettings ? "Saving raid settings..." : "Save raid settings"}
            </button>
          </div>

          {raidNotice ? (
            <p
              className={`mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6 ${
                raidNoticeTone === "error"
                  ? "border-rose-400/30 bg-rose-500/[0.055] text-rose-200"
                  : "border-primary/20 bg-primary/[0.055] text-primary"
              }`}
            >
              {raidNotice}
            </p>
          ) : null}
        </div>

        <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Live raid rail</p>
              <p className="mt-2 text-sm text-sub">
                Pick the raid you want to push and choose the wave type that fits the moment.
              </p>
            </div>
            <OpsStatusPill tone={raids.length > 0 ? "success" : "default"}>
              {raids.length > 0 ? "Ready" : "No live raids"}
            </OpsStatusPill>
          </div>

          <select
            value={selectedRaidId}
            onChange={(event) => setSelectedRaidId(event.target.value)}
            className="mt-4 w-full rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text outline-none"
          >
            {raids.length > 0 ? (
              raids.map((raid) => (
                <option key={raid.id} value={raid.id}>
                  {raid.title}
                </option>
              ))
            ) : (
              <option value="">No live raids</option>
            )}
          </select>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <button
              onClick={() => selectedRaidId && onRunRaidAction(selectedRaidId, "live")}
              disabled={!selectedRaidId || runningRaidAction === "live"}
              className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningRaidAction === "live" ? "Sending alert..." : "Send live alert"}
            </button>
            <button
              onClick={() => selectedRaidId && onRunRaidAction(selectedRaidId, "reminder")}
              disabled={!selectedRaidId || runningRaidAction === "reminder"}
              className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningRaidAction === "reminder" ? "Sending reminder..." : "Send reminder wave"}
            </button>
            <button
              onClick={() => selectedRaidId && onRunRaidAction(selectedRaidId, "result")}
              disabled={!selectedRaidId || runningRaidAction === "result"}
              className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningRaidAction === "result" ? "Sending result..." : "Send result wrap"}
            </button>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
