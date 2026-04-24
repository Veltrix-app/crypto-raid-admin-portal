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
        description="Keep raid pressure understandable: one quiet inventory lane for the full roster, and one live lane for the posts and pushes that need coordination now."
        actions={
          <Link
            href="/raids/new"
            className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black"
          >
            New Raid
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Current lane"
                title={raidsView === "board" ? "Read the raid inventory" : "Read live pressure"}
                description={
                  raidsView === "board"
                    ? "Stay in this lane when the goal is to understand the roster across campaigns, platforms and communities."
                    : "Switch here when the team is actively steering live or scheduled raids and needs a shorter decision path."
                }
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
                        ? "Scan community, campaign and reward pressure before opening detail."
                        : "Look at participation and target quality before deciding what needs real-time support."
                    }
                  />
                </div>
              </OpsPanel>

              <div className="grid gap-4 sm:grid-cols-2">
                <OpsMetricCard label="Active" value={activeCount} emphasis="primary" />
                <OpsMetricCard
                  label="Scheduled"
                  value={scheduledCount}
                  emphasis={scheduledCount > 0 ? "primary" : "default"}
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
          </div>
        }
      >
        {raidsView === "board" ? (
          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <OpsPanel
              eyebrow="Raid posture"
              title="What the raid system is carrying"
              description="Use this side to understand where attention is concentrated before you drop into a single raid."
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
                  label="Ended"
                  value={`${endedCount} raid${endedCount === 1 ? "" : "s"} can be treated as historical context instead of live work.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Raid roster"
              title="Read the raid stream"
              description="Start with title and community, then check campaign, platform and reward pressure before opening detail."
            >
              <div className="overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.025]">
                <div className="grid grid-cols-8 border-b border-white/6 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                  <div>Raid</div>
                  <div>Project</div>
                  <div>Campaign</div>
                  <div>Platform</div>
                  <div>Status</div>
                  <div>Reward XP</div>
                  <div>Participants</div>
                  <div>Open</div>
                </div>

                {filteredRaids.map((raid) => {
                  const campaign = campaigns.find((item) => item.id === raid.campaignId);
                  const project = projects.find((item) => item.id === raid.projectId);

                  return (
                    <div
                      key={raid.id}
                      className="grid grid-cols-8 items-center border-b border-white/6 px-5 py-4 text-sm text-text last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold">{raid.title}</p>
                        <p className="mt-1 text-xs text-sub">{raid.community}</p>
                      </div>
                      <div>{project?.name || "-"}</div>
                      <div>{campaign?.title || "-"}</div>
                      <div className="capitalize">{raid.platform}</div>
                      <div>
                        <OpsStatusPill tone={raidStatusTone(raid.status)}>{raid.status}</OpsStatusPill>
                      </div>
                      <div>{raid.rewardXp}</div>
                      <div>{raid.participants}</div>
                      <div>
                        <Link
                          href={`/raids/${raid.id}`}
                          className="rounded-full border border-white/6 bg-white/[0.025] px-3 py-2 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {filteredRaids.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-sub">No raids match your filters.</div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {raidsView === "live" ? (
          <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
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
                  value="Prioritize the raids with the biggest participant weight or the most visible target surface."
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Live board"
              title="Open the raids that shape visible pressure"
              description="These raids carry the most immediate coordination value, so they get the shortest reading path."
            >
              <div className="grid gap-3">
                {liveRaids.map((raid) => {
                  const campaign = campaigns.find((item) => item.id === raid.campaignId);
                  const project = projects.find((item) => item.id === raid.projectId);
                  return (
                    <RaidLiveCard
                      key={raid.id}
                      title={raid.title}
                      description={raid.target}
                      href={`/raids/${raid.id}`}
                      status={raid.status}
                      platform={raid.platform}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Campaign", value: campaign?.title || "-" },
                        { label: "Reward XP", value: raid.rewardXp },
                        { label: "Participants", value: raid.participants },
                      ]}
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

function RaidLiveCard({
  title,
  description,
  href,
  status,
  platform,
  stats,
}: {
  title: string;
  description: string;
  href: string;
  status: string;
  platform: string;
  stats: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-extrabold text-text">{title}</p>
            <OpsStatusPill tone={status === "active" ? "success" : "warning"}>{status}</OpsStatusPill>
            <OpsStatusPill tone="default">{platform}</OpsStatusPill>
          </div>
          <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[20px] border border-white/6 bg-white/[0.02] px-4 py-3"
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
          className="rounded-full border border-white/6 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
