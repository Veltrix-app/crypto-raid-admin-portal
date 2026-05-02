"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  DiscordCommunityBotSettings,
  DiscordLeaderboardCadence,
  DiscordLeaderboardPeriod,
  DiscordLeaderboardScope,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  savingDiscordBotSettings: boolean;
  runningDiscordBotAction: "command_sync" | "rank_sync" | "leaderboard_post" | null;
  onSaveDiscordBotConfig: () => void;
  onRunLeaderboardPost: () => void;
};

export function CommunityLeaderboardsPanel({
  settings,
  setSettings,
  savingDiscordBotSettings,
  runningDiscordBotAction,
  onSaveDiscordBotConfig,
  onRunLeaderboardPost,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Leaderboards"
      title="Scheduled posts and competitive rails"
      description="Control what kind of leaderboard the community sees, where it gets posted and how often the Discord rail should publish it."
      action={
        <button
          onClick={onRunLeaderboardPost}
          disabled={runningDiscordBotAction === "leaderboard_post"}
          className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {runningDiscordBotAction === "leaderboard_post"
            ? "Posting leaderboard..."
            : "Post leaderboard now"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <OpsMetricCard
            label="Leaderboard rail"
            value={settings.leaderboardEnabled ? "Enabled" : "Disabled"}
            sub="Whether the Discord leaderboard layer is active."
            emphasis={settings.leaderboardEnabled ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Cadence"
            value={settings.leaderboardCadence}
            sub="How often this community should auto-post."
          />
          <OpsMetricCard
            label="Window"
            value={settings.leaderboardPeriod}
            sub="The time range contributors are ranked against."
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-text">Leaderboard rail toggles</p>
                <p className="mt-2 text-sm text-sub">
                  Use this to turn competitive posting on or off for the project community.
                </p>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text">
                <span>Leaderboard enabled</span>
                <input
                  type="checkbox"
                  checked={settings.leaderboardEnabled}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      leaderboardEnabled: event.target.checked,
                    }))
                  }
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm text-sub">
                <span className="font-semibold text-text">Scope</span>
                <select
                  value={settings.leaderboardScope}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      leaderboardScope: event.target.value as DiscordLeaderboardScope,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                >
                  <option value="project">Project contributors only</option>
                  <option value="global">Global contributors</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-sub">
                <span className="font-semibold text-text">Window</span>
                <select
                  value={settings.leaderboardPeriod}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      leaderboardPeriod: event.target.value as DiscordLeaderboardPeriod,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="all_time">All time</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-sub">
                <span className="font-semibold text-text">Cadence</span>
                <select
                  value={settings.leaderboardCadence}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      leaderboardCadence: event.target.value as DiscordLeaderboardCadence,
                    }))
                  }
                  className="w-full rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                >
                  <option value="manual">Manual only</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>

              <label className="space-y-2 text-sm text-sub">
                <span className="font-semibold text-text">Top N</span>
                <input
                  value={settings.leaderboardTopN}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      leaderboardTopN: event.target.value,
                    }))
                  }
                  placeholder="10"
                  className="w-full rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] p-5">
            <p className="text-sm font-bold text-text">Delivery rail</p>
            <p className="mt-2 text-sm text-sub">
              Set the Discord channel that should receive leaderboard posts and save the scheduling rail.
            </p>

            <div className="mt-4 grid gap-3">
              <input
                value={settings.leaderboardTargetChannelId}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    leaderboardTargetChannelId: event.target.value,
                  }))
                }
                placeholder="Discord channel ID for leaderboard posts"
                className="w-full rounded-2xl border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
              />

              <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-4 text-sm text-sub">
                Manual mode keeps posting on-demand only. Daily and weekly are the foundation for the community autopost cadence that makes the bot feel alive.
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onSaveDiscordBotConfig}
                  disabled={savingDiscordBotSettings}
                  className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingDiscordBotSettings ? "Saving bot settings..." : "Save leaderboard settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
