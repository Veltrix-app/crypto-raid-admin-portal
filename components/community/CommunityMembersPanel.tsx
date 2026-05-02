"use client";

import type {
  CommunityCohortSnapshot,
  CommunityHealthRollup,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Contributor = {
  authUserId: string;
  username: string;
  xp: number;
  level: number;
  trust: number;
  questsCompleted: number;
  raidsCompleted: number;
  linkedProviders: string[];
  walletVerified: boolean;
  commandReady: boolean;
  fullStackReady: boolean;
};

type Props = {
  loading: boolean;
  summary: {
    totalContributors: number;
    discordLinked: number;
    telegramLinked: number;
    xLinked: number;
    walletVerified: number;
    commandReady: number;
    fullStackReady: number;
  };
  analytics: {
    contributorCount: number;
    commandReadyRate: number;
    walletVerifiedRate: number;
    fullStackReadyRate: number;
    recentActiveRate: number;
    newcomerReadyCount: number;
    reactivationReadyCount: number;
    highTrustCount: number;
    highTrustRate: number;
    commandGapCount: number;
    walletGapCount: number;
    xGapCount: number;
    retentionPressureCount: number;
    averageTrust: number;
    watchlistCount: number;
    openFlagCount: number;
    captainCount: number;
    activeCampaignCount: number;
    activationReadyCount: number;
    recentXp: number;
  };
  cohortSnapshots: CommunityCohortSnapshot[];
  healthRollups: CommunityHealthRollup[];
  topContributors: Contributor[];
  readinessWatch: Contributor[];
};

function findCohortSnapshot(
  snapshots: CommunityCohortSnapshot[],
  key: CommunityCohortSnapshot["key"]
) {
  return snapshots.find((snapshot) => snapshot.key === key) ?? null;
}

export function CommunityMembersPanel({
  loading,
  summary,
  analytics,
  cohortSnapshots,
  healthRollups,
}: Props) {
  const newcomer = findCohortSnapshot(cohortSnapshots, "newcomer");
  const active = findCohortSnapshot(cohortSnapshots, "active");
  const reactivation = findCohortSnapshot(cohortSnapshots, "reactivation");
  const highTrust = findCohortSnapshot(cohortSnapshots, "high_trust");
  const watchlist = findCohortSnapshot(cohortSnapshots, "watchlist");
  const primarySignals = healthRollups.slice(0, 3);

  return (
    <OpsPanel
      eyebrow="Members"
      title="Contributor readiness and segment pressure"
      description="Read the community machine as operating pressure, not as a loose member CRM. This surface shows who is reachable, who is trusted, and where the next readiness gap sits."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <OpsMetricCard
            label="Contributors"
            value={summary.totalContributors}
            sub="Project-scoped contributors currently visible to Community OS."
            emphasis={summary.totalContributors > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Command gap"
            value={analytics.commandGapCount}
            sub={`${analytics.commandReadyRate}% already reachable through Discord or Telegram.`}
            emphasis={analytics.commandGapCount > 0 ? "warning" : "primary"}
          />
          <OpsMetricCard
            label="Wallet gap"
            value={analytics.walletGapCount}
            sub={`${analytics.walletVerifiedRate}% are wallet verified.`}
            emphasis={analytics.walletGapCount > 0 ? "warning" : "primary"}
          />
          <OpsMetricCard
            label="X gap"
            value={analytics.xGapCount}
            sub={`${summary.xLinked} contributors already carry X verification.`}
            emphasis={analytics.xGapCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="High trust"
            value={analytics.highTrustCount}
            sub={`${analytics.highTrustRate}% of the visible base can anchor deeper activation pressure.`}
            emphasis={analytics.highTrustCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Retention pressure"
            value={analytics.retentionPressureCount}
            sub="Contributors currently sitting in the comeback lane."
            emphasis={analytics.retentionPressureCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Readiness posture</p>
                <p className="mt-2 text-sm leading-5.5 text-sub">
                  These lanes tell you whether the project can actually move contributors into
                  missions, raids and rewards without manual chasing.
                </p>
              </div>
              <OpsStatusPill tone={loading ? "default" : analytics.commandGapCount > 0 ? "warning" : "success"}>
                {loading ? "Refreshing" : analytics.commandGapCount > 0 ? "Needs alignment" : "Stable"}
              </OpsStatusPill>
            </div>

            <div className="mt-3.5 grid gap-2.5 md:grid-cols-2">
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.012] px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Starter lane
                </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{newcomer?.memberCount ?? 0}</p>
                <p className="mt-2 text-sm text-sub">
                  {analytics.newcomerReadyCount} newcomer seats are already command-ready.
                </p>
              </div>
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.012] px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Active rail
                </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{active?.readyCount ?? 0}</p>
                <p className="mt-2 text-sm text-sub">
                  Ready active contributors who can absorb immediate mission pressure.
                </p>
              </div>
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.012] px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Comeback lane
                </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{reactivation?.memberCount ?? 0}</p>
                <p className="mt-2 text-sm text-sub">
                  {analytics.reactivationReadyCount} comeback seats are already reachable.
                </p>
              </div>
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.012] px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  High-trust anchor
                </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{highTrust?.memberCount ?? 0}</p>
                <p className="mt-2 text-sm text-sub">
                  Trusted contributors who can carry launch, reward and raid pressure.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Quality overlay</p>
                <p className="mt-2 text-sm text-sub">
                  Community OS should surface the pressure around trust, flags and blocked growth
                  before it turns into a launch surprise.
                </p>
              </div>
              <OpsStatusPill tone={(watchlist?.memberCount ?? 0) > 0 ? "warning" : "success"}>
                {(watchlist?.memberCount ?? 0) > 0 ? "Watch pressure" : "Clean"}
              </OpsStatusPill>
            </div>

            <div className="mt-3.5 space-y-2.5">
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.012] px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Watchlist seats
                </p>
                <p className="mt-2 text-lg font-black text-text">{watchlist?.memberCount ?? 0}</p>
                <p className="mt-2 text-sm text-sub">
                  {analytics.openFlagCount} open review flags are currently shaping trust posture.
                </p>
              </div>
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.012] px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Activation-ready
                </p>
                <p className="mt-2 text-lg font-black text-text">{analytics.activationReadyCount}</p>
                <p className="mt-2 text-sm text-sub">
                  Contributors who are both reachable and wallet-ready right now.
                </p>
              </div>
              <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.012] px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Average trust
                </p>
                <p className="mt-2 text-lg font-black text-text">{analytics.averageTrust}</p>
                <p className="mt-2 text-sm text-sub">
                  Project-wide trust baseline across the currently visible contributor base.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {primarySignals.length > 0 ? (
            primarySignals.map((signal) => (
              <div key={signal.key} className="rounded-[16px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-text">{signal.label}</p>
                  <OpsStatusPill
                    tone={
                      signal.tone === "danger"
                        ? "danger"
                        : signal.tone === "warning"
                          ? "warning"
                          : signal.tone === "success"
                            ? "success"
                            : "default"
                    }
                  >
                    {signal.value || "Tracking"}
                  </OpsStatusPill>
                </div>
                <p className="mt-2.5 text-sm leading-5.5 text-sub">{signal.summary}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[16px] border border-dashed border-white/[0.026] bg-white/[0.01] px-3.5 py-4 text-sm text-sub md:col-span-3">
              Community health signals will appear here as soon as the Phase 3 rollups refresh.
            </div>
          )}
        </div>
      </div>
    </OpsPanel>
  );
}
