"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Gauge,
  RadioTower,
  Rocket,
  ShieldCheck,
  Signal,
  Swords,
  UsersRound,
} from "lucide-react";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
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

function StatusCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.022] bg-white/[0.012] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border ${
            props.tone === "warning"
              ? "border-amber-400/20 bg-amber-500/[0.055] text-amber-300"
              : props.tone === "success"
                ? "border-emerald-400/20 bg-emerald-500/[0.055] text-emerald-300"
              : "border-white/10 bg-white/[0.012] text-sub"
          }`}
        >
          {props.icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[8px] font-black uppercase tracking-[0.15em] text-sub">
            {props.label}
          </p>
          <p className="mt-1 truncate text-[11px] font-semibold text-text">{props.value}</p>
        </div>
      </div>
    </div>
  );
}

function OverviewMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div
      className={`rounded-[14px] border px-3 py-2.5 ${
        tone === "success"
          ? "border-emerald-300/[0.12] bg-emerald-300/[0.035]"
          : tone === "warning"
            ? "border-amber-300/[0.12] bg-amber-300/[0.035]"
            : "border-white/[0.022] bg-white/[0.012]"
      }`}
    >
      <p className="text-[8px] font-black uppercase tracking-[0.15em] text-sub">{label}</p>
      <p className="mt-1.5 truncate text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
        {value}
      </p>
    </div>
  );
}

function ReadinessRail({
  icon,
  label,
  value,
  detail,
  score,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  score: number;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-[12px] border ${
          tone === "warning"
            ? "border-amber-300/[0.18] bg-amber-300/[0.055] text-amber-200"
            : tone === "success"
              ? "border-emerald-300/[0.18] bg-emerald-300/[0.055] text-emerald-200"
              : "border-white/[0.035] bg-white/[0.018] text-primary"
        }`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[12px] font-semibold text-text">{label}</p>
          <p className="shrink-0 text-[10px] font-bold text-sub">{value}</p>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-sub">{detail}</p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.035]">
          <div
            className={`h-full rounded-full ${
              tone === "warning" ? "bg-amber-300" : tone === "success" ? "bg-emerald-300" : "bg-primary"
            }`}
            style={{ width: `${Math.max(6, Math.min(100, score))}%` }}
          />
        </div>
      </div>
      <ArrowRight size={13} className="text-primary" />
    </div>
  );
}

