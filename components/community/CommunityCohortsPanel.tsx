"use client";

import type { Dispatch, SetStateAction } from "react";
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
    watchlist: number;
    reactivation: number;
    commandReady: number;
    fullStackReady: number;
    openFlags: number;
  };
  newcomers: CohortContributor[];
  reactivation: CohortContributor[];
  watchlist: CohortContributor[];
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

function CohortList({
  title,
  description,
  tone,
  contributors,
}: {
  title: string;
  description: string;
  tone: "success" | "warning" | "default";
  contributors: CohortContributor[];
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-text">{title}</p>
          <p className="mt-2 text-sm text-sub">{description}</p>
        </div>
        <OpsStatusPill tone={tone}>{contributors.length}</OpsStatusPill>
      </div>

      <div className="mt-4 space-y-3">
        {contributors.length > 0 ? (
          contributors.map((contributor) => (
            <div
              key={`${title}-${contributor.authUserId}`}
              className="rounded-[22px] border border-line bg-card px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-text">{contributor.username}</p>
                  <p className="mt-2 text-sm text-sub">
                    {contributor.xp} XP • L{contributor.level} • Trust {contributor.trust}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contributor.walletVerified ? (
                    <OpsStatusPill tone="success">Wallet</OpsStatusPill>
                  ) : (
                    <OpsStatusPill tone="warning">No wallet</OpsStatusPill>
                  )}
                  {contributor.daysSinceActive !== null ? (
                    <OpsStatusPill tone="default">
                      {contributor.daysSinceActive}d idle
                    </OpsStatusPill>
                  ) : (
                    <OpsStatusPill tone="warning">No recent XP events</OpsStatusPill>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                {contributor.readinessGaps.length > 0
                  ? contributor.readinessGaps.join(" • ")
                  : "Ready for the next lane"}
              </p>
              {contributor.recentFlagReasons.length > 0 ? (
                <p className="mt-2 text-xs text-amber-200">
                  {contributor.recentFlagReasons.join(" • ")}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
            No contributors currently land in this cohort.
          </div>
        )}
      </div>
    </div>
  );
}

export function CommunityCohortsPanel({
  settings,
  setSettings,
  summary,
  newcomers,
  reactivation,
  watchlist,
  trust,
  savingSettings,
  runningFunnelAction,
  funnelNotice,
  funnelNoticeTone,
  onSaveSettings,
  onRunFunnelAction,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Cohorts"
      title="Newcomer and reactivation funnels"
      description="Segment this project's contributors into real growth lanes instead of blasting the same message at everyone."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <OpsMetricCard
            label="Newcomers"
            value={summary.newcomers}
            sub="Fresh contributors who still need a clean first lane."
            emphasis={summary.newcomers > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Reactivation"
            value={summary.reactivation}
            sub="Previously active contributors who have gone quiet."
            emphasis={summary.reactivation > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Watchlist"
            value={summary.watchlist}
            sub="Contributors carrying trust or quality issues."
            emphasis={summary.watchlist > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Average trust"
            value={trust.averageTrust}
            sub="Project-wide contributor quality baseline."
          />
        </div>

        <div className="rounded-[24px] border border-line bg-card2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">Funnel controls</p>
              <p className="mt-2 text-sm text-sub">
                Turn on the cohort rails you want to actively operate, then push them through the
                current provider targets.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={settings.newcomerFunnelEnabled ? "success" : "default"}>
                {settings.newcomerFunnelEnabled ? "Starter rail on" : "Starter rail parked"}
              </OpsStatusPill>
              <OpsStatusPill
                tone={settings.reactivationFunnelEnabled ? "success" : "default"}
              >
                {settings.reactivationFunnelEnabled ? "Reactivation on" : "Reactivation parked"}
              </OpsStatusPill>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text">
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

            <label className="flex items-center gap-3 rounded-[20px] border border-line bg-card px-4 py-3 text-sm text-text">
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

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSaveSettings}
              disabled={savingSettings}
              className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSettings ? "Saving funnel settings..." : "Save funnel settings"}
            </button>
            <button
              type="button"
              onClick={() => onRunFunnelAction("newcomer")}
              disabled={runningFunnelAction !== null}
              className="rounded-[18px] bg-primary px-4 py-3 text-sm font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningFunnelAction === "newcomer" ? "Pushing newcomer wave..." : "Send newcomer wave"}
            </button>
            <button
              type="button"
              onClick={() => onRunFunnelAction("reactivation")}
              disabled={runningFunnelAction !== null}
              className="rounded-[18px] border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {runningFunnelAction === "reactivation"
                ? "Pushing comeback wave..."
                : "Send comeback wave"}
            </button>
          </div>

          {funnelNotice ? (
            <div
              className={`mt-4 rounded-[20px] border px-4 py-3 text-sm ${
                funnelNoticeTone === "error"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                  : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              }`}
            >
              {funnelNotice}
            </div>
          ) : null}

          <p className="mt-4 rounded-[18px] border border-white/8 bg-card px-4 py-3 text-sm leading-6 text-sub">
            {trust.latestIssue}
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <CohortList
            title="Newcomer queue"
            description="Fresh contributors who need a clean starter pack and link completion."
            tone={newcomers.length > 0 ? "success" : "default"}
            contributors={newcomers}
          />
          <CohortList
            title="Reactivation queue"
            description="Dormant contributors who are worth pulling back into the rail."
            tone={reactivation.length > 0 ? "warning" : "default"}
            contributors={reactivation}
          />
          <CohortList
            title="Watchlist"
            description="High-risk or low-trust contributors who should not be pushed blindly."
            tone={watchlist.length > 0 ? "warning" : "default"}
            contributors={watchlist}
          />
        </div>
      </div>
    </OpsPanel>
  );
}
