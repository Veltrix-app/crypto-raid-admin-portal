"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { AdminAuditLog } from "@/types/entities/audit-log";

export default function ClaimDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getClaimById = useAdminPortalStore((s) => s.getClaimById);
  const updateClaimStatus = useAdminPortalStore((s) => s.updateClaimStatus);
  const reviewClaim = useAdminPortalStore((s) => s.reviewClaim);
  const fetchAuditTrail = useAdminPortalStore((s) => s.fetchAuditTrail);
  const users = useAdminPortalStore((s) => s.users);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);

  const claim = useMemo(
    () => getClaimById(params.id),
    [getClaimById, params.id]
  );

  const [working, setWorking] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

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
  const linkedFlags = reviewFlags.filter(
    (flag) => flag.sourceTable === "reward_claims" && flag.sourceId === currentClaim.id
  );
  const primaryFlag = linkedFlags[0];
  const riskLabel =
    user?.status === "flagged"
      ? `Watch • Sybil ${user.sybilScore}`
      : `Trust ${user?.trustScore ?? 50}`;
  const decisionLabel =
    primaryFlag?.flagType.replace(/_/g, " ") ??
    ((currentClaim.rewardCost ?? 0) >= 500
      ? "High value checkpoint"
      : currentClaim.claimMethod === "manual_fulfillment"
        ? "Manual fulfillment"
        : "Standard flow");
  const decisionReason =
    primaryFlag?.reason ??
    ((currentClaim.rewardCost ?? 0) >= 500
      ? "This reward is valuable enough to deserve an additional fulfillment checkpoint before payout."
      : currentClaim.claimMethod === "manual_fulfillment"
        ? "This claim depends on manual delivery by the project team."
        : "This claim can move through the standard fulfillment flow unless other risk signals appear.");

  useEffect(() => {
    setReviewNotes(currentClaim.fulfillmentNotes || "");
  }, [currentClaim.id, currentClaim.fulfillmentNotes]);

  useEffect(() => {
    let active = true;

    async function loadAuditTrail() {
      const logs = await fetchAuditTrail("reward_claims", currentClaim.id);
      if (active) {
        setAuditLogs(logs);
      }
    }

    loadAuditTrail();

    return () => {
      active = false;
    };
  }, [currentClaim.id, fetchAuditTrail]);

  async function handleSetStatus(
    nextStatus: "processing" | "fulfilled" | "rejected"
  ) {
    try {
      setWorking(true);
      await reviewClaim(currentClaim.id, nextStatus, reviewNotes);
      setAuditLogs(await fetchAuditTrail("reward_claims", currentClaim.id));
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
              <Badge>{riskLabel}</Badge>
              <Badge className="capitalize">{currentClaim.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">
              Review the claim details and the automation context before moving it through fulfillment.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="User" value={currentClaim.username} />
          <InfoCard label="Reward" value={currentClaim.rewardTitle} />
          <InfoCard label="Method" value={currentClaim.claimMethod} />
          <InfoCard label="Decision" value={decisionLabel} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Claim Decision Context
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  Why this claim needs attention
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-sub">{decisionReason}</p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <DecisionCard
                label="Automation Route"
                value={decisionLabel}
                tone={(currentClaim.rewardCost ?? 0) >= 500 || linkedFlags.length > 0 ? "review" : "ready"}
              />
              <DecisionCard
                label="Risk Profile"
                value={riskLabel}
                tone={user?.status === "flagged" ? "danger" : "ready"}
              />
            </div>

            {linkedFlags.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-line bg-card2 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Linked Flags
                </p>
                <div className="mt-3 space-y-3">
                  {linkedFlags.map((flag) => (
                    <div key={flag.id} className="rounded-2xl border border-line bg-card px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="capitalize">{flag.flagType.replace(/_/g, " ")}</Badge>
                        <Badge className="capitalize">{flag.severity}</Badge>
                        <Badge className="capitalize">{flag.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-sub">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Claim Actions</h2>
            <p className="mt-2 text-sm text-sub">
              Update fulfillment state after checking both delivery complexity and risk.
            </p>

            <div className="mt-6">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-text">Reviewer Note</span>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                  placeholder="Capture payout checks, delivery decisions or rejection context."
                />
              </label>
            </div>

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
              <DetailRow label="Reviewed By" value={currentClaim.reviewedByAuthUserId || "-"} />
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
              <h2 className="text-xl font-extrabold text-text">Audit Trail</h2>
              <div className="mt-4 space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-line bg-card2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold capitalize text-text">
                        {log.action.replace(/_/g, " ")}
                      </p>
                      <span className="text-xs text-sub">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm text-sub">{log.summary}</p>
                    {log.metadata ? (
                      <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">
                        {log.metadata}
                      </pre>
                    ) : null}
                  </div>
                ))}

                {auditLogs.length === 0 ? (
                  <p className="text-sm text-sub">
                    No audit events stored yet for this claim.
                  </p>
                ) : null}
              </div>
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

function DecisionCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ready" | "review" | "danger";
}) {
  const toneClass =
    tone === "ready"
      ? "bg-primary/15 text-primary"
      : tone === "danger"
        ? "bg-rose-500/15 text-rose-300"
        : "bg-amber-500/15 text-amber-300";

  return (
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <div className="mt-3">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>
          {value}
        </span>
      </div>
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
