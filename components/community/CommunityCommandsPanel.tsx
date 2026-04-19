"use client";

import type { Dispatch, SetStateAction } from "react";
import { DiscordCommunityBotSettings } from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  savingDiscordBotSettings: boolean;
  runningDiscordBotAction: "command_sync" | "rank_sync" | "leaderboard_post" | null;
  onSaveDiscordBotConfig: () => void;
  onRunCommandSync: () => void;
};

const liveCommands = [
  "/link",
  "/profile",
  "/rank",
  "/leaderboard",
];

const telegramCommands = ["/link", "/profile", "/missions", "/leaderboard", "/raid"];

export function CommunityCommandsPanel({
  settings,
  setSettings,
  savingDiscordBotSettings,
  runningDiscordBotAction,
  onSaveDiscordBotConfig,
  onRunCommandSync,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Commands"
      title="Slash commands and bot surface"
      description="Enable the Discord command layer, sync it on demand and prepare the server for the broader community-manager behavior."
      action={
        <button
          onClick={onRunCommandSync}
          disabled={runningDiscordBotAction === "command_sync"}
          className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {runningDiscordBotAction === "command_sync"
            ? "Syncing commands..."
            : "Sync Discord commands now"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <OpsMetricCard
            label="Commands"
            value={settings.commandsEnabled ? "Enabled" : "Disabled"}
            sub="Whether the slash-command surface is armed."
            emphasis={settings.commandsEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Telegram"
            value={settings.telegramCommandsEnabled ? "Enabled" : "Disabled"}
            sub="Whether the Telegram command rail is armed."
            emphasis={settings.telegramCommandsEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Raid ops"
            value={settings.raidOpsEnabled ? "Armed" : "Parked"}
            sub="The v1 raid rail switch for the future command surface."
            emphasis={settings.raidOpsEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Live commands"
            value={liveCommands.length}
            sub="The first command rail already registered with the Discord bot."
          />
        </div>

        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span>Enable slash commands</span>
              <input
                type="checkbox"
                checked={settings.commandsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    commandsEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span>Enable Telegram commands</span>
              <input
                type="checkbox"
                checked={settings.telegramCommandsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    telegramCommandsEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span>Arm raid ops rail</span>
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
          </div>

          <div className="mt-4 rounded-[22px] border border-line bg-card px-4 py-4">
            <p className="text-sm font-bold text-text">Current command surfaces</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {liveCommands.map((command) => (
                <OpsStatusPill key={command} tone="success">
                  {command}
                </OpsStatusPill>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {telegramCommands.map((command) => (
                <OpsStatusPill
                  key={`telegram-${command}`}
                  tone={settings.telegramCommandsEnabled ? "success" : "default"}
                >
                  TG {command}
                </OpsStatusPill>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-sub">
              Discord stays sync-driven, while Telegram now has its own command layer. Together they let the community call into profile, rank, mission and leaderboard flows without touching the portal.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onSaveDiscordBotConfig}
              disabled={savingDiscordBotSettings}
              className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDiscordBotSettings ? "Saving bot settings..." : "Save command settings"}
            </button>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
