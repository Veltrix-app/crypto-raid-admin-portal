"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function QuestsPage() {
  const quests = useAdminPortalStore((s) => s.quests);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [questType, setQuestType] = useState("all");

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      const campaign = campaigns.find((c) => c.id === quest.campaignId);
      const project = projects.find((p) => p.id === quest.projectId);

      const matchesSearch =
        quest.title.toLowerCase().includes(search.toLowerCase()) ||
        quest.description.toLowerCase().includes(search.toLowerCase()) ||
        (campaign?.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (project?.name || "").toLowerCase().includes(search.toLowerCase());

      const matchesStatus = status === "all" || quest.status === status;
      const matchesQuestType = questType === "all" || quest.questType === questType;

      return matchesSearch && matchesStatus && matchesQuestType;
    });
  }, [quests, campaigns, projects, search, status, questType]);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Quest Management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Quests</h1>
          </div>

          <Link
            href="/quests/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Quest
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quests..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all statuses</option>
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="archived">archived</option>
          </select>

          <select
            value={questType}
            onChange={(e) => setQuestType(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all quest types</option>
            <option value="social_follow">social_follow</option>
            <option value="social_like">social_like</option>
            <option value="social_repost">social_repost</option>
            <option value="social_comment">social_comment</option>
            <option value="telegram_join">telegram_join</option>
            <option value="discord_join">discord_join</option>
            <option value="wallet_connect">wallet_connect</option>
            <option value="token_hold">token_hold</option>
            <option value="nft_hold">nft_hold</option>
            <option value="onchain_tx">onchain_tx</option>
            <option value="url_visit">url_visit</option>
            <option value="referral">referral</option>
            <option value="manual_proof">manual_proof</option>
            <option value="custom">custom</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
          <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
            <div>Quest</div>
            <div>Project</div>
            <div>Campaign</div>
            <div>Quest Type</div>
            <div>Status</div>
            <div>XP</div>
            <div>Auto</div>
            <div>Open</div>
          </div>

          {filteredQuests.map((quest) => {
            const campaign = campaigns.find((c) => c.id === quest.campaignId);
            const project = projects.find((p) => p.id === quest.projectId);

            return (
              <div
                key={quest.id}
                className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
              >
                <div>
                  <p className="font-semibold">{quest.title}</p>
                  <p className="mt-1 text-xs text-sub">{quest.actionLabel}</p>
                </div>
                <div>{project?.name || "-"}</div>
                <div>{campaign?.title || "-"}</div>
                <div className="capitalize">{quest.questType}</div>
                <div className="capitalize text-primary">{quest.status}</div>
                <div>{quest.xp}</div>
                <div>{quest.autoApprove ? "Yes" : "No"}</div>
                <div>
                  <Link
                    href={`/quests/${quest.id}`}
                    className="rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredQuests.length === 0 ? (
            <div className="px-5 py-8 text-sm text-sub">
              No quests match your filters.
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}