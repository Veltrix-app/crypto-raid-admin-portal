"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getClaimById = useAdminPortalStore((s) => s.getClaimById);
  const updateClaimStatus = useAdminPortalStore((s) => s.updateClaimStatus);
  const users = useAdminPortalStore((s) => s.users);

  const claim = useMemo(
    () => getClaimById(params.id),
    [getClaimById, params.id]
  );

  const [working, setWorking] = useState(false);

  if (!claim) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Claim not found</h1>
          <p className="mt-2 text-sm text-sub">
            This reward claim could not be found in the admin portal store.
          </p>
        </div>
      </AdminShell>
    );
  }

  const currentClaim = claim;

  const user = users.find((item) => item.authUserId === currentClaim.authUserId);
  const riskLabel =
    user?.status === "flagged"
      ? `Watch • Sybil ${user.sybilScore}`
      : `Trust ${user?.trustScore ?? 50}`;
  const claimReadinessItems = [
    {
      label: "Risk",
      value: riskLabel,
      complete: user?.status !== "flagged",
    },
    {
      label: "Value",
      value:
        typeof currentClaim.rewardCost === "number" ? `${currentClaim.rewardCost} XP` : "Unknown",
      complete: (currentClaim.rewardCost ?? 0) < 500,
    },
    {
      label: "Fulfillment Mode",
      value: currentClaim.claimMethod.replace(/_/g, " "),
      complete: currentClaim.claimMethod !== "manual_fulfillment",
    },
    {
      label: "Current Status",
      value: currentClaim.status,
      complete: currentClaim.status === "fulfilled",
    },
  ];

  async function handleSetStatus(
    nextStatus: "processing" | "fulfilled" | "rejected"
  ) {
    try {
      setWorking(true);
      await updateClaimStatus(currentClaim.id, nextStatus);
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Claim Review
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {currentClaim.rewardTitle}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{currentClaim.username}</Badge>
              {currentClaim.projectName ? <Badge>{currentClaim.projectName}</Badge> : null}
              {currentClaim.campaignTitle ? <Badge>{currentClaim.campaignTitle}</Badge> : null}
              {currentClaim.rewardType ? <Badge className="capitalize">{currentClaim.rewardType}</Badge> : null}
              <Badge className="capitalize">{currentClaim.claimMethod}</Badge>
              <Badge className="capitalize">{currentClaim.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">
              Move this reward claim through processing, fulfillment or rejection.
              High-risk or high-value claims should usually be checked before you mark them fulfilled.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="User" value={currentClaim.username} />
          <InfoCard label="Reward" value={currentClaim.rewardTitle} />
          <InfoCard label="Method" value={currentClaim.claimMethod} />
          <InfoCard label="Risk" value={riskLabel} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Claim Readiness
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  What this fulfillment needs
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {claimReadinessItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-line bg-card2 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                        item.complete
                          ? "bg-primary/15 text-primary"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.complete ? "Ready" : "Review"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-sub capitalize">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Claim Actions</h2>
            <p className="mt-2 text-sm text-sub">
              Update fulfillment state for this reward claim.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => handleSetStatus("processing")}
                disabled={working || currentClaim.status === "processing"}
                className="rounded-2xl bg-amber-300 px-5 py-3 font-bold text-black disabled:opacity-50"
              >
                {working ? "Working..." : "Mark Processing"}
              </button>

              <button
                onClick={() => handleSetStatus("fulfilled")}
                disabled={working || currentClaim.status === "fulfilled"}
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black disabled:opacity-50"
              >
                {working ? "Working..." : "Mark Fulfilled"}
              </button>

              <button
                onClick={() => handleSetStatus("rejected")}
                disabled={working || currentClaim.status === "rejected"}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-bold text-rose-300 disabled:opacity-50"
              >
                {working ? "Working..." : "Reject Claim"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-card2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Fulfillment Guidance
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">
                Claims with manual fulfillment, flagged users or expensive rewards should usually move through
                processing first so the project team can verify eligibility and delivery details.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Claim Data</h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DetailRow label="Claim ID" value={currentClaim.id} />
              <DetailRow label="Auth User ID" value={currentClaim.authUserId || "-"} />
              <DetailRow label="Reward ID" value={currentClaim.rewardId} />
              <DetailRow label="Reward Type" value={currentClaim.rewardType || "-"} />
              <DetailRow
                label="Reward Cost"
                value={typeof currentClaim.rewardCost === "number" ? `${currentClaim.rewardCost} XP` : "-"}
              />
              <DetailRow label="Project ID" value={currentClaim.projectId || "-"} />
              <DetailRow label="Campaign ID" value={currentClaim.campaignId || "-"} />
              <DetailRow label="Created At" value={formatDate(currentClaim.createdAt)} />
              <DetailRow label="Updated At" value={currentClaim.updatedAt ? formatDate(currentClaim.updatedAt) : "-"} />
              <DetailRow label="Reviewed At" value={currentClaim.reviewedAt ? formatDate(currentClaim.reviewedAt) : "-"} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Fulfillment Note</h2>
              <p className="mt-2 text-sm text-sub">
                {currentClaim.fulfillmentNotes || "No reviewer notes stored yet for this claim."}
              </p>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Delivery Payload</h2>
              <p className="mt-2 whitespace-pre-wrap break-all text-sm text-sub">
                {currentClaim.deliveryPayload || "No delivery payload stored yet for this claim."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold capitalize text-text">{value}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
        {label}
      </p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function Badge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`rounded-full border border-line bg-card2 px-3 py-1 text-xs font-bold text-text ${className}`}
    >
      {children}
    </span>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
