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

  async function handleSetStatus(
  nextStatus: "processing" | "fulfilled" | "rejected"
) {
  if (!claim) return;

  try {
    setWorking(true);
    await updateClaimStatus(claim.id, nextStatus);
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
              {claim.rewardTitle}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{claim.username}</Badge>
              {claim.projectName ? <Badge>{claim.projectName}</Badge> : null}
              {claim.campaignTitle ? <Badge>{claim.campaignTitle}</Badge> : null}
              <Badge className="capitalize">{claim.claimMethod}</Badge>
              <Badge className="capitalize">{claim.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">
              Move this reward claim through processing, fulfillment or rejection.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="User" value={claim.username} />
          <InfoCard label="Reward" value={claim.rewardTitle} />
          <InfoCard label="Method" value={claim.claimMethod} />
          <InfoCard label="Status" value={claim.status} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Claim Actions</h2>
            <p className="mt-2 text-sm text-sub">
              Update fulfillment state for this reward claim.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => handleSetStatus("processing")}
                disabled={working || claim.status === "processing"}
                className="rounded-2xl bg-amber-300 px-5 py-3 font-bold text-black disabled:opacity-50"
              >
                {working ? "Working..." : "Mark Processing"}
              </button>

              <button
                onClick={() => handleSetStatus("fulfilled")}
                disabled={working || claim.status === "fulfilled"}
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-bold text-black disabled:opacity-50"
              >
                {working ? "Working..." : "Mark Fulfilled"}
              </button>

              <button
                onClick={() => handleSetStatus("rejected")}
                disabled={working || claim.status === "rejected"}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 font-bold text-rose-300 disabled:opacity-50"
              >
                {working ? "Working..." : "Reject Claim"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Claim Data</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Claim ID" value={claim.id} />
                <DetailRow label="Auth User ID" value={claim.authUserId || "-"} />
                <DetailRow label="Reward ID" value={claim.rewardId} />
                <DetailRow label="Project ID" value={claim.projectId || "-"} />
                <DetailRow label="Campaign ID" value={claim.campaignId || "-"} />
                <DetailRow label="Created At" value={formatDate(claim.createdAt)} />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Fulfillment Note</h2>
              <p className="mt-2 text-sm text-sub">
                Delivery instructions and reviewer notes can be added in the next schema step.
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