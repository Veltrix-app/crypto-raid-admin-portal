"use client";

import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Props = {
  analytics: {
    contributorCount: number;
    commandReadyRate: number;
    walletVerifiedRate: number;
    fullStackReadyRate: number;
    recentActiveRate: number;
    averageTrust: number;
    watchlistCount: number;
    openFlagCount: number;
    captainCount: number;
    activeCampaignCount: number;
    activationReadyCount: number;
    recentXp: number;
  };
};

export function CommunityAnalyticsPanel({ analytics }: Props) {
  return (
    <OpsPanel
      eyebrow="Analytics"
      title="Community growth and quality analytics"
      description="Read the health of this project's contributor machine from one surface: readiness, trust, activity and activation capacity."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <OpsMetricCard
            label="Contributors"
            value={analytics.contributorCount}
            sub="Project-scoped contributors visible to the growth rail."
            emphasis={analytics.contributorCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Command ready"
            value={`${analytics.commandReadyRate}%`}
            sub="Contributors reachable through Discord or Telegram."
          />
          <OpsMetricCard
            label="Wallet ready"
            value={`${analytics.walletVerifiedRate}%`}
            sub="Contributors with a verified wallet."
          />
          <OpsMetricCard
            label="Full-stack ready"
            value={`${analytics.fullStackReadyRate}%`}
            sub="Command + wallet + X coverage."
          />
          <OpsMetricCard
            label="Recent active"
            value={`${analytics.recentActiveRate}%`}
            sub="Contributors active in the recent XP rail."
          />
          <OpsMetricCard
            label="Recent XP"
            value={analytics.recentXp}
            sub="Last 30 days of project XP pressure."
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <p className="text-sm font-bold text-text">Growth posture</p>
            <p className="mt-2 text-sm text-sub">
              These are the operational conversion rails that tell you whether this project can
              actually move contributors into missions, raids and community pressure.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[20px] border border-line bg-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">
                  Activation-ready contributors
                </p>
                <p className="mt-3 text-2xl font-black text-text">{analytics.activationReadyCount}</p>
                <p className="mt-2 text-sm text-sub">
                  Command-ready and wallet-ready contributors who can move immediately.
                </p>
              </div>
              <div className="rounded-[20px] border border-line bg-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Live campaigns</p>
                <p className="mt-3 text-2xl font-black text-text">{analytics.activeCampaignCount}</p>
                <p className="mt-2 text-sm text-sub">
                  Campaigns currently feeding the activation board rail.
                </p>
              </div>
              <div className="rounded-[20px] border border-line bg-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Captain seats</p>
                <p className="mt-3 text-2xl font-black text-text">{analytics.captainCount}</p>
                <p className="mt-2 text-sm text-sub">
                  Human operators attached to this project's community rail.
                </p>
              </div>
              <div className="rounded-[20px] border border-line bg-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Average trust</p>
                <p className="mt-3 text-2xl font-black text-text">{analytics.averageTrust}</p>
                <p className="mt-2 text-sm text-sub">
                  The quality baseline the community layer is currently operating on.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Quality overlay</p>
                <p className="mt-2 text-sm text-sub">
                  Healthy growth only works when trust and moderation pressure stay readable.
                </p>
              </div>
              <OpsStatusPill tone={analytics.watchlistCount > 0 ? "warning" : "success"}>
                {analytics.watchlistCount > 0 ? "Needs review" : "Healthy"}
              </OpsStatusPill>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-[20px] border border-line bg-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Watchlist contributors</p>
                <p className="mt-3 text-xl font-black text-text">{analytics.watchlistCount}</p>
              </div>
              <div className="rounded-[20px] border border-line bg-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Open review flags</p>
                <p className="mt-3 text-xl font-black text-text">{analytics.openFlagCount}</p>
              </div>
              <div className="rounded-[20px] border border-line bg-card px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sub">Readiness balance</p>
                <p className="mt-3 text-xl font-black text-text">
                  {analytics.commandReadyRate}% / {analytics.fullStackReadyRate}%
                </p>
                <p className="mt-2 text-sm text-sub">
                  Command-ready versus fully ready contributors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
