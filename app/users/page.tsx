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
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function UsersPage() {
  const users = useAdminPortalStore((s) => s.users);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const memberships = useAdminAuthStore((s) => s.memberships);
  const router = useRouter();
  const pathname = usePathname() ?? "/users";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [usersView, setUsersView] = useState<"roster" | "risk">("roster");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setSearch(params.get("search") ?? "");
    setStatus(params.get("status") ?? "all");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(next, { scroll: false });
  }, [pathname, router, search, status]);

  const activeWorkspace = memberships.find((item) => item.projectId === activeProjectId);
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const term = search.toLowerCase();
      const matchesSearch =
        user.username.toLowerCase().includes(term) ||
        (user.title || "").toLowerCase().includes(term) ||
        user.contributionTier.toLowerCase().includes(term);
      const matchesStatus = status === "all" || user.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status, users]);

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
  const totalQuestCompletions = users.reduce((sum, user) => sum + user.questsCompleted, 0);
  const avgXp =
    users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.xp, 0) / users.length) : 0;

  const riskUsers = useMemo(
    () =>
      [...filteredUsers]
        .filter((user) => user.status === "flagged" || user.sybilScore >= 60 || user.trustScore <= 45)
        .sort((a, b) => b.sybilScore - a.sybilScore || a.trustScore - b.trustScore),
    [filteredUsers]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Community reputation board"
        title="Users"
        description={
          activeWorkspace
            ? `Reputation, trust and risk signals for contributors inside ${activeWorkspace.projectName}.`
            : "Platform-wide reputation and trust signals for contributors."
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <OpsMetricCard label="Tracked users" value={users.length} />
              <OpsMetricCard
                label="Active"
                value={activeCount}
                emphasis={activeCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Flagged"
                value={flaggedCount}
                emphasis={flaggedCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label={activeWorkspace ? "Avg local trust" : "Avg trust"}
                value={avgTrust}
                emphasis={avgTrust >= 60 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Avg sybil risk"
                value={avgSybil}
                emphasis={avgSybil >= 60 ? "warning" : "default"}
              />
              <OpsMetricCard label="Avg XP" value={avgXp} />
            </div>

            <OpsPanel
              title="User work modes"
              description="Use roster mode for contributor scanning and risk mode for trust posture, flagged accounts and abuse pressure."
              action={
                <SegmentToggle
                  value={usersView}
                  onChange={setUsersView}
                  options={[
                    { value: "roster", label: "Roster" },
                    { value: "risk", label: "Risk" },
                  ]}
                />
              }
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] px-3.5 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                    Roster
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-sub">
                    Scan contribution depth, tiers, titles and rank posture across the community.
                  </p>
                </div>
                <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] px-3.5 py-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                    Risk
                  </p>
                  <p className="mt-1.5 text-[12px] leading-5 text-sub">
                    Pull flagged, low-trust and high-sybil contributors into a focused investigation lane.
                  </p>
                </div>
              </div>
            </OpsPanel>

            <OpsFilterBar>
              <OpsSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search username, title or tier..."
                ariaLabel="Search users"
                name="user-search"
              />
              <OpsSelect
                value={status}
                onChange={setStatus}
                ariaLabel="Filter users by status"
                name="user-status"
              >
                <option value="all">all statuses</option>
                <option value="active">active</option>
                <option value="flagged">flagged</option>
              </OpsSelect>
              <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5 text-[12px] text-sub">
                {filteredUsers.length} users in view
              </div>
            </OpsFilterBar>
          </div>
        }
      >
        {usersView === "roster" ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
              <OpsPanel
                eyebrow="Reputation snapshot"
                title="Quality over raw participation"
                description={
                  activeWorkspace
                    ? `This workspace is using project-specific reputation for ${activeWorkspace.projectName}. XP, trust and tiers now reflect local contribution instead of only global platform behavior.`
                    : "This view combines profile XP with trust, sybil risk, contribution tier and completion history to drive moderation and anti-abuse."
                }
                tone="accent"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <DecisionCard
                    label="Quest completions"
                    value={totalQuestCompletions}
                    hint="Total finished quest actions across the current dataset."
                  />
                  <DecisionCard
                    label="Average XP"
                    value={avgXp}
                    hint="A fast read on how deep the current contributor base is."
                  />
                  <DecisionCard
                    label="Flagged users"
                    value={flaggedCount}
                    hint="Accounts currently carrying elevated trust or abuse risk."
                    tone="warning"
                  />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Trust posture"
                title="Contribution quality signals"
                description="The shortest board for whether the current community looks healthy or risky."
              >
                <div className="grid gap-4">
                  <SignalRow label="Average trust" value={`${avgTrust}`} />
                  <SignalRow label="Average sybil risk" value={`${avgSybil}`} />
                  <SignalRow label="Flagged accounts" value={`${flaggedCount}`} />
                </div>
              </OpsPanel>
            </div>

            <OpsPanel
              eyebrow="Contributor stream"
              title="Reputation roster"
              description="Trust, sybil risk, XP and claim history brought together into a calmer contributor rail instead of a raw list."
            >
              <div className="grid gap-4 xl:items-start xl:grid-cols-2">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-[0.98rem] font-semibold text-text">{user.username}</h2>
                          <OpsStatusPill tone="default">{user.contributionTier}</OpsStatusPill>
                          {user.title ? <OpsStatusPill tone="success">{user.title}</OpsStatusPill> : null}
                        </div>

                        <p className="mt-2.5 text-[12px] text-sub">
                          XP: {user.xp.toLocaleString()} / Level: {user.level} / Streak: {user.streak}
                        </p>

                        <div className="mt-3 grid gap-2.5 md:grid-cols-4">
                          <Metric label="Trust" value={user.trustScore} />
                          <Metric label="Sybil risk" value={user.sybilScore} />
                          <Metric label="Quests" value={user.questsCompleted} />
                          <Metric label="Claims" value={user.rewardsClaimed} />
                        </div>
                      </div>

                      <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.018] px-3 py-2.5 text-right">
                        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">Rank</p>
                        <p className="mt-1.5 text-[1.05rem] font-semibold text-text">
                          {user.reputationRank > 0 ? `#${user.reputationRank}` : "-"}
                        </p>
                        <div className="mt-2">
                          <OpsStatusPill tone={user.status === "flagged" ? "danger" : "success"}>
                            {user.status}
                          </OpsStatusPill>
                        </div>
                        <Link
                          href={`/users/${user.authUserId ?? user.id}`}
                          className="mt-3 inline-flex rounded-[12px] border border-white/[0.032] bg-white/[0.014] px-3 py-2 text-[12px] font-bold text-text transition hover:border-primary/30 hover:text-primary"
                        >
                          Open profile
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 ? (
                  <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-4 text-[12px] text-sub">
                    No users match your filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </>
        ) : null}

        {usersView === "risk" ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
              <OpsPanel
                eyebrow="Risk posture"
                title="Watchlist summary"
                description="The shortest read on whether community quality is drifting into review territory."
                tone="accent"
              >
                <div className="grid gap-4">
                  <SignalRow label="Flagged accounts" value={`${flaggedCount}`} />
                  <SignalRow label="Avg trust" value={`${avgTrust}`} />
                  <SignalRow label="Avg sybil risk" value={`${avgSybil}`} />
                  <SignalRow label="High-risk users in view" value={`${riskUsers.length}`} />
                </div>
              </OpsPanel>

              <OpsPanel
                eyebrow="Watchlist"
                title="High-conviction risk queue"
                description="Users with the highest sybil scores or the weakest trust posture surface here first."
              >
                <div className="grid gap-4 xl:items-start xl:grid-cols-2">
                  {riskUsers.slice(0, 8).map((user) => (
                    <div key={user.id} className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-[0.98rem] font-semibold text-text">{user.username}</p>
                            <OpsStatusPill tone="danger">{user.status}</OpsStatusPill>
                            <OpsStatusPill tone="warning">{user.contributionTier}</OpsStatusPill>
                          </div>
                          <p className="mt-2.5 text-[12px] leading-5 text-sub">
                            Trust {user.trustScore} / Sybil {user.sybilScore} / XP {user.xp.toLocaleString()}
                          </p>
                          <div className="mt-3 grid gap-2.5 md:grid-cols-3">
                            <Metric label="Quests" value={user.questsCompleted} />
                            <Metric label="Claims" value={user.rewardsClaimed} />
                            <Metric label="Streak" value={user.streak} />
                          </div>
                        </div>

                        <Link
                          href={`/users/${user.authUserId ?? user.id}`}
                          className="rounded-[14px] border border-white/[0.032] bg-white/[0.014] px-3 py-2 text-[12px] font-bold text-text transition hover:border-primary/30 hover:text-primary"
                        >
                          Open profile
                        </Link>
                      </div>
                    </div>
                  ))}

                  {riskUsers.length === 0 ? (
                    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-4 text-[12px] text-sub">
                      No risk-heavy users match the current filters.
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

function DecisionCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5">
      <p className="text-[12px] text-sub">{label}</p>
      <p className={`mt-1.5 text-[1.05rem] font-semibold ${tone === "warning" ? "text-amber-300" : "text-text"}`}>
        {value}
      </p>
      <p className="mt-1.5 text-[12px] leading-5 text-sub">{hint}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.014] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[14px] border border-white/[0.026] bg-white/[0.018] px-3 py-2.5">
      <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-1.5 text-[12px] font-semibold text-text">{value}</p>
    </div>
  );
}
