"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RaidsPage() {
  const raids = useAdminPortalStore((s) => s.raids);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");

  const filteredRaids = useMemo(() => {
    return raids.filter((raid) => {
      const campaign = campaigns.find((c) => c.id === raid.campaignId);
      const project = projects.find((p) => p.id === raid.projectId);

      const matchesSearch =
        raid.title.toLowerCase().includes(search.toLowerCase()) ||
        raid.community.toLowerCase().includes(search.toLowerCase()) ||
        raid.target.toLowerCase().includes(search.toLowerCase()) ||
        (campaign?.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (project?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || raid.status === status;
      const matchesPlatform = platform === "all" || raid.platform === platform;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [raids, campaigns, projects, search, status, platform]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Raid Management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Raids</h1>
          </div>

          <Link
            href="/raids/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Raid
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search raids..."
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
            <option value="ended">ended</option>
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all platforms</option>
            <option value="x">x</option>
            <option value="telegram">telegram</option>
            <option value="discord">discord</option>
            <option value="website">website</option>
            <option value="reddit">reddit</option>
            <option value="custom">custom</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
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
                <div className="capitalize text-primary">{raid.status}</div>
                <div>{raid.rewardXp}</div>
                <div>{raid.participants}</div>
                <div>
                  <Link
                    href={`/raids/${raid.id}`}
                    className="rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredRaids.length === 0 ? (
            <div className="px-5 py-8 text-sm text-sub">
              No raids match your filters.
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}