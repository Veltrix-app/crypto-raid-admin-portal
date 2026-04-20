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
      const campaign = campaigns.find((c) => c.id === raid.campaignId);
      const project = projects.find((p) => p.id === raid.projectId);
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
        description="Split the raid surface between overall inventory and the live pressure board so the team can coordinate faster."
        actions={
          <Link
            href="/raids/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Raid
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <OpsMetricCard label="Total raids" value={raids.length} />
              <OpsMetricCard
                label="Active"
                value={activeCount}
                emphasis={activeCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Scheduled"
                value={scheduledCount}
                emphasis={scheduledCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Ended"
                value={endedCount}
                emphasis={endedCount > 0 ? "default" : "warning"}
              />
              <OpsMetricCard label="Participants" value={totalParticipants} />
              <OpsMetricCard label="Avg reward XP" value={avgRewardXp} />
            </div>

            <OpsPanel
              title="Raid work modes"
              description="Use board mode for raid inventory and live mode when the team is coordinating active or imminent raid pressure."
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Board
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Scan the full raid roster across campaigns, communities and platforms.
                  </p>
                </div>
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Live
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Focus on active and upcoming raids that need live coordination.
                  </p>
                </div>
              </div>
            </OpsPanel>

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
          <OpsPanel
            eyebrow="Raid roster"
            title="Raid stream"
            description="The current raid list with project context, platform, reward pressure and a fast route into detail."
          >
            <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
              <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
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
                const campaign = campaigns.find((c) => c.id === raid.campaignId);
                const project = projects.find((p) => p.id === raid.projectId);

                return (
                  <div
                    key={raid.id}
                    className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{raid.title}</p>
                      <p className="mt-1 text-xs text-sub">{raid.community}</p>
                    </div>
                    <div>{project?.name || "-"}</div>
                    <div>{campaign?.title || "-"}</div>
                    <div className="capitalize">{raid.platform}</div>
                    <div>
                      <OpsStatusPill
                        tone={
                          raid.status === "active"
                            ? "success"
                            : raid.status === "scheduled"
                              ? "warning"
                              : raid.status === "draft"
                                ? "warning"
                                : "default"
                        }
                      >
                        {raid.status}
                      </OpsStatusPill>
                    </div>
                    <div>{raid.rewardXp}</div>
                    <div>{raid.participants}</div>
                    <div>
                      <Link
                        href={`/raids/${raid.id}`}
                        className="rounded-xl border border-line bg-card px-3 py-2 font-semibold"
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
        ) : null}

        {raidsView === "live" ? (
          <OpsPanel
            eyebrow="Live pressure"
            title="Active and upcoming raids"
            description="This lane keeps the raids that actually need live coordination separate from archive noise."
            tone="accent"
          >
            <div className="grid gap-4">
              {liveRaids.map((raid) => {
                const campaign = campaigns.find((c) => c.id === raid.campaignId);
                const project = projects.find((p) => p.id === raid.projectId);
                return (
                  <div key={raid.id} className="rounded-[24px] border border-line bg-card2 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-extrabold text-text">{raid.title}</p>
                          <OpsStatusPill
                            tone={raid.status === "active" ? "success" : "warning"}
                          >
                            {raid.status}
                          </OpsStatusPill>
                          <OpsStatusPill tone="default">{raid.platform}</OpsStatusPill>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-sub">{raid.target}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <RaidStat label="Project" value={project?.name || "-"} />
                          <RaidStat label="Campaign" value={campaign?.title || "-"} />
                          <RaidStat label="Reward XP" value={raid.rewardXp} />
                          <RaidStat label="Participants" value={raid.participants} />
                        </div>
                      </div>
                      <Link
                        href={`/raids/${raid.id}`}
                        className="rounded-2xl border border-line bg-card px-4 py-3 font-bold text-sub"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}

              {liveRaids.length === 0 ? (
                <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                  No live raids match the current filters.
                </div>
              ) : null}
            </div>
          </OpsPanel>
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function RaidStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
