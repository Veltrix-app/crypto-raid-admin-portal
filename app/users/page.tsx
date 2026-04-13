"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function UsersPage() {
  const users = useAdminPortalStore((s) => s.users);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const memberships = useAdminAuthStore((s) => s.memberships);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all");

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
  const totalQuestCompletions = users.reduce((sum, user) => sum + user.questsCompleted, 0);
  const avgXp =
    users.length > 0 ? Math.round(users.reduce((sum, user) => sum + user.xp, 0) / users.length) : 0;

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Community Reputation Board"
          title="Users"
          description={
            activeWorkspace
              ? `Reputation and trust signals for contributors inside ${activeWorkspace.projectName}.`
              : "Platform-wide reputation and trust signals for contributors."
          }
          aside={
            <div className="grid grid-cols-2 gap-2">
              <ReputationChip label="Avg trust" value={String(avgTrust)} tone={avgTrust >= 60 ? "success" : "warning"} />
              <ReputationChip label="Avg sybil" value={String(avgSybil)} tone={avgSybil >= 60 ? "danger" : "success"} />
            </div>
          }
        />

        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Tracked users" value={users.length} />
          <OpsMetricCard label="Active" value={activeCount} emphasis={activeCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Flagged" value={flaggedCount} emphasis={flaggedCount > 0 ? "warning" : "default"} />
          <OpsMetricCard label={activeWorkspace ? "Avg local trust" : "Avg trust"} value={avgTrust} emphasis={avgTrust >= 60 ? "primary" : "default"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
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
              <DecisionCard label="Quest completions" value={totalQuestCompletions} hint="Total finished quest actions across the current dataset." />
              <DecisionCard label="Average XP" value={avgXp} hint="A fast read on how deep the current contributor base is." />
              <DecisionCard label="Flagged users" value={flaggedCount} hint="Accounts currently carrying elevated trust or abuse risk." tone="warning" />
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

        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search username, title or tier…"
            ariaLabel="Search users"
            name="user-search"
          />
          <OpsSelect value={status} onChange={setStatus} ariaLabel="Filter users by status" name="user-status">
            <option value="all">all statuses</option>
            <option value="active">active</option>
            <option value="flagged">flagged</option>
          </OpsSelect>
          <div className="rounded-[20px] border border-line bg-card2 px-4 py-3 text-sm text-sub">
            {filteredUsers.length} users in view
          </div>
        </OpsFilterBar>

        <OpsPanel
          eyebrow="Contributor stream"
          title="Reputation roster"
          description="Trust, sybil risk, XP and claim history brought together into one readable community board."
        >
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-extrabold text-text">{user.username}</h2>
                      <OpsStatusPill tone="default">{user.contributionTier}</OpsStatusPill>
                      {user.title ? <OpsStatusPill tone="success">{user.title}</OpsStatusPill> : null}
                    </div>

                    <p className="mt-3 text-sm text-sub">
                      XP: {user.xp.toLocaleString()} • Level: {user.level} • Streak: {user.streak}
                    </p>

                    <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <Metric label="Trust" value={user.trustScore} />
                      <Metric label="Sybil risk" value={user.sybilScore} />
                      <Metric label="Quests" value={user.questsCompleted} />
                      <Metric label="Claims" value={user.rewardsClaimed} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-card px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Rank</p>
                    <p className="mt-2 text-2xl font-extrabold text-text">
                      {user.reputationRank > 0 ? `#${user.reputationRank}` : "-"}
                    </p>
                    <div className="mt-3">
                      <OpsStatusPill tone={user.status === "flagged" ? "danger" : "success"}>
                        {user.status}
                      </OpsStatusPill>
                    </div>
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
        </OpsPanel>
      </div>
    </AdminShell>
  );
}

function ReputationChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success" | "danger";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : tone === "success"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : tone === "danger"
          ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
          : "border-white/10 bg-white/[0.05] text-text";

  return (
    <div className={`rounded-[18px] border px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
    </div>
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
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold ${tone === "warning" ? "text-amber-300" : "text-text"}`}>{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
