"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
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

      const matchesSearch =
        campaign.title.toLowerCase().includes(search.toLowerCase()) ||
        campaign.slug.toLowerCase().includes(search.toLowerCase()) ||
        campaign.shortDescription.toLowerCase().includes(search.toLowerCase()) ||
        (project?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "all" || campaign.status === status;

      const matchesProject =
        projectFilter === "all" || campaign.projectId === projectFilter;

      const matchesType =
        typeFilter === "all" || campaign.campaignType === typeFilter;

      return matchesSearch && matchesStatus && matchesProject && matchesType;
    });
  }, [campaigns, projects, search, status, projectFilter, typeFilter]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Campaign Management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Campaigns</h1>
          </div>

          <Link
            href="/campaigns/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Campaign
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all statuses</option>
            <option value="draft">draft</option>
            <option value="scheduled">scheduled</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="completed">completed</option>
            <option value="archived">archived</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all types</option>
            <option value="social_growth">social_growth</option>
            <option value="community_growth">community_growth</option>
            <option value="onchain">onchain</option>
            <option value="referral">referral</option>
            <option value="content">content</option>
            <option value="hybrid">hybrid</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
          <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
            <div>Campaign</div>
            <div>Project</div>
            <div>Type</div>
            <div>Status</div>
            <div>XP Budget</div>
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
                <div className="capitalize">{campaign.campaignType}</div>
                <div className="capitalize text-primary">{campaign.status}</div>
                <div>{campaign.xpBudget}</div>
                <div>{campaign.participants}</div>
                <div>{campaign.featured ? "Yes" : "No"}</div>
                <div>
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
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
      </div>
    </AdminShell>
  );
}