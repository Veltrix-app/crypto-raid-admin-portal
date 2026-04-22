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
  const featuredCount = campaigns.filter((campaign) => campaign.featured).length;
  const totalParticipants = campaigns.reduce((sum, campaign) => sum + campaign.participants, 0);
  const avgBudget = campaigns.length
    ? Math.round(campaigns.reduce((sum, campaign) => sum + campaign.xpBudget, 0) / campaigns.length)
    : 0;

  const launchCampaigns = useMemo(
    () =>
      filteredCampaigns.filter((campaign) =>
        ["active", "scheduled", "draft"].includes(campaign.status)
      ),
    [filteredCampaigns]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Campaign board"
        title="Campaigns"
        description="Manage the campaign portfolio in clearer lanes: overall inventory on one side, launch pressure and readiness on the other."
        actions={
          <Link
            href="/campaigns/new"
            className="inline-flex rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Campaign
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <OpsMetricCard label="Total campaigns" value={campaigns.length} />
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
                label="Drafts"
                value={draftCount}
                emphasis={draftCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Featured"
                value={featuredCount}
                emphasis={featuredCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard label="Avg XP budget" value={avgBudget} />
            </div>

            <OpsPanel
              title="Campaign work modes"
              description="Use portfolio mode for overall inventory and launch mode when the team is actively pushing campaigns out."
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Portfolio
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Review the full roster, project coverage, XP budgets and status mix.
                  </p>
                </div>
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Launch
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Focus on active, scheduled and draft campaigns that need launch attention now.
                  </p>
                </div>
              </div>
            </OpsPanel>

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
              <div className="rounded-[20px] border border-line bg-card2 px-4 py-3 text-sm text-sub">
                {filteredCampaigns.length} campaigns in view
              </div>
            </div>
          </div>
        }
      >
        {campaignsView === "portfolio" ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Launch posture"
                title="What the campaign system is holding"
                description="A compact read on audience volume, featured inventory and average XP budget across the full portfolio."
                tone="accent"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <SignalCard
                    label="Participants"
                    value={totalParticipants.toLocaleString()}
                    hint="Total joined campaign audience across the board."
                  />
                  <SignalCard
                    label="Avg XP budget"
                    value={avgBudget}
                    hint="Average budget per campaign in the current workspace mix."
                  />
                  <SignalCard
                    label="Project coverage"
                    value={new Set(campaigns.map((campaign) => campaign.projectId)).size}
                    hint="Projects currently represented by at least one campaign."
                  />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Mix"
                title="Current portfolio state"
                description="A short board for launch-ready, paused and archived campaign posture."
              >
                <div className="grid gap-4">
                  <MiniRow
                    label="Scheduled"
                    value={`${campaigns.filter((campaign) => campaign.status === "scheduled").length}`}
                  />
                  <MiniRow
                    label="Paused"
                    value={`${campaigns.filter((campaign) => campaign.status === "paused").length}`}
                  />
                  <MiniRow
                    label="Completed"
                    value={`${campaigns.filter((campaign) => campaign.status === "completed").length}`}
                  />
                  <MiniRow
                    label="Archived"
                    value={`${campaigns.filter((campaign) => campaign.status === "archived").length}`}
                  />
                </div>
              </OpsPanel>
            </div>

            <OpsPanel
              eyebrow="Campaign roster"
              title="Campaign stream"
              description="The current campaign list with project context, type, status and a fast route into detail."
            >
              <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
                <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
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
                  const project = projects.find((p) => p.id === campaign.projectId);

                  return (
                    <div
                      key={campaign.id}
                      className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold">{campaign.title}</p>
                        <p className="mt-1 text-xs text-sub">{campaign.slug}</p>
                      </div>
                      <div>{project?.name || "-"}</div>
                      <div className="capitalize">{campaign.campaignType.replace(/_/g, " ")}</div>
                      <div>
                        <OpsStatusPill
                          tone={
                            campaign.status === "active"
                              ? "success"
                              : campaign.status === "draft"
                                ? "warning"
                                : "default"
                          }
                        >
                          {campaign.status}
                        </OpsStatusPill>
                      </div>
                      <div>{campaign.xpBudget}</div>
                      <div>{campaign.participants}</div>
                      <div>{campaign.featured ? "Yes" : "No"}</div>
                      <div>
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="rounded-xl border border-line bg-card px-3 py-2 font-semibold"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {filteredCampaigns.length === 0 ? (
                  <div className="px-5 py-8 text-sm text-sub">No campaigns match your filters.</div>
                ) : null}
              </div>
            </OpsPanel>
          </>
        ) : null}

        {campaignsView === "launch" ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <OpsPanel
                eyebrow="Launch pressure"
                title="What needs attention now"
                description="This lane keeps launch-ready and launch-blocked campaigns separate so the team can move faster."
                tone="accent"
              >
                <div className="grid gap-4">
                  <MiniRow label="Active now" value={`${activeCount}`} />
                  <MiniRow label="Scheduled next" value={`${scheduledCount}`} />
                  <MiniRow label="Draft backlog" value={`${draftCount}`} />
                  <MiniRow label="Featured inventory" value={`${featuredCount}`} />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Priority board"
                title="Launch-ready campaigns"
                description="Featured, active and scheduled campaigns float to the top so the team can scan launch posture quickly."
              >
                <div className="grid gap-4">
                  {launchCampaigns.slice(0, 6).map((campaign) => {
                    const project = projects.find((p) => p.id === campaign.projectId);
                    return (
                      <div key={campaign.id} className="rounded-[24px] border border-line bg-card2 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <p className="text-lg font-extrabold text-text">{campaign.title}</p>
                              <OpsStatusPill
                                tone={
                                  campaign.status === "active"
                                    ? "success"
                                    : campaign.status === "draft"
                                      ? "warning"
                                      : "default"
                                }
                              >
                                {campaign.status}
                              </OpsStatusPill>
                              {campaign.featured ? (
                                <OpsStatusPill tone="success">featured</OpsStatusPill>
                              ) : null}
                            </div>
                            <p className="mt-3 text-sm leading-6 text-sub">
                              {campaign.shortDescription}
                            </p>
                            <div className="mt-4 grid gap-3 md:grid-cols-4">
                              <SignalStat label="Project" value={project?.name || "-"} />
                              <SignalStat label="Type" value={campaign.campaignType.replace(/_/g, " ")} />
                              <SignalStat label="Budget" value={campaign.xpBudget} />
                              <SignalStat label="Participants" value={campaign.participants} />
                            </div>
                          </div>
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="rounded-2xl border border-line bg-card px-4 py-3 font-bold text-sub"
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {launchCampaigns.length === 0 ? (
                    <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                      No launch campaigns match the current filters.
                    </div>
                  ) : null}
                </div>
              </OpsPanel>
            </div>
          </>
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function SignalCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function SignalStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
