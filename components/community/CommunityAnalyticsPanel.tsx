"use client";

import type {
  CommunityCohortSnapshot,
  CommunityHealthRollup,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
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
};

function findCohortSnapshot(
  snapshots: CommunityCohortSnapshot[],
  key: CommunityCohortSnapshot["key"]
) {
  return snapshots.find((snapshot) => snapshot.key === key) ?? null;
}

export function CommunityAnalyticsPanel({
  analytics,
  cohortSnapshots,
  healthRollups,
}: Props) {
  const active = findCohortSnapshot(cohortSnapshots, "active");
  const highTrust = findCohortSnapshot(cohortSnapshots, "high_trust");
  const watchlist = findCohortSnapshot(cohortSnapshots, "watchlist");

  return (
    <OpsPanel
      eyebrow="Analytics"
      title="Community health and retention analytics"
      description="This is the owner readout for whether the community engine is actually healthy enough to keep launching campaigns, nudges and reward pressure."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <OpsMetricCard
            label="Contributors"
            value={analytics.contributorCount}
            sub="Project-scoped contributors inside the current community surface."
            emphasis={analytics.contributorCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Activation ready"
            value={analytics.activationReadyCount}
            sub={`${analytics.fullStackReadyRate}% are fully armed across command, wallet and X.`}
            emphasis={analytics.activationReadyCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Recent active"
            value={`${analytics.recentActiveRate}%`}
            sub={`${analytics.recentXp} project XP recorded in the recent activity window.`}
          />
          <OpsMetricCard
            label="High trust"
            value={analytics.highTrustCount}
            sub={`${analytics.highTrustRate}% of the visible base qualifies as high-trust.`}
            emphasis={analytics.highTrustCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Watch pressure"
            value={analytics.watchlistCount}
            sub={`${analytics.openFlagCount} open quality flags are shaping the current trust posture.`}
            emphasis={analytics.watchlistCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Captain seats"
            value={analytics.captainCount}
            sub={`${analytics.activeCampaignCount} active campaigns currently depend on this community rail.`}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <div className="rounded-[20px] border border-line bg-card2 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Health rollups</p>
                <p className="mt-2 text-sm leading-5.5 text-sub">
                  These owner-facing signals compress participation, conversion, retention, trust
                  posture and reward quality into a faster read than scrolling through raw members.
                </p>
              </div>
              <OpsStatusPill
                tone={healthRollups.some((rollup) => rollup.tone === "danger") ? "warning" : "success"}
              >
                {healthRollups.some((rollup) => rollup.tone === "danger") ? "Needs review" : "Healthy"}
              </OpsStatusPill>
            </div>

            <div className="mt-3.5 grid gap-2.5">
              {healthRollups.length > 0 ? (
                healthRollups.map((rollup) => (
                  <div
                    key={rollup.key}
                    className="rounded-[16px] border border-line bg-card px-3.5 py-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-text">{rollup.label}</p>
                        <p className="mt-2 text-sm leading-5.5 text-sub">{rollup.summary}</p>
                      </div>
                      <OpsStatusPill
                        tone={
                          rollup.tone === "danger"
                            ? "danger"
                            : rollup.tone === "warning"
                              ? "warning"
                              : rollup.tone === "success"
                                ? "success"
                                : "default"
                        }
                      >
                        {rollup.value || "Live"}
                      </OpsStatusPill>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[16px] border border-dashed border-line bg-card px-3.5 py-4 text-sm text-sub">
                  Health rollups will appear here as soon as the Phase 3 snapshot refresh runs.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-card2 p-4">
            <p className="text-sm font-bold text-text">Segment balance</p>
            <p className="mt-2 text-sm text-sub">
              The community machine gets healthier when active and high-trust lanes outgrow
              watchlist and comeback pressure.
            </p>

            <div className="mt-3.5 space-y-2.5">
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Active contributor rail
                </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{active?.memberCount ?? 0}</p>
                <p className="mt-2 text-sm text-sub">
                  {active?.readyCount ?? 0} of those contributors are already ready for immediate
                  mission pressure.
                </p>
              </div>
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  High-trust anchor
                </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">{highTrust?.memberCount ?? 0}</p>
                <p className="mt-2 text-sm text-sub">
                  Trusted seats that can hold launch, leaderboard and reward quality together.
                </p>
              </div>
              <div className="rounded-[16px] border border-line bg-card px-3.5 py-3.5">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Risk and retention drag
                </p>
                  <p className="mt-2 text-[1.02rem] font-black text-text">
                  {watchlist?.memberCount ?? 0} / {analytics.retentionPressureCount}
                </p>
                <p className="mt-2 text-sm text-sub">
                  Watchlist seats versus comeback pressure in the current operating window.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
