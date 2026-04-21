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
  "/missions",
  "/raid",
  "/captain",
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
            sub="Whether the Telegram command surface is armed."
            emphasis={settings.telegramCommandsEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Mission commands"
            value={settings.missionCommandsEnabled ? "Enabled" : "Parked"}
            sub="Whether mission commands stay visible in chat."
            emphasis={settings.missionCommandsEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Raid ops"
            value={settings.raidOpsEnabled ? "Armed" : "Parked"}
            sub="The raid-ops switch for the command surface."
            emphasis={settings.raidOpsEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Captain commands"
            value={settings.captainCommandsEnabled ? "Enabled" : "Parked"}
            sub="Whether captain-specific command entry stays visible."
            emphasis={settings.captainCommandsEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Deep links"
            value={settings.commandDeepLinksEnabled ? "Enabled" : "Parked"}
            sub="Whether replies should push back into the right web or portal surface."
            emphasis={settings.commandDeepLinksEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Live commands"
            value={liveCommands.length}
            sub="The current Discord command surface registered with the bot."
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
              <span>Enable mission commands</span>
              <input
                type="checkbox"
                checked={settings.missionCommandsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    missionCommandsEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span>Enable captain commands</span>
              <input
                type="checkbox"
                checked={settings.captainCommandsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    captainCommandsEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span>Keep deep links in replies</span>
              <input
                type="checkbox"
                checked={settings.commandDeepLinksEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    commandDeepLinksEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
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
              Discord stays the richer command surface, Telegram stays the fast-access surface, and deep links push members back into the exact webapp or captain workspace they should land on next.
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
