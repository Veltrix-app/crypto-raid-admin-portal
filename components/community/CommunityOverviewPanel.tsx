"use client";

import Link from "next/link";
import { Activity, ShieldCheck, Signal, UsersRound } from "lucide-react";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import {
  describeIntegrationStatus,
  getIntegrationTone,
} from "@/components/community/community-config";

type Props = {
  projectId: string;
  projectName: string;
  activeMode: "owner" | "captain";
  discordIntegrationStatus: string;
  telegramIntegrationStatus: string;
  xIntegrationStatus: string;
  telegramCommandsEnabled: boolean;
  captainsEnabled: boolean;
  activationBoardsEnabled: boolean;
  campaignCount: number;
  questCount: number;
  raidCount: number;
  linkedContributorCount: number;
  walletVerifiedCount: number;
  captainCount: number;
  newcomerCount: number;
  reactivationCount: number;
  watchlistCount: number;
  callbackFailures: number;
  onchainFailures: number;
  latestIssue: string;
  automationRailCount: number;
  activeAutomationCount: number;
  readyAutomationCount: number;
  blockedAutomationCount: number;
  degradedAutomationCount: number;
  dueAutomationCount: number;
  enabledPlaybookCount: number;
  recentAutomationFailureCount: number;
  automationSuccessRate: number;
  captainCoverageRate: number;
  unassignedCaptainCount: number;
  overdueCaptainCount: number;
  lastRankSyncAt: string;
  lastLeaderboardPostedAt: string;
  lastMissionDigestAt: string;
  lastRaidAlertAt: string;
  lastAutomationRunAt: string;
  lastNewcomerPushAt: string;
  lastReactivationPushAt: string;
  lastActivationBoardAt: string;
  recommendedPlayTitle: string;
  recommendedPlaySummary: string;
  recommendedPlayActionLabel: string;
  ownerSignalCount: number;
  captainPriorityCount: number;
};

function formatTimestamp(value: string) {
  return value ? new Date(value).toLocaleString() : "Not run yet";
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.round(value))}%`;
}

function StatusCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[16px] border ${
            props.tone === "warning"
              ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
              : "border-white/10 bg-card text-sub"
          }`}
        >
          {props.icon}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">
            {props.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-text">{props.value}</p>
        </div>
      </div>
    </div>
  );
}

