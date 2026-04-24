"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RaidsPage() {
  const raids = useAdminPortalStore((s) => s.raids);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [raidsView, setRaidsView] = useState<"board" | "live">("board");

  const filteredRaids = useMemo(() => {
    return raids.filter((raid) => {
      const campaign = campaigns.find((item) => item.id === raid.campaignId);
      const project = projects.find((item) => item.id === raid.projectId);
      const term = search.toLowerCase();

      const matchesSearch =
        raid.title.toLowerCase().includes(term) ||
        raid.community.toLowerCase().includes(term) ||
        raid.target.toLowerCase().includes(term) ||
        (campaign?.title || "").toLowerCase().includes(term) ||
        (project?.name || "").toLowerCase().includes(term);

      const matchesStatus = status === "all" || raid.status === status;
      const matchesPlatform = platform === "all" || raid.platform === platform;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [campaigns, platform, projects, raids, search, status]);

  const activeCount = raids.filter((raid) => raid.status === "active").length;
  const scheduledCount = raids.filter((raid) => raid.status === "scheduled").length;
  const endedCount = raids.filter((raid) => raid.status === "ended").length;
  const avgRewardXp = raids.length
    ? Math.round(raids.reduce((sum, raid) => sum + raid.rewardXp, 0) / raids.length)
    : 0;
  const totalParticipants = raids.reduce((sum, raid) => sum + raid.participants, 0);
  const platformCoverage = new Set(raids.map((raid) => raid.platform)).size;
  const livePressureCount = activeCount + scheduledCount;

  const boardLeadRaids = useMemo(
    () =>
      [...filteredRaids]
        .sort((a, b) => b.rewardXp - a.rewardXp || b.participants - a.participants)
        .slice(0, 6),
    [filteredRaids]
  );

  const liveRaids = useMemo(
    () =>
      [...filteredRaids]
        .filter((raid) => ["active", "scheduled"].includes(raid.status))
        .sort((a, b) => b.participants - a.participants || b.rewardXp - a.rewardXp),
    [filteredRaids]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Raid management"
        title="Raids"
        description="Run raid pressure like a premium coordination layer: one calm board for the full roster and one live rail for the pushes that need operator attention now."
        actions={
          <Link
            href="/raids/new"
            className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black shadow-[0_18px_40px_rgba(186,255,59,0.22)]"
          >
            New Raid
          </Link>
        }
        statusBand={
          <div className="space-y-5">
            <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
              <OpsPanel
                eyebrow="View posture"
                title={raidsView === "board" ? "Read the raid inventory" : "Read live pressure"}
                description={
                  raidsView === "board"
                    ? "Stay in board mode when the goal is to understand the full raid roster across campaigns, communities and target platforms."
                    : "Switch to live mode when the team is actively steering visible pressure and needs the shortest possible path to the raids that matter."
                }
                tone="accent"
                action={
                  <SegmentToggle
                    value={raidsView}
                    onChange={setRaidsView}
                    options={[
                      { value: "board", label: "Board" },
                      { value: "live", label: "Live" },
                    ]}
                  />
                }
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <OpsSnapshotRow
                    label="In view"
                    value={`${filteredRaids.length} raids match the current filters.`}
                  />
                  <OpsSnapshotRow
                    label="Platforms"
                    value={`${platformCoverage} platform${platformCoverage === 1 ? "" : "s"} currently carry raid traffic.`}
                  />
                  <OpsSnapshotRow
                    label="Next read"
                    value={
                      raidsView === "board"
                        ? "Start with community, target and reward pressure before you open detail."
                        : "Open the raids with the biggest participant weight or the sharpest target surface first."
                    }
                  />
                </div>
              </OpsPanel>

              <div className="grid gap-4 sm:grid-cols-2">
                <OpsMetricCard label="Active" value={activeCount} emphasis="primary" />
                <OpsMetricCard
                  label="Live pressure"
                  value={livePressureCount}
                  emphasis={livePressureCount > 0 ? "warning" : "default"}
                  sub="Active and scheduled raids still shape visible coordination load."
                />
                <OpsMetricCard label="Participants" value={totalParticipants} />
                <OpsMetricCard label="Avg reward XP" value={avgRewardXp} />
              </div>
            </div>

            <OpsFilterBar>
              <OpsSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search raids..."
                ariaLabel="Search raids"
                name="raid-search"
              />
              <OpsSelect
                value={status}
                onChange={setStatus}
                ariaLabel="Filter raids by status"
                name="raid-status"
              >
                <option value="all">all statuses</option>
                <option value="draft">draft</option>
                <option value="scheduled">scheduled</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="ended">ended</option>
              </OpsSelect>
              <OpsSelect
                value={platform}
                onChange={setPlatform}
                ariaLabel="Filter raids by platform"
                name="raid-platform"
              >
                <option value="all">all platforms</option>
                <option value="x">x</option>
                <option value="telegram">telegram</option>
                <option value="discord">discord</option>
                <option value="website">website</option>
                <option value="reddit">reddit</option>
                <option value="custom">custom</option>
              </OpsSelect>
            </OpsFilterBar>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-sub">
                {raidsView === "board"
                  ? "Board mode keeps the roster readable and highlights which raids carry the heaviest visible pressure."
                  : "Live mode strips the system back to raids that actually need coordination, escalation or timing decisions."}
              </div>
              <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-sub">
                {endedCount} ended raids now belong to historical context, not the active decision path
              </div>
            </div>
          </div>
        }
      >
        {raidsView === "board" ? (
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <OpsPanel
              eyebrow="Raid posture"
              title="What the raid system is carrying"
              description="Use this rail to understand where attention is concentrated, what is queued next and how much of the board is historical context."
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Live now"
                  value={`${activeCount} raid${activeCount === 1 ? "" : "s"} are actively pulling community traffic.`}
                />
                <OpsSnapshotRow
                  label="Queued next"
                  value={`${scheduledCount} scheduled raid${scheduledCount === 1 ? "" : "s"} still need timing and target confidence.`}
                />
                <OpsSnapshotRow
                  label="Historical"
                  value={`${endedCount} ended raid${endedCount === 1 ? "" : "s"} can be treated as context instead of live work.`}
                />
                <OpsSnapshotRow
                  label="Participant load"
                  value={`${totalParticipants.toLocaleString()} total participants are currently distributed across the raid board.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Lead raids"
              title="Open the raids shaping visible pressure"
              description="This rail replaces the dense roster with cards so you can read target, community and reward pressure in one glance."
            >
              <div className="grid gap-4">
                {boardLeadRaids.map((raid) => {
                  const campaign = campaigns.find((item) => item.id === raid.campaignId);
                  const project = projects.find((item) => item.id === raid.projectId);

                  return (
                    <RaidSurfaceCard
                      key={raid.id}
                      title={raid.title}
                      description={raid.target}
                      href={`/raids/${raid.id}`}
                      badgeTone={raidStatusTone(raid.status)}
                      badges={[raid.status, raid.platform, campaign?.title || null]}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Community", value: raid.community },
                        { label: "Reward XP", value: raid.rewardXp },
                      ]}
                    />
                  );
                })}

                {boardLeadRaids.length === 0 ? (
                  <div className="rounded-[24px] border border-white/6 bg-white/[0.025] px-5 py-6 text-sm text-sub">
                    No raids match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {raidsView === "live" ? (
          <div className="grid gap-6 xl:grid-cols-[0.76fr_1.24fr]">
            <OpsPanel
              eyebrow="Live pressure"
              title="What needs coordination first"
              description="This lane is about the raids that can change community momentum right now."
              tone="accent"
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Active"
                  value={`${activeCount} live raid${activeCount === 1 ? "" : "s"} are already pulling participant attention.`}
                />
                <OpsSnapshotRow
                  label="Scheduled"
                  value={`${scheduledCount} upcoming raid${scheduledCount === 1 ? "" : "s"} still need timing confidence.`}
                />
                <OpsSnapshotRow
                  label="What to open next"
                  value="Prioritize the raids with the highest participant weight or the most visible target surface."
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Live rail"
              title="Open the raids that shape visible pressure"
              description="These raids carry the shortest operator reading path because they change public momentum fastest."
            >
              <div className="grid gap-4">
                {liveRaids.map((raid) => {
                  const campaign = campaigns.find((item) => item.id === raid.campaignId);
                  const project = projects.find((item) => item.id === raid.projectId);

                  return (
                    <RaidSurfaceCard
                      key={raid.id}
                      title={raid.title}
                      description={raid.target}
                      href={`/raids/${raid.id}`}
                      badgeTone={raidStatusTone(raid.status)}
                      badges={[raid.status, raid.platform, campaign?.title || null]}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Reward XP", value: raid.rewardXp },
                        { label: "Participants", value: raid.participants },
                      ]}
                      accent={raid.status === "active"}
                    />
                  );
                })}

                {liveRaids.length === 0 ? (
                  <div className="rounded-[24px] border border-white/6 bg-white/[0.025] px-5 py-6 text-sm text-sub">
                    No live raids match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function raidStatusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "draft" || status === "scheduled") return "warning";
  return "default";
}

function RaidSurfaceCard({
  title,
  description,
  href,
  badges,
  stats,
  badgeTone,
  accent = false,
}: {
  title: string;
  description: string;
  href: string;
  badges: Array<string | null>;
  stats: Array<{ label: string; value: string | number }>;
  badgeTone: "default" | "success" | "warning";
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${
        accent
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.1),transparent_22%),linear-gradient(180deg,rgba(18,24,35,0.96),rgba(10,14,22,0.94))]"
          : "border-white/6 bg-[linear-gradient(180deg,rgba(18,24,35,0.94),rgba(11,15,23,0.92))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_32%)]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-extrabold tracking-[-0.03em] text-text">{title}</p>
            {badges.filter(Boolean).map((badge, index) => (
              <OpsStatusPill
                key={`${title}-${badge}`}
                tone={index === 0 ? badgeTone : "default"}
              >
                {badge}
              </OpsStatusPill>
            ))}
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-sub">{description}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[20px] border border-white/6 bg-white/[0.025] px-4 py-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-text">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={href}
          className="rounded-full border border-white/8 bg-white/[0.035] px-4 py-3 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
