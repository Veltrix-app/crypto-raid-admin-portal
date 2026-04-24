"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
      const project = projects.find((p) => p.id === campaign.projectId);
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

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Campaign board"
        title="Campaigns"
        description="Keep the campaign system readable: one calmer portfolio lane for inventory, and one launch lane for the campaigns that need action now."
        actions={
          <Link
            href="/campaigns/new"
            className="inline-flex rounded-full bg-primary px-5 py-3 text-sm font-black text-black"
          >
            New Campaign
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Current lane"
                title={
                  campaignsView === "portfolio"
                    ? "Read the full campaign portfolio"
                    : "Focus on launch pressure"
                }
                description={
                  campaignsView === "portfolio"
                    ? "Use this lane when the goal is to understand project coverage, status mix and where campaign volume is sitting."
                    : "Use this lane when the team needs to decide what ships next, what is blocked and what deserves immediate attention."
                }
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
                    value={`${projectCoverage} projects currently have at least one campaign.`}
                  />
                  <OpsSnapshotRow
                    label="Next read"
                    value={
                      campaignsView === "portfolio"
                        ? "Scan the roster, then drop into the workspace that needs momentum."
                        : "Look at featured, active and scheduled rails before touching drafts."
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
                <OpsMetricCard label="Drafts" value={draftCount} emphasis="warning" />
                <OpsMetricCard label="Avg XP budget" value={avgBudget} />
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

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
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
              <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-3 text-sm text-sub">
                {filteredCampaigns.length} campaigns in view
              </div>
            </div>
          </div>
        }
      >
        {campaignsView === "portfolio" ? (
          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <OpsPanel
              eyebrow="Portfolio posture"
              title="What the campaign system is holding"
              description="Use this side to understand where velocity is building and where the board is starting to drift."
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Featured"
                  value={`${featuredCount} campaign${featuredCount === 1 ? "" : "s"} are highlighted right now.`}
                />
                <OpsSnapshotRow
                  label="Paused"
                  value={`${pausedCount} campaign${pausedCount === 1 ? "" : "s"} are waiting for operator recovery or a new launch decision.`}
                />
                <OpsSnapshotRow
                  label="Audience"
                  value={`${totalParticipants.toLocaleString()} participants are currently attached across the full portfolio.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Campaign roster"
              title="Read the campaign stream"
              description="Start with title and project context, then scan type, status and budget before opening detail."
            >
              <div className="overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.025]">
                <div className="grid grid-cols-8 border-b border-white/6 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                  <div>Campaign</div>
                  <div>Project</div>
                  <div>Type</div>
                  <div>Status</div>
                  <div>XP budget</div>
                  <div>Participants</div>
                  <div>Featured</div>
                  <div>Open</div>
                </div>

                {filteredCampaigns.map((campaign) => {
                  const project = projects.find((item) => item.id === campaign.projectId);

                  return (
                    <div
                      key={campaign.id}
                      className="grid grid-cols-8 items-center border-b border-white/6 px-5 py-4 text-sm text-text last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold">{campaign.title}</p>
                        <p className="mt-1 text-xs text-sub">{campaign.slug}</p>
                      </div>
                      <div>{project?.name || "-"}</div>
                      <div className="capitalize">{campaign.campaignType.replace(/_/g, " ")}</div>
                      <div>
                        <OpsStatusPill tone={campaignStatusTone(campaign.status)}>
                          {campaign.status}
                        </OpsStatusPill>
                      </div>
                      <div>{campaign.xpBudget}</div>
                      <div>{campaign.participants}</div>
                      <div>{campaign.featured ? "Yes" : "No"}</div>
                      <div>
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="rounded-full border border-white/6 bg-white/[0.025] px-3 py-2 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {filteredCampaigns.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-sub">
                    No campaigns match your filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {campaignsView === "launch" ? (
          <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
            <OpsPanel
              eyebrow="Launch pressure"
              title="What deserves attention first"
              description="Start here when you are deciding what the launch team should touch next."
              tone="accent"
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Live now"
                  value={`${activeCount} active campaign${activeCount === 1 ? "" : "s"} are already absorbing contributor traffic.`}
                />
                <OpsSnapshotRow
                  label="Next up"
                  value={`${scheduledCount} scheduled campaign${scheduledCount === 1 ? "" : "s"} are close enough to matter operationally.`}
                />
                <OpsSnapshotRow
                  label="Backlog"
                  value={`${draftCount} draft campaign${draftCount === 1 ? "" : "s"} still need a publish decision or more setup.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Launch board"
              title="Open the campaigns that move the system"
              description="Featured, active and scheduled campaigns float to the top so the team can keep a single reading path."
            >
              <div className="grid gap-3">
                {launchCampaigns.map((campaign) => {
                  const project = projects.find((item) => item.id === campaign.projectId);
                  return (
                    <BuilderActionCard
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
                        { label: "Budget", value: campaign.xpBudget },
                        { label: "Participants", value: campaign.participants },
                      ]}
                    />
                  );
                })}

                {launchCampaigns.length === 0 ? (
                  <div className="rounded-[24px] border border-white/6 bg-white/[0.025] px-5 py-6 text-sm text-sub">
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

function BuilderActionCard({
  title,
  description,
  href,
  badges,
  stats,
  badgeTone,
}: {
  title: string;
  description: string;
  href: string;
  badges: Array<string | null>;
  stats: Array<{ label: string; value: string | number }>;
  badgeTone: "default" | "success" | "warning";
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-extrabold text-text">{title}</p>
            {badges.filter(Boolean).map((badge) => (
              <OpsStatusPill
                key={`${title}-${badge}`}
                tone={badge === badges[0] ? badgeTone : "default"}
              >
                {badge}
              </OpsStatusPill>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
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
