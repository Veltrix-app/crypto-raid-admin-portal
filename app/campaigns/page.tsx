"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  OpsFilterBar,
  OpsHero,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function CampaignsPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

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
  }, [campaigns, projects, search, status, projectFilter, typeFilter]);

  const activeCount = campaigns.filter((campaign) => campaign.status === "active").length;
  const draftCount = campaigns.filter((campaign) => campaign.status === "draft").length;
  const featuredCount = campaigns.filter((campaign) => campaign.featured).length;
  const totalParticipants = campaigns.reduce((sum, campaign) => sum + campaign.participants, 0);
  const avgBudget = campaigns.length
    ? Math.round(campaigns.reduce((sum, campaign) => sum + campaign.xpBudget, 0) / campaigns.length)
    : 0;

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Campaign Board"
          title="Campaigns"
          description="See launch posture, live participation and the mix between draft work and campaigns already running in the wild."
          aside={
            <Link href="/campaigns/new" className="inline-flex rounded-2xl bg-primary px-4 py-3 font-bold text-black">
              New Campaign
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Total campaigns" value={campaigns.length} />
          <OpsMetricCard label="Active" value={activeCount} emphasis={activeCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Drafts" value={draftCount} emphasis={draftCount > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Featured" value={featuredCount} emphasis={featuredCount > 0 ? "primary" : "default"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <OpsPanel
            eyebrow="Launch posture"
            title="What the campaign system is holding"
            description="A compact read on audience volume, featured inventory and average XP budget across the full portfolio."
            tone="accent"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <SignalCard label="Participants" value={totalParticipants.toLocaleString()} hint="Total joined campaign audience across the board." />
              <SignalCard label="Avg XP budget" value={avgBudget} hint="Average budget per campaign in the current workspace mix." />
              <SignalCard label="Project coverage" value={new Set(campaigns.map((campaign) => campaign.projectId)).size} hint="Projects currently represented by at least one campaign." />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Mix"
            title="Current portfolio state"
            description="A short board for launch-ready, paused and archived campaign posture."
          >
            <div className="grid gap-4">
              <MiniRow label="Scheduled" value={`${campaigns.filter((campaign) => campaign.status === "scheduled").length}`} />
              <MiniRow label="Paused" value={`${campaigns.filter((campaign) => campaign.status === "paused").length}`} />
              <MiniRow label="Completed" value={`${campaigns.filter((campaign) => campaign.status === "completed").length}`} />
              <MiniRow label="Archived" value={`${campaigns.filter((campaign) => campaign.status === "archived").length}`} />
            </div>
          </OpsPanel>
        </div>

        <OpsFilterBar>
          <OpsSearchInput value={search} onChange={setSearch} placeholder="Search campaigns..." />
          <OpsSelect value={status} onChange={setStatus}>
            <option value="all">all statuses</option>
            <option value="draft">draft</option>
            <option value="scheduled">scheduled</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="completed">completed</option>
            <option value="archived">archived</option>
          </OpsSelect>
          <OpsSelect value={projectFilter} onChange={setProjectFilter}>
            <option value="all">all projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </OpsSelect>
        </OpsFilterBar>

        <div className="rounded-[24px] border border-line bg-card p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <OpsSelect value={typeFilter} onChange={setTypeFilter}>
              <option value="all">all types</option>
              <option value="social_growth">social growth</option>
              <option value="community_growth">community growth</option>
              <option value="onchain">onchain</option>
              <option value="referral">referral</option>
              <option value="content">content</option>
              <option value="hybrid">hybrid</option>
            </OpsSelect>
            <div className="rounded-[20px] border border-line bg-card2 px-4 py-3 text-sm text-sub">
              {filteredCampaigns.length} campaigns in view
            </div>
          </div>
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
                    <OpsStatusPill tone={campaign.status === "active" ? "success" : campaign.status === "draft" ? "warning" : "default"}>
                      {campaign.status}
                    </OpsStatusPill>
                  </div>
                  <div>{campaign.xpBudget}</div>
                  <div>{campaign.participants}</div>
                  <div>{campaign.featured ? "Yes" : "No"}</div>
                  <div>
                    <Link href={`/campaigns/${campaign.id}`} className="rounded-xl border border-line bg-card px-3 py-2 font-semibold">
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
      </div>
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
