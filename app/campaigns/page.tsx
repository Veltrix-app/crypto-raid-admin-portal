"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function CampaignsPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);
  const router = useRouter();
  const pathname = usePathname() ?? "/campaigns";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [campaignsView, setCampaignsView] = useState<"portfolio" | "launch">("portfolio");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") ?? "");
    setStatus(params.get("status") ?? "all");
    setProjectFilter(params.get("project") ?? "all");
    setTypeFilter(params.get("type") ?? "all");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (projectFilter !== "all") params.set("project", projectFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });
  }, [pathname, projectFilter, router, search, status, typeFilter]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const project = projects.find((item) => item.id === campaign.projectId);
      const term = search.toLowerCase();
      const matchesSearch =
        campaign.title.toLowerCase().includes(term) ||
        campaign.slug.toLowerCase().includes(term) ||
        campaign.shortDescription.toLowerCase().includes(term) ||
        (project?.name || "").toLowerCase().includes(term);

      const matchesStatus = status === "all" || campaign.status === status;
      const matchesProject = projectFilter === "all" || campaign.projectId === projectFilter;
      const matchesType = typeFilter === "all" || campaign.campaignType === typeFilter;

      return matchesSearch && matchesStatus && matchesProject && matchesType;
    });
  }, [campaigns, projectFilter, projects, search, status, typeFilter]);

  const activeCount = campaigns.filter((campaign) => campaign.status === "active").length;
  const draftCount = campaigns.filter((campaign) => campaign.status === "draft").length;
  const scheduledCount = campaigns.filter((campaign) => campaign.status === "scheduled").length;
  const pausedCount = campaigns.filter((campaign) => campaign.status === "paused").length;
  const featuredCount = campaigns.filter((campaign) => campaign.featured).length;
  const totalParticipants = campaigns.reduce((sum, campaign) => sum + campaign.participants, 0);
  const avgBudget = campaigns.length
    ? Math.round(campaigns.reduce((sum, campaign) => sum + campaign.xpBudget, 0) / campaigns.length)
    : 0;
  const projectCoverage = new Set(campaigns.map((campaign) => campaign.projectId)).size;
  const launchPressureCount = scheduledCount + draftCount + pausedCount;

  const launchCampaigns = useMemo(
    () =>
      filteredCampaigns
        .filter((campaign) => ["active", "scheduled", "draft"].includes(campaign.status))
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            Number(b.status === "active") - Number(a.status === "active") ||
            b.participants - a.participants
        ),
    [filteredCampaigns]
  );

  const portfolioLeadCampaigns = useMemo(
    () =>
      [...filteredCampaigns]
        .sort(
          (a, b) =>
            Number(b.featured) - Number(a.featured) ||
            b.xpBudget - a.xpBudget ||
            b.participants - a.participants
        )
        .slice(0, 6),
    [filteredCampaigns]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Campaign board"
        title="Campaigns"
        description="Run the campaign system like a premium launch rail: one calm portfolio lane for the full inventory and one launch lane for the campaigns that move the project now."
        actions={
          <Link
            href="/campaigns/new"
            className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-black text-black shadow-[0_18px_40px_rgba(186,255,59,0.22)]"
          >
            New Campaign
          </Link>
        }
        statusBand={
          <div className="space-y-5">
            <div className="grid gap-4 xl:items-start xl:grid-cols-[1.12fr_0.88fr]">
              <OpsPanel
                eyebrow="View posture"
                title={
                  campaignsView === "portfolio"
                    ? "Read the full campaign portfolio"
                    : "Read launch pressure first"
                }
                description={
                  campaignsView === "portfolio"
                    ? "Use portfolio mode when the job is to understand coverage, campaign quality and how volume is distributed across projects."
                    : "Use launch mode when the team needs a single answer to what deserves attention, what is ready to push and what is starting to drag."
                }
                tone="accent"
                action={
                  <SegmentToggle
                    value={campaignsView}
                    onChange={setCampaignsView}
                    options={[
                      { value: "portfolio", label: "Portfolio" },
                      { value: "launch", label: "Launch" },
                    ]}
                  />
                }
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <OpsSnapshotRow
                    label="In view"
                    value={`${filteredCampaigns.length} campaigns match the current filters.`}
                  />
                  <OpsSnapshotRow
                    label="Projects covered"
                    value={`${projectCoverage} projects currently rely on campaign rails.`}
                  />
                  <OpsSnapshotRow
                    label="Next read"
                    value={
                      campaignsView === "portfolio"
                        ? "Start with the lead cards, then open the project carrying the most launch weight."
                        : "Open featured and active campaigns first, then decide what deserves a publish or recovery move."
                    }
                  />
                </div>
              </OpsPanel>

              <div className="space-y-2.5 rounded-[16px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Signal rail
                </p>
                <CampaignSignal label="Active" value={`${activeCount}`} />
                <CampaignSignal
                  label="Launch pressure"
                  value={`${launchPressureCount}`}
                  tone={launchPressureCount > 0 ? "warning" : "default"}
                />
                <CampaignSignal label="Featured" value={`${featuredCount}`} />
                <CampaignSignal label="Avg XP budget" value={`${avgBudget}`} />
              </div>
            </div>

            <OpsFilterBar>
              <OpsSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search campaigns..."
                ariaLabel="Search campaigns"
                name="campaign-search"
              />
              <OpsSelect
                value={status}
                onChange={setStatus}
                ariaLabel="Filter campaigns by status"
                name="campaign-status"
              >
                <option value="all">all statuses</option>
                <option value="draft">draft</option>
                <option value="scheduled">scheduled</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
                <option value="archived">archived</option>
              </OpsSelect>
              <OpsSelect
                value={projectFilter}
                onChange={setProjectFilter}
                ariaLabel="Filter campaigns by project"
                name="campaign-project"
              >
                <option value="all">all projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </OpsSelect>
            </OpsFilterBar>

            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_260px]">
              <OpsSelect
                value={typeFilter}
                onChange={setTypeFilter}
                ariaLabel="Filter campaigns by type"
                name="campaign-type"
              >
                <option value="all">all types</option>
                <option value="social_growth">social growth</option>
                <option value="community_growth">community growth</option>
                <option value="onchain">on-chain</option>
                <option value="referral">referral</option>
                <option value="content">content</option>
                <option value="hybrid">hybrid</option>
              </OpsSelect>
              <div className="rounded-[14px] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-[12px] leading-5 text-sub">
                {campaignsView === "portfolio"
                  ? "Portfolio mode keeps the system readable and helps you understand where campaign energy is concentrated."
                  : "Launch mode filters the noise down to campaigns that change the next operator decision."}
              </div>
              <div className="rounded-[14px] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-[12px] leading-5 text-sub">
                {filteredCampaigns.length} campaigns in view /{" "}
                {totalParticipants.toLocaleString()} participants across the full board
              </div>
            </div>
          </div>
        }
      >
        {campaignsView === "portfolio" ? (
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr] xl:items-start">
            <OpsPanel
              eyebrow="Portfolio posture"
              title="What the campaign system is carrying"
              description="Use this rail to understand momentum, backlog and where campaign energy is getting stuck before you open any detail workspace."
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Featured rail"
                  value={`${featuredCount} campaign${featuredCount === 1 ? "" : "s"} are deliberately highlighted right now.`}
                />
                <OpsSnapshotRow
                  label="Paused rail"
                  value={`${pausedCount} campaign${pausedCount === 1 ? "" : "s"} are waiting for recovery, timing or a new publish decision.`}
                />
                <OpsSnapshotRow
                  label="Audience load"
                  value={`${totalParticipants.toLocaleString()} participants are currently attached across the campaign inventory.`}
                />
                <OpsSnapshotRow
                  label="Project spread"
                  value={`${projectCoverage} projects currently depend on campaigns as active launch rails.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Lead campaigns"
              title="Open the campaigns shaping the board"
              description="This rail is intentionally card-led so you can scan status, project and budget without reading a dense table first."
            >
              <div className="grid gap-4 2xl:grid-cols-2">
                {portfolioLeadCampaigns.map((campaign) => {
                  const project = projects.find((item) => item.id === campaign.projectId);

                  return (
                    <CampaignSurfaceCard
                      key={campaign.id}
                      title={campaign.title}
                      description={campaign.shortDescription}
                      href={`/campaigns/${campaign.id}`}
                      badgeTone={campaignStatusTone(campaign.status)}
                      badges={[
                        campaign.status,
                        campaign.featured ? "featured" : null,
                        project?.name || null,
                      ]}
                      stats={[
                        { label: "Type", value: campaign.campaignType.replace(/_/g, " ") },
                        { label: "XP budget", value: campaign.xpBudget },
                        { label: "Participants", value: campaign.participants },
                      ]}
                    />
                  );
                })}

                {portfolioLeadCampaigns.length === 0 ? (
                  <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-4 py-4 text-[12px] text-sub 2xl:col-span-2">
                    No campaigns match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {campaignsView === "launch" ? (
          <div className="grid gap-4 xl:grid-cols-[0.76fr_1.24fr] xl:items-start">
            <OpsPanel
              eyebrow="Launch pressure"
              title="What deserves launch attention first"
              description="This lane is for deciding what goes live, what needs a recovery move and what can wait."
              tone="accent"
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Live now"
                  value={`${activeCount} active campaign${activeCount === 1 ? "" : "s"} are already taking contributor traffic.`}
                />
                <OpsSnapshotRow
                  label="Queued next"
                  value={`${scheduledCount} scheduled campaign${scheduledCount === 1 ? "" : "s"} are close enough to shape the next launch window.`}
                />
                <OpsSnapshotRow
                  label="Backlog"
                  value={`${draftCount} draft campaign${draftCount === 1 ? "" : "s"} still need a clear publish or archive decision.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Launch rail"
              title="Open the campaigns that move the system"
              description="Featured, active and scheduled campaigns surface first so the team can keep one clean reading path."
            >
              <div className="grid gap-4 2xl:grid-cols-2">
                {launchCampaigns.map((campaign) => {
                  const project = projects.find((item) => item.id === campaign.projectId);

                  return (
                    <CampaignSurfaceCard
                      key={campaign.id}
                      title={campaign.title}
                      description={campaign.shortDescription}
                      href={`/campaigns/${campaign.id}`}
                      badgeTone={campaignStatusTone(campaign.status)}
                      badges={[
                        campaign.status,
                        campaign.featured ? "featured" : null,
                        project?.name || null,
                      ]}
                      stats={[
                        { label: "Type", value: campaign.campaignType.replace(/_/g, " ") },
                        { label: "XP budget", value: campaign.xpBudget },
                        { label: "Participants", value: campaign.participants },
                      ]}
                      accent={campaign.featured || campaign.status === "active"}
                    />
                  );
                })}

                {launchCampaigns.length === 0 ? (
                  <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-4 py-4 text-[12px] text-sub 2xl:col-span-2">
                    No launch campaigns match the current filters.
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

function campaignStatusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "draft" || status === "scheduled") return "warning";
  return "default";
}

function CampaignSignal({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-[18px] border px-3.5 py-3 ${
        tone === "warning"
          ? "border-amber-400/16 bg-amber-500/[0.07]"
          : "border-white/[0.04] bg-white/[0.02]"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-text">{value}</p>
    </div>
  );
}

function CampaignSurfaceCard({
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
      className={`relative overflow-hidden rounded-[18px] border p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)] ${
        accent
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.1),transparent_22%),linear-gradient(180deg,rgba(18,24,35,0.96),rgba(10,14,22,0.94))]"
          : "border-white/[0.04] bg-[linear-gradient(180deg,rgba(14,18,26,0.96),rgba(9,12,18,0.94))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_32%)]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.92rem] font-semibold tracking-[-0.02em] text-text">{title}</p>
            {badges.filter(Boolean).map((badge, index) => (
              <OpsStatusPill
                key={`${title}-${badge}`}
                tone={index === 0 ? badgeTone : "default"}
              >
                {badge}
              </OpsStatusPill>
            ))}
          </div>
          <p className="mt-2 line-clamp-2 max-w-3xl text-[13px] leading-6 text-sub">{description}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[12px] border border-white/[0.04] bg-white/[0.02] px-3 py-2"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
                  {stat.label}
                </p>
                <p className="mt-1 text-[12px] font-semibold text-text">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={href}
          className="rounded-full border border-white/[0.05] bg-white/[0.025] px-3.5 py-2 text-[12px] font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          View
        </Link>
      </div>
    </div>
  );
}