function WorkflowColumn({
  icon,
  label,
  title,
  body,
  metrics,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  body: string;
  metrics: Array<{ label: string; value: string | number }>;
  tone?: "default" | "success" | "warning";
}) {
  return (
    <div
      className={`rounded-[18px] border p-3.5 ${
        tone === "warning"
          ? "border-amber-300/[0.12] bg-amber-300/[0.025]"
          : tone === "success"
            ? "border-primary/[0.12] bg-primary/[0.035]"
            : "border-white/[0.022] bg-white/[0.012]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-white/[0.035] bg-black/20 text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-primary">{label}</p>
          <h3 className="mt-1.5 text-[0.95rem] font-semibold tracking-[-0.02em] text-text">
            {title}
          </h3>
          <p className="mt-1.5 text-[12px] leading-5 text-sub">{body}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0 rounded-[12px] border border-white/[0.02] bg-black/20 px-2.5 py-2">
            <p className="truncate text-[8px] font-black uppercase tracking-[0.13em] text-sub">
              {metric.label}
            </p>
            <p className="mt-1 truncate text-[12px] font-semibold text-text">{metric.value}</p>
          </div>
        ))}
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
  const providerReadyCount = [
    discordIntegrationStatus === "connected",
    telegramIntegrationStatus === "connected",
    xIntegrationStatus === "connected",
  ].filter(Boolean).length;
  const enabledWorkflowCount = [
    telegramCommandsEnabled,
    captainsEnabled,
    activationBoardsEnabled,
    activeAutomationCount > 0,
    enabledPlaybookCount > 0,
  ].filter(Boolean).length;
  const contentCount = campaignCount + questCount + raidCount;
  const riskPressureCount =
    watchlistCount +
    callbackFailures +
    onchainFailures +
    recentAutomationFailureCount +
    blockedAutomationCount +
    degradedAutomationCount +
    overdueCaptainCount;
  const reachScore = Math.min(
    100,
    (linkedContributorCount > 0 ? 45 : 0) +
      (walletVerifiedCount > 0 ? 35 : 0) +
      (providerReadyCount > 0 ? 20 : 0)
  );
  const executionScore = Math.min(
    100,
    (activeAutomationCount > 0 ? 35 : 0) +
      (readyAutomationCount > 0 ? 25 : 0) +
      (enabledPlaybookCount > 0 ? 20 : 0) +
      (automationSuccessRate >= 70 ? 20 : automationSuccessRate > 0 ? 10 : 0)
  );
  const captainScore = Math.min(100, Math.round(captainCoverageRate));
  const overallReadiness = Math.min(
    100,
    Math.round((Math.min(100, contentCount * 18) + reachScore + executionScore + captainScore) / 4)
  );
  const nextFocus =
    riskPressureCount > 0
      ? "Stabilize community risk"
      : enabledWorkflowCount < 2
        ? "Connect one operating module"
        : newcomerCount + reactivationCount > 0
          ? "Push cohort activation"
          : recommendedPlayTitle || "Keep workflows running";

  return (
    <OpsPanel
      eyebrow="Overview"
      title={`${projectName} community control center`}
      description="A project-safe read of community readiness, workflow pressure and the next owner move."
      tone="accent"
      action={
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/projects/${projectId}`}
            className="rounded-full border border-white/[0.026] bg-white/[0.012] px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.11em] text-text transition hover:border-primary/40 hover:text-primary"
          >
            Back to project
          </Link>
          <Link
            href={`/projects/${projectId}/launch`}
            className="rounded-full bg-primary px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.11em] text-black transition hover:brightness-105"
          >
            Launch workspace
          </Link>
        </div>
      }
    >
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_350px] xl:items-start">
        <div className="rounded-[18px] border border-primary/[0.14] bg-[radial-gradient(circle_at_0%_0%,rgba(186,255,59,0.09),transparent_32%),linear-gradient(180deg,rgba(15,20,28,0.9),rgba(8,10,15,0.92))] p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Recommended command
              </p>
              <h3 className="mt-2 max-w-3xl text-[1.12rem] font-semibold tracking-[-0.03em] text-text md:text-[1.32rem]">
                {recommendedPlayTitle || nextFocus}
              </h3>
              <p className="mt-2 max-w-4xl text-[12px] leading-5 text-sub">
                {recommendedPlaySummary ||
                  "Community OS is calm. Keep the current workflow posture visible and only open the next module when a signal asks for it."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OpsStatusPill tone="success">
                {activeMode === "owner" ? "Owner mode" : "Captain mode"}
              </OpsStatusPill>
              {recommendedPlayActionLabel ? (
                <OpsStatusPill tone="warning">{recommendedPlayActionLabel}</OpsStatusPill>
              ) : null}
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewMetric
              label="Owner signals"
              value={ownerSignalCount}
              tone={ownerSignalCount > 0 ? "warning" : "success"}
            />
            <OverviewMetric
              label="Automation pressure"
              value={automationPressureCount}
              tone={automationPressureCount > 0 ? "warning" : "success"}
            />
            <OverviewMetric
              label="Captain pressure"
              value={captainPressureCount}
              tone={captainPressureCount > 0 ? "warning" : "success"}
            />
            <OverviewMetric
              label="Risk pressure"
              value={riskPressureCount}
              tone={riskPressureCount > 0 ? "warning" : "success"}
            />
          </div>
        </div>

        <div className="rounded-[18px] border border-white/[0.024] bg-white/[0.012] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sub">
                Launch readiness
              </p>
              <p className="mt-1.5 text-[1rem] font-semibold tracking-[-0.02em] text-text">
                {overallReadiness}% operational
              </p>
              <p className="mt-1 text-[11px] leading-5 text-sub">{nextFocus}</p>
            </div>
            <Gauge size={18} className="shrink-0 text-primary" />
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/35">
            <div
              className="h-full rounded-full bg-primary shadow-[0_0_18px_rgba(186,255,59,0.28)]"
              style={{ width: `${overallReadiness}%` }}
            />
          </div>
          <div className="mt-3 grid gap-2">
            <ReadinessRail
              icon={<Swords size={14} />}
              label="Campaign graph"
              value={`${contentCount} nodes`}
              detail={`${campaignCount} campaigns, ${questCount} quests, ${raidCount} raids`}
              score={Math.min(100, contentCount * 18)}
              tone={contentCount > 0 ? "success" : "warning"}
            />
            <ReadinessRail
              icon={<UsersRound size={14} />}
              label="Reach layer"
              value={`${linkedContributorCount} ready`}
              detail={`${walletVerifiedCount} wallet verified, ${providerReadyCount}/3 providers`}
              score={reachScore}
              tone={reachScore >= 50 ? "success" : "warning"}
            />
            <ReadinessRail
              icon={<Bot size={14} />}
              label="Execution layer"
              value={`${activeAutomationCount} live`}
              detail={`${readyAutomationCount} ready, ${enabledPlaybookCount} playbooks`}
              score={executionScore}
              tone={automationPressureCount > 0 ? "warning" : executionScore > 0 ? "success" : "default"}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-3">
        <WorkflowColumn
          icon={<Rocket size={16} />}
          label="Build the surface"
          title="Content and launch lanes"
          body="Campaigns, quests and raids define what the community can actually do next."
          tone={contentCount > 0 ? "success" : "warning"}
          metrics={[
            { label: "Campaigns", value: campaignCount },
            { label: "Quests", value: questCount },
            { label: "Raids", value: raidCount },
          ]}
        />
        <WorkflowColumn
          icon={<RadioTower size={16} />}
          label="Connect the crowd"
          title="Providers and members"
          body="Provider links and verified contributors decide how cleanly the next wave can be reached."
          tone={providerReadyCount > 0 || linkedContributorCount > 0 ? "success" : "warning"}
          metrics={[
            { label: "Providers", value: `${providerReadyCount}/3` },
            { label: "Command", value: linkedContributorCount },
            { label: "Wallet", value: walletVerifiedCount },
          ]}
        />
        <WorkflowColumn
          icon={<ShieldCheck size={16} />}
          label="Protect execution"
          title="Captains, automation and risk"
          body="Owners can see whether the system is ready to run or needs attention before a push."
          tone={riskPressureCount > 0 || captainPressureCount > 0 ? "warning" : "success"}
          metrics={[
            { label: "Captains", value: captainCount },
            { label: "Auto", value: `${activeAutomationCount}/${automationRailCount}` },
            { label: "Risk", value: riskPressureCount },
          ]}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <div className="rounded-[18px] border border-white/[0.024] bg-white/[0.012] p-3.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary">
                Connected modules
              </p>
              <p className="mt-1.5 text-[12px] leading-5 text-sub">
                Discord, Telegram, X and optional operating modules stay visible before setup.
              </p>
            </div>
            <OpsStatusPill tone={enabledWorkflowCount >= 3 ? "success" : "warning"}>
              {enabledWorkflowCount}/5 enabled
            </OpsStatusPill>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
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
          <p className="mt-3 rounded-[14px] border border-white/[0.022] bg-black/20 px-3 py-2.5 text-[12px] leading-5 text-sub">
            {latestIssue}
          </p>
        </div>

        <div className="grid gap-2">
          <StatusCard icon={<Signal size={15} />} label="Last rank sync" value={formatTimestamp(lastRankSyncAt)} />
          <StatusCard
            icon={<Activity size={15} />}
            label="Last leaderboard"
            value={formatTimestamp(lastLeaderboardPostedAt)}
          />
          <StatusCard
            icon={<Activity size={15} />}
            label="Mission digest"
            value={formatTimestamp(lastMissionDigestAt)}
          />
          <StatusCard icon={<Activity size={15} />} label="Raid alert" value={formatTimestamp(lastRaidAlertAt)} />
          <StatusCard
            icon={<Activity size={15} />}
            label="Newcomer push"
            value={formatTimestamp(lastNewcomerPushAt)}
          />
          <StatusCard
            icon={<Activity size={15} />}
            label="Comeback push"
            value={formatTimestamp(lastReactivationPushAt)}
          />
          <StatusCard
            icon={<Activity size={15} />}
            label="Activation board"
            value={formatTimestamp(lastActivationBoardAt)}
          />
          <StatusCard
            icon={<Activity size={15} />}
            label="Automation run"
            value={formatTimestamp(lastAutomationRunAt)}
          />
          <StatusCard
            icon={<ShieldCheck size={15} />}
            label="Incident posture"
            value={`${callbackFailures} callback | ${onchainFailures} on-chain | ${recentAutomationFailureCount} execution`}
            tone={
              callbackFailures > 0 || onchainFailures > 0 || recentAutomationFailureCount > 0
                ? "warning"
                : "success"
            }
          />
        </div>
      </div>
    </OpsPanel>
  );
}
