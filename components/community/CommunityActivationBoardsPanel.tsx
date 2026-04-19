"use client";

import type { Dispatch, SetStateAction } from "react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { DiscordCommunityBotSettings } from "@/components/community/community-config";

type ActivationBoard = {
  campaignId: string;
  title: string;
  featured: boolean;
  activationScore: number;
  readyContributors: number;
  newcomerCandidates: number;
  reactivationCandidates: number;
  coreCandidates: number;
  questCount: number;
  raidCount: number;
  rewardCount: number;
  recommendedLane: "newcomer" | "reactivation" | "core";
  recommendedCopy: string;
};

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  boards: ActivationBoard[];
  savingSettings: boolean;
  runningActivationBoardCampaignId: string | null;
  activationNotice: string;
  activationNoticeTone: "success" | "error";
  onSaveSettings: () => void;
  onRunActivationBoard: (campaignId: string) => void;
};

function laneLabel(value: ActivationBoard["recommendedLane"]) {
  if (value === "reactivation") return "Reactivation";
  if (value === "core") return "Core pressure";
  return "Newcomer";
}

export function CommunityActivationBoardsPanel({
  settings,
  setSettings,
  boards,
  savingSettings,
  runningActivationBoardCampaignId,
  activationNotice,
  activationNoticeTone,
  onSaveSettings,
  onRunActivationBoard,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Activation Boards"
      title="Campaign-specific activation boards"
      description="Turn campaigns into community-ready boards that tell you which lane to push, how much pressure you can absorb and what content is live."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Active boards"
            value={boards.length}
            sub="Campaigns currently eligible for activation pushes."
            emphasis={boards.length > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Featured boards"
            value={boards.filter((board) => board.featured).length}
            sub="Featured campaigns that deserve extra community pressure."
          />
          <OpsMetricCard
            label="Best score"
            value={boards[0]?.activationScore ?? 0}
            sub="Highest activation score across live campaign boards."
          />
          <OpsMetricCard
            label="Ready pool"
            value={boards[0]?.readyContributors ?? 0}
            sub="Command + wallet ready contributors available to the leading board."
          />
        </div>

        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Activation board controls</p>
              <p className="mt-2 text-sm text-sub">
                Keep these boards opt-in, then push them campaign by campaign when you want a
                clean, targeted community wave.
              </p>
            </div>
            <OpsStatusPill tone={settings.activationBoardsEnabled ? "success" : "default"}>
              {settings.activationBoardsEnabled ? "Activation boards enabled" : "Activation boards parked"}
            </OpsStatusPill>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_0.8fr]">
            <label className="flex items-center gap-3 rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text">
              <input
                type="checkbox"
                checked={settings.activationBoardsEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    activationBoardsEnabled: event.target.checked,
                  }))
                }
              />
              Enable activation boards
            </label>

            <label className="space-y-2 text-xs font-bold uppercase tracking-[0.12em] text-sub">
              Cadence
              <select
                value={settings.activationBoardCadence}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    activationBoardCadence: event.target.value as
                      | "manual"
                      | "daily"
                      | "weekly",
                  }))
                }
                className="w-full rounded-[16px] border border-line bg-panel px-4 py-3 text-sm font-medium normal-case tracking-normal text-text"
              >
                <option value="manual">Manual only</option>
                <option value="daily">Daily pulse</option>
                <option value="weekly">Weekly pulse</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={savingSettings}
              className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSettings ? "Saving board settings..." : "Save board settings"}
            </button>
          </div>

          {activationNotice ? (
            <div
              className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${
                activationNoticeTone === "error"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {activationNotice}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {boards.length > 0 ? (
            boards.map((board) => (
              <div
                key={board.campaignId}
                className="rounded-[24px] border border-line bg-card2 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{board.title}</p>
                    <p className="mt-2 text-sm text-sub">{board.recommendedCopy}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {board.featured ? <OpsStatusPill tone="success">Featured</OpsStatusPill> : null}
                    <OpsStatusPill tone={board.activationScore >= 70 ? "success" : "warning"}>
                      Score {board.activationScore}
                    </OpsStatusPill>
                    <OpsStatusPill tone="default">{laneLabel(board.recommendedLane)}</OpsStatusPill>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-[18px] border border-line bg-card px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Ready</p>
                    <p className="mt-2 text-lg font-black text-text">{board.readyContributors}</p>
                  </div>
                  <div className="rounded-[18px] border border-line bg-card px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Newcomer</p>
                    <p className="mt-2 text-lg font-black text-text">{board.newcomerCandidates}</p>
                  </div>
                  <div className="rounded-[18px] border border-line bg-card px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Reactivation</p>
                    <p className="mt-2 text-lg font-black text-text">
                      {board.reactivationCandidates}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-line bg-card px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Core</p>
                    <p className="mt-2 text-lg font-black text-text">{board.coreCandidates}</p>
                  </div>
                  <div className="rounded-[18px] border border-line bg-card px-4 py-3 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      Live content
                    </p>
                    <p className="mt-2 text-lg font-black text-text">
                      {board.questCount} quests • {board.raidCount} raids • {board.rewardCount} rewards
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onRunActivationBoard(board.campaignId)}
                    disabled={runningActivationBoardCampaignId !== null}
                    className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {runningActivationBoardCampaignId === board.campaignId
                      ? "Posting activation board..."
                      : "Post activation board"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-line bg-card2 px-4 py-6 text-sm text-sub xl:col-span-2">
              No activation boards are live yet. Launch or activate a campaign first.
            </div>
          )}
        </div>
      </div>
    </OpsPanel>
  );
}
