"use client";

import type { Dispatch, SetStateAction } from "react";
import type {
  CommunityCohortSnapshot,
  CommunityHealthRollup,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { DiscordCommunityBotSettings } from "@/components/community/community-config";

type CohortContributor = {
  authUserId: string;
  username: string;
  xp: number;
  level: number;
  trust: number;
  linkedProviders: string[];
  walletVerified: boolean;
  readinessGaps: string[];
  recentFlagReasons: string[];
  daysSinceActive: number | null;
};

type Props = {
  settings: DiscordCommunityBotSettings;
  setSettings: Dispatch<SetStateAction<DiscordCommunityBotSettings>>;
  summary: {
    totalContributors: number;
    newcomers: number;
    warmingUp: number;
    core: number;
    highTrust: number;
    watchlist: number;
    reactivation: number;
    commandReady: number;
    fullStackReady: number;
    openFlags: number;
  };
  newcomers: CohortContributor[];
  highTrust: CohortContributor[];
  reactivation: CohortContributor[];
  watchlist: CohortContributor[];
  cohortSnapshots: CommunityCohortSnapshot[];
  healthRollups: CommunityHealthRollup[];
  trust: {
    averageTrust: number;
    openFlagCount: number;
    watchlistCount: number;
    latestIssue: string;
  };
  savingSettings: boolean;
  runningFunnelAction: "newcomer" | "reactivation" | null;
  funnelNotice: string;
  funnelNoticeTone: "success" | "error";
  onSaveSettings: () => void;
  onRunFunnelAction: (mode: "newcomer" | "reactivation") => void;
};

function findCohortSnapshot(
  snapshots: CommunityCohortSnapshot[],
  key: CommunityCohortSnapshot["key"]
) {
  return snapshots.find((snapshot) => snapshot.key === key) ?? null;
}

function toneFromSnapshot(snapshot: CommunityCohortSnapshot | null) {
  if (!snapshot || snapshot.memberCount === 0) return "default" as const;
  if (snapshot.blockedCount > 0) return "warning" as const;
  if (snapshot.readyCount > 0) return "success" as const;
  return "default" as const;
}

export function CommunityCohortsPanel({
  settings,
  setSettings,
  summary,
  cohortSnapshots,
  healthRollups,
  trust,
  savingSettings,
  runningFunnelAction,
  funnelNotice,
  funnelNoticeTone,
  onSaveSettings,
  onRunFunnelAction,
}: Props) {
  const newcomer = findCohortSnapshot(cohortSnapshots, "newcomer");
  const active = findCohortSnapshot(cohortSnapshots, "active");
  const reactivation = findCohortSnapshot(cohortSnapshots, "reactivation");
  const highTrust = findCohortSnapshot(cohortSnapshots, "high_trust");
  const watchlist = findCohortSnapshot(cohortSnapshots, "watchlist");
  const trustSignal =
    healthRollups.find((signal) => signal.key === "trust_posture") ?? healthRollups[0] ?? null;

  return (
    <OpsPanel
      eyebrow="Cohorts"
      title="Operational cohorts and growth lanes"
      description="These segments exist to help owners and captains steer the community machine. They are pressure lanes, not loose member management views."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Starter pressure"
            value={summary.newcomers}
            sub={`${newcomer?.readyCount ?? 0} newcomer seats are already ready for a first lane.`}
            emphasis={summary.newcomers > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Active rail"
            value={summary.warmingUp + summary.core}
            sub={`${active?.readyCount ?? 0} active contributors are already fully ready.`}
            emphasis={summary.core > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Comeback pressure"
            value={summary.reactivation}
            sub={`${reactivation?.readyCount ?? 0} returning contributors are reachable right now.`}
            emphasis={summary.reactivation > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="High-trust anchor"
            value={summary.highTrust}
            sub="Trusted contributors who can stabilize deeper mission and reward pressure."
            emphasis={summary.highTrust > 0 ? "primary" : "default"}
          />
        </div>

        <div className="rounded-[20px] border border-line bg-card2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Funnel controls</p>
              <p className="mt-2 text-sm leading-5.5 text-sub">
                Turn the newcomer and comeback rails on only when the project is ready to carry the
                resulting pressure into missions, raids and community nudges.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={settings.newcomerFunnelEnabled ? "success" : "default"}>
                {settings.newcomerFunnelEnabled ? "Starter lane armed" : "Starter lane parked"}
              </OpsStatusPill>
              <OpsStatusPill tone={settings.reactivationFunnelEnabled ? "success" : "default"}>
                {settings.reactivationFunnelEnabled ? "Comeback lane armed" : "Comeback lane parked"}
              </OpsStatusPill>
            </div>
          </div>

          <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-[16px] border border-line bg-card px-3.5 py-2.5 text-sm text-text">
              <input
                type="checkbox"
                checked={settings.newcomerFunnelEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    newcomerFunnelEnabled: event.target.checked,
                  }))
                }
              />
              Enable newcomer starter lane
            </label>

            <label className="flex items-center gap-3 rounded-[16px] border border-line bg-card px-3.5 py-2.5 text-sm text-text">
              <input
                type="checkbox"
                checked={settings.reactivationFunnelEnabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    reactivationFunnelEnabled: event.target.checked,
                  }))
                }
              />
              Enable reactivation comeback lane
            </label>
          </div>

          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={savingSettings}
              className="rounded-[16px] border border-line bg-card px-3.5 py-2.5 text-[13px] font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSettings ? "Saving funnel settings..." : "Save funnel settings"}
            </button>
            <button
              type="button"
              onClick={() => onRunFunnelAction("newcomer")}
              disabled={runningFunnelAction !== null}
              className="rounded-[16px] bg-primary px-3.5 py-2.5 text-[13px] font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningFunnelAction === "newcomer" ? "Pushing starter wave..." : "Send starter wave"}
            </button>
            <button
              type="button"
              onClick={() => onRunFunnelAction("reactivation")}
              disabled={runningFunnelAction !== null}
              className="rounded-[16px] border border-line bg-card px-3.5 py-2.5 text-[13px] font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningFunnelAction === "reactivation"
                ? "Pushing comeback wave..."
                : "Send comeback wave"}
            </button>
          </div>

          {funnelNotice ? (
            <div
              className={`mt-3.5 rounded-[16px] border px-3.5 py-2.5 text-sm ${
                funnelNoticeTone === "error"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {funnelNotice}
            </div>
          ) : null}
        </div>

        <div className="grid gap-3.5 xl:grid-cols-5">
          {(
            [
              ["newcomer", newcomer],
              ["active", active],
              ["reactivation", reactivation],
              ["high_trust", highTrust],
              ["watchlist", watchlist],
            ] as const
          ).map(([key, snapshot]) => (
            <div
              key={key}
              className="rounded-[18px] border border-line bg-card2 p-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text">{snapshot?.label ?? "Lane"}</p>
                <OpsStatusPill tone={toneFromSnapshot(snapshot)}>
                  {snapshot?.memberCount ?? 0}
                </OpsStatusPill>
              </div>
              <div className="mt-3 space-y-1.5 text-[13px] text-sub">
                <p>{snapshot?.readyCount ?? 0} ready seats</p>
                <p>{snapshot?.blockedCount ?? 0} blocked seats</p>
                <p>{snapshot?.activeCount ?? 0} active now</p>
                <p>Trust {snapshot?.averageTrust ?? 0}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[20px] border border-line bg-card2 p-4">
            <p className="text-sm font-bold text-text">Segment pressure</p>
            <p className="mt-2 text-sm text-sub">
              Keep these ratios readable: starter and comeback queues should shrink into the active
              rail, while high-trust seats outgrow the watchlist.
            </p>

            <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Starter to active</p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">
                  {summary.newcomers} / {summary.warmingUp + summary.core}
                </p>
                <p className="mt-2 text-sm text-sub">
                  Use this ratio to see whether onboarding pressure is graduating into the active rail.
                </p>
              </div>
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Trust balance</p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">
                  {summary.highTrust} / {summary.watchlist}
                </p>
                <p className="mt-2 text-sm text-sub">
                  High-trust anchors versus contributors who currently require more careful handling.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-card2 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Trust posture</p>
                <p className="mt-2 text-sm leading-5.5 text-sub">
                  This project should not blindly broaden pushes when trust or review pressure starts
                  leaning the wrong way.
                </p>
              </div>
              <OpsStatusPill tone={toneFromSnapshot(watchlist)}>
                {watchlist && watchlist.memberCount > 0 ? "Needs review" : "Stable"}
              </OpsStatusPill>
            </div>

            <div className="mt-3.5 space-y-2.5">
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Average trust</p>
                <p className="mt-2 text-lg font-black text-text">{trust.averageTrust}</p>
              </div>
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Open flags</p>
                <p className="mt-2 text-lg font-black text-text">{trust.openFlagCount}</p>
              </div>
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Signal readout</p>
                <p className="mt-2 text-sm leading-5.5 text-sub">
                  {trustSignal?.summary || trust.latestIssue}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
