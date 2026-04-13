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

export default function ClaimsPage() {
  const claims = useAdminPortalStore((s) => s.claims);
  const users = useAdminPortalStore((s) => s.users);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const reviewClaim = useAdminPortalStore((s) => s.reviewClaim);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [workingId, setWorkingId] = useState<string | null>(null);

  const usersByAuthId = new Map(
    users.filter((user) => !!user.authUserId).map((user) => [user.authUserId as string, user])
  );
  const flagsByClaimId = reviewFlags.reduce((acc, flag) => {
    if (flag.sourceTable !== "reward_claims") return acc;
    const existing = acc.get(flag.sourceId) ?? [];
    existing.push(flag);
    acc.set(flag.sourceId, existing);
    return acc;
  }, new Map<string, typeof reviewFlags>());

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const term = search.toLowerCase();
      const matchesSearch =
        claim.username.toLowerCase().includes(term) ||
        claim.rewardTitle.toLowerCase().includes(term) ||
        (claim.projectName || "").toLowerCase().includes(term) ||
        (claim.campaignTitle || "").toLowerCase().includes(term);

      const matchesStatus = status === "all" || claim.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [claims, search, status]);

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const processingCount = claims.filter((c) => c.status === "processing").length;
  const fulfilledCount = claims.filter((c) => c.status === "fulfilled").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;
  const highPriorityCount = claims.filter((claim) => {
    const user = usersByAuthId.get(claim.authUserId);
    return user?.status === "flagged" || (claim.rewardCost ?? 0) >= 500;
  }).length;
  const manualClaims = claims.filter((claim) => claim.claimMethod === "manual_fulfillment");
  const highValueClaims = claims.filter((claim) => (claim.rewardCost ?? 0) >= 500);
  const highPriorityClaims = filteredClaims.filter((claim) => {
    const user = usersByAuthId.get(claim.authUserId);
    const linkedFlags = flagsByClaimId.get(claim.id) ?? [];
    return user?.status === "flagged" || linkedFlags.length > 0 || (claim.rewardCost ?? 0) >= 500;
  });

  async function handleQuickStatus(claimId: string, nextStatus: "processing" | "fulfilled") {
    try {
      setWorkingId(claimId);
      await reviewClaim(claimId, nextStatus);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Reward Claim Management"
          title="Claims"
          description="Monitor payout pressure, prioritize risky requests and move reward fulfillment through one clear workspace."
        />

        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Pending" value={pendingCount} emphasis={pendingCount > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Processing" value={processingCount} emphasis={processingCount > 0 ? "primary" : "default"} />
          <OpsMetricCard label="Fulfilled" value={fulfilledCount} />
          <OpsMetricCard label="Rejected" value={rejectedCount} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <OpsPanel
            eyebrow="Operations Focus"
            title="Claims that deserve hands-on attention first"
            description="Flagged users, high-value rewards and manual fulfillment routes get surfaced ahead of the normal queue."
            tone="accent"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <FocusCard
                label="High priority"
                value={highPriorityClaims.length}
                hint="Flagged users, high-value rewards or explicit review flags."
              />
              <FocusCard
                label="Manual queue"
                value={manualClaims.filter((claim) => claim.status !== "fulfilled").length}
                hint="Claims that still need human delivery or confirmation."
              />
              <FocusCard
                label="Ready to fulfill"
                value={claims.filter((claim) => claim.status === "processing").length}
                hint="Claims already triaged and ready for final delivery."
              />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Volume mix"
            title="Reward pressure by route"
            description="A compact read on expensive and manual claim inventory."
          >
            <div className="grid gap-4">
              <OpsMetricCard label="High priority" value={highPriorityCount} emphasis={highPriorityCount > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Manual fulfillment" value={manualClaims.length} />
              <OpsMetricCard label="High value" value={highValueClaims.length} emphasis={highValueClaims.length > 0 ? "warning" : "default"} />
            </div>
          </OpsPanel>
        </div>

        <OpsFilterBar>
          <OpsSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search user, reward, project or campaign..."
          />
          <OpsSelect value={status} onChange={setStatus}>
            <option value="all">all statuses</option>
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="fulfilled">fulfilled</option>
            <option value="rejected">rejected</option>
          </OpsSelect>
          <div className="rounded-[20px] border border-line bg-card2 px-4 py-3 text-sm text-sub">
            {filteredClaims.length} claims in view
          </div>
        </OpsFilterBar>

        <OpsPanel
          eyebrow="Fulfillment queue"
          title="Claim operations"
          description="Every claim includes risk context, the current decision route and a quick action when it is safe to move forward."
        >
          <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
            <div className="grid grid-cols-9 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
              <div>User</div>
              <div>Reward</div>
              <div>Project</div>
              <div>Campaign</div>
              <div>Risk</div>
              <div>Status</div>
              <div>Created</div>
              <div>Quick action</div>
              <div>Open</div>
            </div>

            {filteredClaims.map((claim) => {
              const user = usersByAuthId.get(claim.authUserId);
              const linkedFlags = flagsByClaimId.get(claim.id) ?? [];
              const riskLabel =
                user?.status === "flagged" ? `Watch • Sybil ${user.sybilScore}` : `Trust ${user?.trustScore ?? 50}`;
              const priorityLabel =
                linkedFlags.length > 0
                  ? linkedFlags[0].flagType.replace(/_/g, " ")
                  : (claim.rewardCost ?? 0) >= 500
                    ? "High value"
                    : claim.claimMethod === "manual_fulfillment"
                      ? "Manual"
                      : "Normal";
              const decisionReason =
                linkedFlags[0]?.reason ??
                ((claim.rewardCost ?? 0) >= 500
                  ? "This reward is valuable enough to deserve an extra fulfillment checkpoint."
                  : claim.claimMethod === "manual_fulfillment"
                    ? "This claim depends on a manual delivery step from the project team."
                    : "This claim can move through the standard fulfillment flow.");

              return (
                <div
                  key={claim.id}
                  className="grid grid-cols-9 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                >
                  <div className="font-semibold">{claim.username}</div>
                  <div>{claim.rewardTitle}</div>
                  <div>{claim.projectName || "-"}</div>
                  <div>{claim.campaignTitle || "-"}</div>
                  <div>
                    <div className="space-y-2">
                      <OpsStatusPill tone={user?.status === "flagged" ? "danger" : "default"}>{riskLabel}</OpsStatusPill>
                      <span className="block text-xs text-sub capitalize">{priorityLabel}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="capitalize text-primary">{claim.status}</p>
                    <p className="line-clamp-2 text-xs text-sub">{decisionReason}</p>
                  </div>
                  <div>{formatDate(claim.createdAt)}</div>
                  <div>
                    {claim.status === "pending" ? (
                      <button
                        onClick={() => handleQuickStatus(claim.id, "processing")}
                        disabled={workingId === claim.id}
                        className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                      >
                        {workingId === claim.id ? "Working..." : "Start"}
                      </button>
                    ) : claim.status === "processing" ? (
                      <button
                        onClick={() => handleQuickStatus(claim.id, "fulfilled")}
                        disabled={workingId === claim.id}
                        className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                      >
                        {workingId === claim.id ? "Working..." : "Fulfill"}
                      </button>
                    ) : (
                      <span className="text-xs text-sub">-</span>
                    )}
                  </div>
                  <div>
                    <Link href={`/claims/${claim.id}`} className="rounded-xl border border-line bg-card px-3 py-2 font-semibold">
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}

            {filteredClaims.length === 0 ? (
              <div className="px-5 py-8 text-sm text-sub">No claims match your filters.</div>
            ) : null}
          </div>
        </OpsPanel>
      </div>
    </AdminShell>
  );
}

function FocusCard({
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
