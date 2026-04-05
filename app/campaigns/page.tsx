"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function CampaignsPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Campaign Builder
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

        <div className="grid gap-4">
          {campaigns.map((campaign) => {
            const project = projects.find((p) => p.id === campaign.projectId);

            return (
              <div
                key={campaign.id}
                className="rounded-[24px] border border-line bg-card p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-text">
                      {campaign.title}
                    </h2>
                    <p className="mt-2 text-sm text-sub">
                      Project: {project?.name || "Unknown"} • Participants:{" "}
                      {campaign.participants} • Completion: {campaign.completionRate}%
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold capitalize text-primary">
                      {campaign.status}
                    </p>
                    <p className="mt-2 text-sm text-sub">
                      XP Budget: {campaign.xpBudget.toLocaleString()}
                    </p>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="mt-3 inline-block rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}