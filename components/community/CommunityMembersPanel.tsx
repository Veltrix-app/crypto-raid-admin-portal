"use client";

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
  topContributors: Contributor[];
  readinessWatch: Contributor[];
};

function formatProviders(providers: string[]) {
  if (providers.length === 0) return "No linked providers";
  return providers.join(", ");
}

export function CommunityMembersPanel({
  loading,
  summary,
  topContributors,
  readinessWatch,
}: Props) {
  return (
    <OpsPanel
      eyebrow="Members"
      title="Contributor readiness and member quality"
      description="Track which contributors are actually ready for community commands, raids and deeper mission rails in this project."
    >
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <OpsMetricCard label="Contributors" value={summary.totalContributors} sub="Project-scoped active contributors in the current reputation rail." emphasis={summary.totalContributors > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Discord linked" value={summary.discordLinked} sub="Can be reached by the Discord command and rank rail." />
          <OpsMetricCard label="Telegram linked" value={summary.telegramLinked} sub="Ready for Telegram command and alert flows." />
          <OpsMetricCard label="X linked" value={summary.xLinked} sub="Signal-graph contributors with social verification present." />
          <OpsMetricCard label="Wallet verified" value={summary.walletVerified} sub="Contributors with a verified wallet identity in Veltrix." />
          <OpsMetricCard label="Full-stack ready" value={summary.fullStackReady} sub="Wallet + command-ready + X linked." emphasis={summary.fullStackReady > 0 ? "primary" : "default"} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Top contributors</p>
                <p className="mt-2 text-sm text-sub">
                  The highest-signal contributors currently visible to this project's community rail.
                </p>
              </div>
              <OpsStatusPill tone={summary.commandReady > 0 ? "success" : "default"}>
                {summary.commandReady} command ready
              </OpsStatusPill>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-[22px] border border-line bg-card px-4 py-5 text-sm text-sub">
                  Loading contributor readiness...
                </div>
              ) : topContributors.length > 0 ? (
                topContributors.map((contributor) => (
                  <div
                    key={contributor.authUserId}
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
                        ) : null}
                        {contributor.commandReady ? (
                          <OpsStatusPill tone="success">Command ready</OpsStatusPill>
                        ) : (
                          <OpsStatusPill tone="warning">Needs command link</OpsStatusPill>
                        )}
                        <OpsStatusPill tone={contributor.fullStackReady ? "success" : "default"}>
                          {contributor.fullStackReady ? "Full-stack ready" : "Still warming up"}
                        </OpsStatusPill>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                      {formatProviders(contributor.linkedProviders)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                  No contributor reputation is available for this project yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-card2 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">Readiness watch</p>
                <p className="mt-2 text-sm text-sub">
                  High-signal contributors who are still missing part of the community stack.
                </p>
              </div>
              <OpsStatusPill tone={readinessWatch.length > 0 ? "warning" : "success"}>
                {readinessWatch.length > 0 ? "Needs attention" : "Clean"}
              </OpsStatusPill>
            </div>

            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="rounded-[22px] border border-line bg-card px-4 py-5 text-sm text-sub">
                  Loading readiness watch...
                </div>
              ) : readinessWatch.length > 0 ? (
                readinessWatch.map((contributor) => (
                  <div
                    key={`${contributor.authUserId}-watch`}
                    className="rounded-[22px] border border-line bg-card px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-text">{contributor.username}</p>
                        <p className="mt-2 text-sm text-sub">
                          {contributor.raidsCompleted} raids • {contributor.questsCompleted} quests •{" "}
                          {contributor.xp} XP
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!contributor.walletVerified ? (
                          <OpsStatusPill tone="warning">Missing wallet</OpsStatusPill>
                        ) : null}
                        {!contributor.commandReady ? (
                          <OpsStatusPill tone="warning">Missing Discord/Telegram</OpsStatusPill>
                        ) : null}
                        {!contributor.linkedProviders.includes("x") ? (
                          <OpsStatusPill tone="warning">Missing X</OpsStatusPill>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                  The contributors visible to this project are already in a healthy readiness posture.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
