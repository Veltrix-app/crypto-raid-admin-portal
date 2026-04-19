"use client";

import Link from "next/link";
import { DetailMetricCard, DetailSurface } from "@/components/layout/detail/DetailPrimitives";

export function CommunityOverview({
  projectName,
  discordStatus,
  telegramStatus,
  xStatus,
  commandsEnabled,
  rankSyncEnabled,
  leaderboardEnabled,
  lastRankSyncAt,
  lastLeaderboardPostedAt,
}: {
  projectName: string;
  discordStatus: string;
  telegramStatus: string;
  xStatus: string;
  commandsEnabled: boolean;
  rankSyncEnabled: boolean;
  leaderboardEnabled: boolean;
  lastRankSyncAt: string;
  lastLeaderboardPostedAt: string;
}) {
  return (
    <DetailSurface
      eyebrow="Community Overview"
      title={`${projectName} Control Room`}
      description="Project-private community operations for Discord and Telegram. This is where your team manages the live community rails that power ranks, leaderboards, pushes and commands."
      aside={
        <Link
          href="/moderation"
          className="rounded-2xl border border-line bg-card px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary"
        >
          Open Global Moderation
        </Link>
      }
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetricCard
          label="Discord"
          value={discordStatus}
          hint="Community command rail, ranks and push delivery."
        />
        <DetailMetricCard
          label="Telegram"
          value={telegramStatus}
          hint="Chat push delivery and Telegram-facing community rail."
        />
        <DetailMetricCard
          label="Commands"
          value={commandsEnabled ? "Enabled" : "Disabled"}
          hint="Whether slash commands are live for this project community."
        />
        <DetailMetricCard
          label="Ranks"
          value={rankSyncEnabled ? "Live" : "Off"}
          hint={leaderboardEnabled ? "Leaderboard rail is enabled too." : "Leaderboards are currently off."}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetricCard
          label="X Identity"
          value={xStatus}
          hint="Used by follow missions and profile readiness."
        />
        <DetailMetricCard
          label="Last Rank Sync"
          value={lastRankSyncAt ? new Date(lastRankSyncAt).toLocaleString() : "Never"}
        />
        <DetailMetricCard
          label="Last Leaderboard"
          value={lastLeaderboardPostedAt ? new Date(lastLeaderboardPostedAt).toLocaleString() : "Never"}
        />
        <DetailMetricCard
          label="Leaderboard Rail"
          value={leaderboardEnabled ? "Enabled" : "Disabled"}
          hint="Project-scoped leaderboard posts and command output."
        />
      </div>
    </DetailSurface>
  );
}
