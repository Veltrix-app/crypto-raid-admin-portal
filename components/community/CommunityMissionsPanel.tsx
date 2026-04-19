"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { DiscordCommunityBotSettings } from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type CampaignItem = {
  id: string;
  title: string;
  featured?: boolean;
  xpBudget?: number;
};

type QuestItem = {
  id: string;
  title: string;
  xp?: number;
};

type RewardItem = {
  id: string;
  title: string;
  cost?: number;
  rarity?: string;
};

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  campaigns: CampaignItem[];
  quests: QuestItem[];
  rewards: RewardItem[];
  savingDiscordBotSettings: boolean;
  runningMissionAction: "digest" | "campaign" | "quest" | "reward" | null;
  missionNotice: string;
  missionNoticeTone: "success" | "error";
  onSaveDiscordBotConfig: () => void;
  onRunMissionAction: (
    mode: "digest" | "campaign" | "quest" | "reward",
    contentId?: string
  ) => void;
};

export function CommunityMissionsPanel({
  settings,
  setSettings,
  campaigns,
  quests,
  rewards,
  savingDiscordBotSettings,
  runningMissionAction,
  missionNotice,
  missionNoticeTone,
  onSaveDiscordBotConfig,
  onRunMissionAction,
}: Props) {
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedQuestId, setSelectedQuestId] = useState("");
  const [selectedRewardId, setSelectedRewardId] = useState("");

  useEffect(() => {
    if (!selectedCampaignId && campaigns[0]?.id) {
      setSelectedCampaignId(campaigns[0].id);
    }
  }, [campaigns, selectedCampaignId]);

  useEffect(() => {
    if (!selectedQuestId && quests[0]?.id) {
      setSelectedQuestId(quests[0].id);
    }
  }, [quests, selectedQuestId]);

  useEffect(() => {
    if (!selectedRewardId && rewards[0]?.id) {
      setSelectedRewardId(rewards[0].id);
    }
  }, [rewards, selectedRewardId]);

  return (
    <OpsPanel
      eyebrow="Missions"
      title="Mission rail and featured digests"
      description="Control the public mission board this project pushes into its own communities and decide how aggressive the daily mission rail should be."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard label="Live campaigns" value={campaigns.length} sub="Campaigns available for a community push right now." emphasis={campaigns.length > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Live quests" value={quests.length} sub="Mission lanes currently available to contributors." emphasis={quests.length > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Live rewards" value={rewards.length} sub="Visible rewards the community can be nudged toward." />
          <OpsMetricCard label="Mission digest" value={settings.missionDigestEnabled ? "Armed" : "Parked"} sub="Whether the daily mission summary rail is enabled." emphasis={settings.missionDigestEnabled ? "primary" : "default"} />
        </div>

        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span>Enable mission digest</span>
              <input
                type="checkbox"
                checked={settings.missionDigestEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    missionDigestEnabled: event.target.checked,
                  }))
                }
              />
            </label>

            <label className="rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
                Digest cadence
              </span>
              <select
                value={settings.missionDigestCadence}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    missionDigestCadence: event.target.value as
                      | "manual"
                      | "daily"
                      | "weekly",
                  }))
                }
                className="w-full bg-transparent text-sm text-text outline-none"
              >
                <option value="manual">Manual only</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>

            <label className="rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-sub">
                Delivery target
              </span>
              <select
                value={settings.missionDigestTarget}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    missionDigestTarget: event.target.value as
                      | "discord"
                      | "telegram"
                      | "both",
                  }))
                }
                className="w-full bg-transparent text-sm text-text outline-none"
              >
                <option value="both">Discord + Telegram</option>
                <option value="discord">Discord only</option>
                <option value="telegram">Telegram only</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={onSaveDiscordBotConfig}
              disabled={savingDiscordBotSettings}
              className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDiscordBotSettings ? "Saving mission settings..." : "Save mission settings"}
            </button>
            <button
              onClick={() => onRunMissionAction("digest")}
              disabled={runningMissionAction === "digest"}
              className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningMissionAction === "digest" ? "Posting digest..." : "Send mission digest now"}
            </button>
          </div>

          {missionNotice ? (
            <p
              className={`mt-4 rounded-[18px] border px-4 py-3 text-sm leading-6 ${
                missionNoticeTone === "error"
                  ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                  : "border-primary/20 bg-primary/10 text-primary"
              }`}
            >
              {missionNotice}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-text">Featured campaigns</p>
              <OpsStatusPill tone={campaigns.length > 0 ? "success" : "default"}>
                {campaigns.length} live
              </OpsStatusPill>
            </div>
            <select
              value={selectedCampaignId}
              onChange={(event) => setSelectedCampaignId(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none"
            >
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))
              ) : (
                <option value="">No live campaigns</option>
              )}
            </select>
            <button
              onClick={() => selectedCampaignId && onRunMissionAction("campaign", selectedCampaignId)}
              disabled={!selectedCampaignId || runningMissionAction === "campaign"}
              className="mt-4 w-full rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningMissionAction === "campaign" ? "Pushing campaign..." : "Push selected campaign"}
            </button>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-text">Live quests</p>
              <OpsStatusPill tone={quests.length > 0 ? "success" : "default"}>
                {quests.length} live
              </OpsStatusPill>
            </div>
            <select
              value={selectedQuestId}
              onChange={(event) => setSelectedQuestId(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none"
            >
              {quests.length > 0 ? (
                quests.map((quest) => (
                  <option key={quest.id} value={quest.id}>
                    {quest.title}
                  </option>
                ))
              ) : (
                <option value="">No live quests</option>
              )}
            </select>
            <button
              onClick={() => selectedQuestId && onRunMissionAction("quest", selectedQuestId)}
              disabled={!selectedQuestId || runningMissionAction === "quest"}
              className="mt-4 w-full rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningMissionAction === "quest" ? "Pushing quest..." : "Push selected quest"}
            </button>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-text">Reward nudges</p>
              <OpsStatusPill tone={rewards.length > 0 ? "success" : "default"}>
                {rewards.length} live
              </OpsStatusPill>
            </div>
            <select
              value={selectedRewardId}
              onChange={(event) => setSelectedRewardId(event.target.value)}
              className="mt-4 w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm text-text outline-none"
            >
              {rewards.length > 0 ? (
                rewards.map((reward) => (
                  <option key={reward.id} value={reward.id}>
                    {reward.title}
                  </option>
                ))
              ) : (
                <option value="">No live rewards</option>
              )}
            </select>
            <button
              onClick={() => selectedRewardId && onRunMissionAction("reward", selectedRewardId)}
              disabled={!selectedRewardId || runningMissionAction === "reward"}
              className="mt-4 w-full rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningMissionAction === "reward" ? "Pushing reward..." : "Push selected reward"}
            </button>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
