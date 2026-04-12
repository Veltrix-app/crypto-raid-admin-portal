"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ClaimsPage() {
  const claims = useAdminPortalStore((s) => s.claims);
  const users = useAdminPortalStore((s) => s.users);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const usersByAuthId = new Map(
    users
      .filter((user) => !!user.authUserId)
      .map((user) => [user.authUserId as string, user])
  );

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const matchesSearch =
        claim.username.toLowerCase().includes(search.toLowerCase()) ||
        claim.rewardTitle.toLowerCase().includes(search.toLowerCase()) ||
        (claim.projectName || "").toLowerCase().includes(search.toLowerCase()) ||
        (claim.campaignTitle || "").toLowerCase().includes(search.toLowerCase());

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

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Reward Claim Management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Claims</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Pending" value={pendingCount} />
          <InfoCard label="Processing" value={processingCount} />
          <InfoCard label="Fulfilled" value={fulfilledCount} />
          <InfoCard label="Rejected" value={rejectedCount} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard label="High Priority" value={highPriorityCount} />
          <InfoCard
            label="Manual Fulfillment"
            value={
              claims.filter((claim) => claim.claimMethod === "manual_fulfillment")
                .length
            }
          />
          <InfoCard
            label="High Value"
            value={claims.filter((claim) => (claim.rewardCost ?? 0) >= 500).length}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-[1.4fr_220px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, reward, project or campaign..."
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
          >
            <option value="all">all statuses</option>
            <option value="pending">pending</option>
            <option value="processing">processing</option>
            <option value="fulfilled">fulfilled</option>
            <option value="rejected">rejected</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-line bg-card">
          <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
            <div>User</div>
            <div>Reward</div>
            <div>Project</div>
            <div>Campaign</div>
            <div>Risk</div>
            <div>Status</div>
            <div>Created</div>
            <div>Open</div>
          </div>

          {filteredClaims.map((claim) => {
            const user = usersByAuthId.get(claim.authUserId);
            const riskLabel =
              user?.status === "flagged"
                ? `Watch • Sybil ${user.sybilScore}`
                : `Trust ${user?.trustScore ?? 50}`;
            const priorityLabel =
              user?.status === "flagged"
                ? "Escalate"
                : (claim.rewardCost ?? 0) >= 500
                  ? "High value"
                  : claim.claimMethod === "manual_fulfillment"
                    ? "Manual"
                    : "Normal";

            return (
              <div
                key={claim.id}
                className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
              >
                <div className="font-semibold">{claim.username}</div>
                <div>{claim.rewardTitle}</div>
                <div>{claim.projectName || "-"}</div>
                <div>{claim.campaignTitle || "-"}</div>
                <div>
                  <div className="space-y-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        user?.status === "flagged"
                          ? "bg-rose-500/15 text-rose-300"
                          : "bg-card2 text-sub"
                      }`}
                    >
                      {riskLabel}
                    </span>
                    <span className="block text-xs text-sub">{priorityLabel}</span>
                  </div>
                </div>
                <div className="capitalize text-primary">{claim.status}</div>
                <div>{formatDate(claim.createdAt)}</div>
                <div>
                  <Link
                    href={`/claims/${claim.id}`}
                    className="rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
                  >
                    Review
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredClaims.length === 0 ? (
            <div className="px-5 py-8 text-sm text-sub">
              No claims match your filters.
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
