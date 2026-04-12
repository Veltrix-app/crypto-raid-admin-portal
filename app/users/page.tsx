"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const users = useAdminPortalStore((s) => s.users);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const memberships = useAdminAuthStore((s) => s.memberships);

  const activeWorkspace = memberships.find((item) => item.projectId === activeProjectId);
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        (user.title || "").toLowerCase().includes(search.toLowerCase()) ||
        user.contributionTier.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === "all" || user.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [users, search, status]);

  const activeCount = users.filter((user) => user.status === "active").length;
  const flaggedCount = users.filter((user) => user.status === "flagged").length;
  const avgTrust =
    users.length > 0
      ? Math.round(users.reduce((sum, user) => sum + user.trustScore, 0) / users.length)
      : 0;
  const avgSybil =
    users.length > 0
      ? Math.round(users.reduce((sum, user) => sum + user.sybilScore, 0) / users.length)
      : 0;
  const totalQuestCompletions = users.reduce(
    (sum, user) => sum + user.questsCompleted,
    0
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Community Reputation
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Users</h1>
            <p className="mt-2 text-sm text-sub">
              {activeWorkspace
                ? `Reputation and trust signals for contributors inside ${activeWorkspace.projectName}.`
                : "Platform-wide reputation and trust signals for contributors."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Tracked Users" value={users.length} />
          <InfoCard label="Active" value={activeCount} />
          <InfoCard label="Flagged" value={flaggedCount} />
          <InfoCard label={activeWorkspace ? "Avg Local Trust" : "Avg Trust"} value={avgTrust} />
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Reputation Snapshot
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-text">
                Quality over raw participation
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sub">
                {activeWorkspace
                  ? `This workspace is now using project-specific reputation for ${activeWorkspace.projectName}. XP, trust and contribution tiers reflect local contribution inside this project instead of only global platform behavior.`
                  : "This view combines profile XP with the first Veltrix reputation signals: trust, sybil risk, contribution tier and completion history. As we expand phase 4, this becomes the backbone for better moderation, segmentation and anti-abuse."}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Quest Completions
                </p>
                <p className="mt-2 text-2xl font-extrabold text-text">
                  {totalQuestCompletions}
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Avg Sybil
                </p>
                <p className="mt-2 text-2xl font-extrabold text-text">
                  {avgSybil}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, title or tier..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all</option>
            <option value="active">active</option>
            <option value="flagged">flagged</option>
          </select>
        </div>

        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-[24px] border border-line bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-extrabold text-text">{user.username}</h2>
                    <span className="rounded-full border border-line bg-card2 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                      {user.contributionTier}
                    </span>
                    {user.title ? (
                      <span className="rounded-full border border-line bg-card2 px-3 py-1 text-xs font-semibold text-sub">
                        {user.title}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-3 text-sm text-sub">
                    XP: {user.xp.toLocaleString()} • Level: {user.level} • Streak: {user.streak}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Metric label="Trust" value={user.trustScore} />
                    <Metric label="Sybil Risk" value={user.sybilScore} />
                    <Metric label="Quests" value={user.questsCompleted} />
                    <Metric label="Claims" value={user.rewardsClaimed} />
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                    Rank
                  </p>
                  <p className="mt-2 text-2xl font-extrabold text-text">
                    {user.reputationRank > 0 ? `#${user.reputationRank}` : "-"}
                  </p>
                  <p
                    className={`mt-2 text-sm font-semibold capitalize ${
                      user.status === "flagged" ? "text-rose-300" : "text-primary"
                    }`}
                  >
                    {user.status}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 ? (
            <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
              No users match your filters.
            </div>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
