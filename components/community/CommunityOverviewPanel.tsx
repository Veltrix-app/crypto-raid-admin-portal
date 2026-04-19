"use client";

import Link from "next/link";
import { Activity, ShieldCheck, Signal, UsersRound } from "lucide-react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { describeIntegrationStatus, getIntegrationTone } from "@/components/community/community-config";

type Props = {
  projectId: string;
  projectName: string;
  discordIntegrationStatus: string;
  telegramIntegrationStatus: string;
  xIntegrationStatus: string;
  telegramCommandsEnabled: boolean;
  captainsEnabled: boolean;
  activationBoardsEnabled: boolean;
  campaignCount: number;
  questCount: number;
  raidCount: number;
  rewardCount: number;
  teamMemberCount: number;
  linkedContributorCount: number;
  walletVerifiedCount: number;
  captainCount: number;
  newcomerCount: number;
  reactivationCount: number;
  watchlistCount: number;
  callbackFailures: number;
  onchainFailures: number;
  latestIssue: string;
  lastRankSyncAt: string;
  lastLeaderboardPostedAt: string;
  lastMissionDigestAt: string;
  lastRaidAlertAt: string;
  lastAutomationRunAt: string;
  lastNewcomerPushAt: string;
  lastReactivationPushAt: string;
  lastActivationBoardAt: string;
};

function formatTimestamp(value: string) {
  return value ? new Date(value).toLocaleString() : "Not run yet";
}

export function CommunityOverviewPanel({
  projectId,
  projectName,
  discordIntegrationStatus,
  telegramIntegrationStatus,
  xIntegrationStatus,
  telegramCommandsEnabled,
  captainsEnabled,
  activationBoardsEnabled,
  campaignCount,
  questCount,
  raidCount,
  rewardCount,
  teamMemberCount,
  linkedContributorCount,
  walletVerifiedCount,
  captainCount,
  newcomerCount,
  reactivationCount,
  watchlistCount,
  callbackFailures,
  onchainFailures,
  latestIssue,
  lastRankSyncAt,
  lastLeaderboardPostedAt,
  lastMissionDigestAt,
  lastRaidAlertAt,
  lastAutomationRunAt,
  lastNewcomerPushAt,
  lastReactivationPushAt,
  lastActivationBoardAt,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Overview"
      title={`${projectName} community rail`}
      description="This control room is scoped to this project only. Use it to run the bot, keep rails healthy and ship community-facing operations without exposing other projects."
      tone="accent"
      action={
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary"
          >
            Back to project
          </Link>
          <Link
            href="/quests"
            className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95"
          >
            Open mission rails
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <OpsMetricCard label="Campaigns" value={campaignCount} sub="Community can post, rank and activate against these lanes." emphasis={campaignCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Missions" value={questCount} sub="Live quest surfaces that can feed leaderboards and push rails." emphasis={questCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Raids" value={raidCount} sub="Live raid rails that can be pushed or automated from here." emphasis={raidCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Rewards" value={rewardCount} sub="Reward drops available for claim and promotion." />
          <OpsMetricCard label="Team members" value={teamMemberCount} sub="People currently attached to this workspace." />
          <OpsMetricCard label="Linked contributors" value={linkedContributorCount} sub="Contributors already reachable through community command rails." emphasis={linkedContributorCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Wallet verified" value={walletVerifiedCount} sub="Community contributors with a verified wallet ready for deeper trust rails." />
          <OpsMetricCard label="Captains" value={captainCount} sub="Assigned community leads attached to this project." emphasis={captainCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Newcomers" value={newcomerCount} sub="Fresh contributors waiting for a starter lane." />
          <OpsMetricCard label="Reactivation" value={reactivationCount} sub="Dormant contributors worth pulling back in." emphasis={reactivationCount > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Watchlist" value={watchlistCount} sub="Contributors currently carrying trust or quality issues." emphasis={watchlistCount > 0 ? "warning" : "default"} />
        </div>

        <div className="grid gap-3">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-primary/20 bg-primary/10 text-primary">
                <UsersRound size={18} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Provider rail</p>
                <p className="mt-1 text-sm font-semibold text-text">
                  Discord, Telegram and X are managed from one project-private page.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <OpsStatusPill tone={getIntegrationTone(discordIntegrationStatus)}>
                {describeIntegrationStatus("Discord", discordIntegrationStatus)}
              </OpsStatusPill>
              <OpsStatusPill tone={getIntegrationTone(telegramIntegrationStatus)}>
                {describeIntegrationStatus("Telegram", telegramIntegrationStatus)}
              </OpsStatusPill>
              <OpsStatusPill tone={getIntegrationTone(xIntegrationStatus)}>
                {describeIntegrationStatus("X", xIntegrationStatus)}
              </OpsStatusPill>
              <OpsStatusPill tone={telegramCommandsEnabled ? "success" : "default"}>
                Telegram commands {telegramCommandsEnabled ? "enabled" : "parked"}
              </OpsStatusPill>
              <OpsStatusPill tone={captainsEnabled ? "success" : "default"}>
                Captains {captainsEnabled ? "enabled" : "parked"}
              </OpsStatusPill>
              <OpsStatusPill tone={activationBoardsEnabled ? "success" : "default"}>
                Activation boards {activationBoardsEnabled ? "enabled" : "parked"}
              </OpsStatusPill>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Signal size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last rank sync</p>
                  <p className="mt-1 text-sm font-semibold text-text">{formatTimestamp(lastRankSyncAt)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last leaderboard post</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatTimestamp(lastLeaderboardPostedAt)}
                  </p>
                </div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last mission digest</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatTimestamp(lastMissionDigestAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last raid alert</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatTimestamp(lastRaidAlertAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last newcomer push</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatTimestamp(lastNewcomerPushAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last comeback push</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatTimestamp(lastReactivationPushAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last activation board</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatTimestamp(lastActivationBoardAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-card text-sub">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Last automation run</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatTimestamp(lastAutomationRunAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-amber-400/20 bg-amber-500/10 text-amber-300">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">Current incident posture</p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {callbackFailures} callback failures, {onchainFailures} on-chain incidents
                </p>
              </div>
            </div>
            <p className="mt-4 rounded-[18px] border border-white/8 bg-card px-4 py-3 text-sm leading-6 text-sub">
              {latestIssue}
            </p>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
