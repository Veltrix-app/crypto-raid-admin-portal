"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  createEmptyDiscordRankRule,
  DISCORD_RANK_PRESETS,
  DiscordCommunityBotSettings,
  DiscordRankRule,
  DiscordRankSource,
  summarizeDiscordRankSources,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  rankRules: DiscordRankRule[];
  setRankRules: Dispatch<SetStateAction<DiscordRankRule[]>>;
  savingDiscordBotSettings: boolean;
  runningDiscordBotAction: "command_sync" | "rank_sync" | "leaderboard_post" | null;
  discordBotNotice: string;
  discordBotNoticeTone: "success" | "error";
  onSaveDiscordBotConfig: () => void;
  onLoadPreset: (presetId: string) => void;
  onRunRankSync: () => void;
};

const rankSourceOptions: Array<{ value: DiscordRankSource; label: string }> = [
  { value: "project_xp", label: "Project XP" },
  { value: "global_xp", label: "Global XP" },
  { value: "trust", label: "Trust" },
  { value: "wallet_verified", label: "Verified wallet" },
];

export function CommunityRanksPanel({
  settings,
  setSettings,
  rankRules,
  setRankRules,
  savingDiscordBotSettings,
  runningDiscordBotAction,
  discordBotNotice,
  discordBotNoticeTone,
  onSaveDiscordBotConfig,
  onLoadPreset,
  onRunRankSync,
}: Props) {
  const rulesMissingRoleIds = rankRules.filter((rule) => !rule.discordRoleId.trim()).length;

  return (
    <OpsPanel
      eyebrow="Ranks & Roles"
      title="Discord ladders and role mappings"
      description="Turn app progression into visible community status. Choose the source rail, load a ladder preset and sync roles against the live server."
      action={
        <button
          onClick={onRunRankSync}
          disabled={runningDiscordBotAction === "rank_sync"}
          className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {runningDiscordBotAction === "rank_sync" ? "Syncing ranks..." : "Sync Discord ranks now"}
        </button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <OpsMetricCard
            label="Live rules"
            value={rankRules.length}
            sub="How many role unlocks are active in this ladder."
            emphasis={rankRules.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Sources"
            value={summarizeDiscordRankSources(rankRules)}
            sub="Progress rails currently represented in the ladder."
          />
          <OpsMetricCard
            label="Missing role IDs"
            value={rulesMissingRoleIds}
            sub="Rules that still need a Discord role to be pasted in."
            emphasis={rulesMissingRoleIds > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-text">Quick ladders</p>
                <p className="mt-2 text-sm text-sub">
                  Load a proven starter rail, then paste the final Discord role IDs before saving.
                </p>
              </div>
              <label className="flex items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
                <span>Rank sync enabled</span>
                <input
                  type="checkbox"
                  checked={settings.rankSyncEnabled}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      rankSyncEnabled: event.target.checked,
                    }))
                  }
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2 text-sm text-sub">
              <span className="font-semibold text-text">Rank source</span>
              <select
                value={settings.rankSource}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    rankSource: event.target.value as DiscordRankSource,
                  }))
                }
                className="w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
              >
                {rankSourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 grid gap-3">
              {DISCORD_RANK_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => onLoadPreset(preset.id)}
                  className="rounded-[22px] border border-line bg-card p-4 text-left transition hover:border-primary/35 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-text">{preset.title}</p>
                      <p className="mt-2 text-sm leading-6 text-sub">{preset.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">Load</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-text">Role mappings</p>
                <p className="mt-2 text-sm text-sub">
                  Each rule becomes a Discord role unlock based on the selected app-data source.
                </p>
              </div>
              <button
                onClick={() => setRankRules((current) => [...current, createEmptyDiscordRankRule()])}
                className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary"
              >
                Add rule
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {rankRules.length > 0 ? (
                rankRules.map((rule, index) => (
                  <div key={`${rule.id ?? "rule"}-${index}`} className="rounded-[22px] border border-line bg-card p-4">
                    <div className="grid gap-3 xl:grid-cols-[180px_150px_minmax(0,1fr)_auto]">
                      <select
                        value={rule.sourceType}
                        onChange={(event) =>
                          setRankRules((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, sourceType: event.target.value as DiscordRankSource }
                                : item
                            )
                          )
                        }
                        className="rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      >
                        {rankSourceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        value={rule.threshold}
                        onChange={(event) =>
                          setRankRules((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, threshold: event.target.value } : item
                            )
                          )
                        }
                        placeholder="Threshold"
                        className="rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                      />

                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          value={rule.label}
                          onChange={(event) =>
                            setRankRules((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, label: event.target.value } : item
                              )
                            )
                          }
                          placeholder="Rank label"
                          className="rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                        />
                        <input
                          value={rule.discordRoleId}
                          onChange={(event) =>
                            setRankRules((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, discordRoleId: event.target.value }
                                  : item
                              )
                            )
                          }
                          placeholder="Discord role ID"
                          className="rounded-2xl border border-line bg-card2 px-4 py-3 text-sm text-text outline-none transition focus:border-primary/50"
                        />
                      </div>

                      <button
                        onClick={() =>
                          setRankRules((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                        className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500/15"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                  No Discord rank rules loaded yet. Start with a quick ladder or add your own first rule.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={onSaveDiscordBotConfig}
                disabled={savingDiscordBotSettings}
                className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingDiscordBotSettings ? "Saving bot settings..." : "Save rank settings"}
              </button>
            </div>
          </div>
        </div>

        {discordBotNotice ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              discordBotNoticeTone === "error"
                ? "border border-rose-500/25 bg-rose-500/10 text-rose-200"
                : "border border-primary/20 bg-primary/10 text-primary"
            }`}
          >
            {discordBotNotice}
          </div>
        ) : null}
      </div>
    </OpsPanel>
  );
}