export function CommunityOverviewPanel({
  projectId,
  projectName,
  activeMode,
  discordIntegrationStatus,
  telegramIntegrationStatus,
  xIntegrationStatus,
  telegramCommandsEnabled,
  captainsEnabled,
  activationBoardsEnabled,
  campaignCount,
  questCount,
  raidCount,
  linkedContributorCount,
  walletVerifiedCount,
  captainCount,
  newcomerCount,
  reactivationCount,
  watchlistCount,
  callbackFailures,
  onchainFailures,
  latestIssue,
  automationRailCount,
  activeAutomationCount,
  readyAutomationCount,
  blockedAutomationCount,
  degradedAutomationCount,
  dueAutomationCount,
  enabledPlaybookCount,
  recentAutomationFailureCount,
  automationSuccessRate,
  captainCoverageRate,
  unassignedCaptainCount,
  overdueCaptainCount,
  lastRankSyncAt,
  lastLeaderboardPostedAt,
  lastMissionDigestAt,
  lastRaidAlertAt,
  lastAutomationRunAt,
  lastNewcomerPushAt,
  lastReactivationPushAt,
  lastActivationBoardAt,
  recommendedPlayTitle,
  recommendedPlaySummary,
  recommendedPlayActionLabel,
  ownerSignalCount,
  captainPriorityCount,
}: Props) {
  const automationPressureCount =
    blockedAutomationCount + degradedAutomationCount + dueAutomationCount;
  const captainPressureCount = unassignedCaptainCount + overdueCaptainCount + captainPriorityCount;

  return (
    <OpsPanel
      eyebrow="Overview"
      title={`${projectName} community control center`}
      description="This control room is scoped to this project only. It should tell an owner what needs attention, what is healthy, and which workflows are ready to push without drifting into member-level management."
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
            href={`/projects/${projectId}/launch`}
            className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95"
          >
            Open launch workspace
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          <OpsMetricCard
            label="Active mode"
            value={activeMode === "owner" ? "Owner" : "Captain"}
            sub="The page can bias toward owner guidance or captain execution without leaving this project scope."
            emphasis="primary"
          />
          <OpsMetricCard
            label="Campaigns"
            value={campaignCount}
            sub="Campaigns currently feeding community pressure, rankings and launch sequencing."
            emphasis={campaignCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Quests"
            value={questCount}
            sub="Mission surfaces that can feed automations, leaderboards and funnels."
            emphasis={questCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Raids"
            value={raidCount}
            sub="Raid pressure that can be coordinated through playbooks and alerts."
            emphasis={raidCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Linked contributors"
            value={linkedContributorCount}
            sub="Community members already reachable through commands and delivery workflows."
            emphasis={linkedContributorCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Wallet verified"
            value={walletVerifiedCount}
            sub="Contributors ready for deeper trust, reward and on-chain workflows."
          />
          <OpsMetricCard
            label="Captains assigned"
            value={captainCount}
            sub="Project-owned captain seats that currently have an active person attached."
            emphasis={captainCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Captain coverage"
            value={formatPercent(captainCoverageRate)}
            sub="How much of the intended captain surface is actively covered right now."
            emphasis={captainCoverageRate >= 70 ? "primary" : captainCoverageRate > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Unassigned seats"
            value={unassignedCaptainCount}
            sub="Captain seats that still need an owner assignment before the queue is fully covered."
            emphasis={unassignedCaptainCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Overdue captain actions"
            value={overdueCaptainCount}
            sub="Queue work that has slipped past its due window and needs intervention."
            emphasis={overdueCaptainCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Automations"
            value={automationRailCount}
            sub="Durable community execution workflows stored in Community OS."
            emphasis={automationRailCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Armed now"
            value={activeAutomationCount}
            sub="Automations currently active and eligible to fire."
            emphasis={activeAutomationCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Ready now"
            value={readyAutomationCount}
            sub="Automations already in a ready posture for the next community move."
            emphasis={readyAutomationCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Degraded or blocked"
            value={blockedAutomationCount + degradedAutomationCount}
            sub="Execution workflows that are stalled or drifting and need owner attention."
            emphasis={blockedAutomationCount + degradedAutomationCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Success rate"
            value={formatPercent(automationSuccessRate)}
            sub="Current automation health based on recent recorded execution outcomes."
            emphasis={automationSuccessRate >= 70 ? "primary" : automationSuccessRate > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Playbooks enabled"
            value={enabledPlaybookCount}
            sub="Reusable operating modes currently armed for launch, raid or comeback pressure."
            emphasis={enabledPlaybookCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Newcomer pressure"
            value={newcomerCount}
            sub="Fresh contributors waiting for a first mission."
            emphasis={newcomerCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Comeback pressure"
            value={reactivationCount}
            sub="Dormant contributors that could be pulled back through reactivation waves."
            emphasis={reactivationCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Watchlist"
            value={watchlistCount}
            sub="Community members currently carrying trust, quality or moderation pressure."
            emphasis={watchlistCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-3">
          <div className="rounded-[24px] border border-primary/20 bg-[linear-gradient(180deg,rgba(186,255,59,0.1),rgba(13,19,29,0.96))] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Recommended next play
                </p>
                <p className="mt-2 text-lg font-extrabold text-text">
                  {recommendedPlayTitle || "Current workflows look stable"}
                </p>
                <p className="mt-3 text-sm leading-7 text-sub">
                  {recommendedPlaySummary ||
                    "No urgent owner intervention is currently required in this project workspace."}
                </p>
              </div>
              {recommendedPlayActionLabel ? (
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  {recommendedPlayActionLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[18px] border border-white/10 bg-card/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                  Owner signals
                </p>
                <p className="mt-2 text-lg font-bold text-text">{ownerSignalCount}</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-card/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                  Automation pressure
                </p>
                <p className="mt-2 text-lg font-bold text-text">{automationPressureCount}</p>
              </div>
              <div className="rounded-[18px] border border-white/10 bg-card/70 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                  Captain pressure
                </p>
                <p className="mt-2 text-lg font-bold text-text">{captainPressureCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-primary/20 bg-primary/10 text-primary">
                <UsersRound size={18} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">
                  Provider workflows
                </p>
                <p className="mt-1 text-sm font-semibold text-text">
                  Discord, Telegram and X are managed from one project-private workspace.
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
            <StatusCard
              icon={<Signal size={18} />}
              label="Last rank sync"
              value={formatTimestamp(lastRankSyncAt)}
            />
            <StatusCard
              icon={<Activity size={18} />}
              label="Last leaderboard post"
              value={formatTimestamp(lastLeaderboardPostedAt)}
            />
            <StatusCard
              icon={<Activity size={18} />}
              label="Last mission digest"
              value={formatTimestamp(lastMissionDigestAt)}
            />
            <StatusCard
              icon={<Activity size={18} />}
              label="Last raid alert"
              value={formatTimestamp(lastRaidAlertAt)}
            />
            <StatusCard
              icon={<Activity size={18} />}
              label="Last newcomer push"
              value={formatTimestamp(lastNewcomerPushAt)}
            />
            <StatusCard
              icon={<Activity size={18} />}
              label="Last comeback push"
              value={formatTimestamp(lastReactivationPushAt)}
            />
            <StatusCard
              icon={<Activity size={18} />}
              label="Last activation board"
              value={formatTimestamp(lastActivationBoardAt)}
            />
            <StatusCard
              icon={<Activity size={18} />}
              label="Last automation run"
              value={formatTimestamp(lastAutomationRunAt)}
            />
            <StatusCard
              icon={<ShieldCheck size={18} />}
              label="Incident posture"
              value={`${callbackFailures} callback | ${onchainFailures} on-chain | ${recentAutomationFailureCount} execution`}
              tone={
                callbackFailures > 0 || onchainFailures > 0 || recentAutomationFailureCount > 0
                  ? "warning"
                  : "default"
              }
            />
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">
              Current issue
            </p>
            <p className="mt-3 rounded-[18px] border border-white/8 bg-card px-4 py-3 text-sm leading-6 text-sub">
              {latestIssue}
            </p>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
