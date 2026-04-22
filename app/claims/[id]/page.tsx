"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { InlineEmptyNotice, NotFoundState } from "@/components/layout/state/StatePrimitives";
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

  const currentClaim = claim ?? null;
  const currentClaimId = currentClaim?.id ?? "";
  const rewardCost = currentClaim?.rewardCost ?? 0;
  const claimMethod = currentClaim?.claimMethod ?? "manual_fulfillment";
  const user = users.find((item) => item.authUserId === currentClaim?.authUserId);
  const linkedFlags = reviewFlags.filter(
    (flag) => flag.sourceTable === "reward_claims" && flag.sourceId === currentClaimId
  );
  const primaryFlag = linkedFlags[0];
  const riskLabel =
    user?.status === "flagged"
      ? `Watch • Sybil ${user.sybilScore}`
      : `Trust ${user?.trustScore ?? 50}`;
  const decisionLabel =
    primaryFlag?.flagType.replace(/_/g, " ") ??
    (rewardCost >= 500
      ? "High value checkpoint"
      : claimMethod === "manual_fulfillment"
        ? "Manual fulfillment"
        : "Standard flow");
  const decisionReason =
    primaryFlag?.reason ??
    (rewardCost >= 500
      ? "This reward is valuable enough to deserve an additional fulfillment checkpoint before payout."
      : claimMethod === "manual_fulfillment"
        ? "This claim depends on manual delivery by the project team."
        : "This claim can move through the standard fulfillment flow unless other risk signals appear.");

  useEffect(() => {
    setReviewNotes(currentClaim?.fulfillmentNotes || "");
  }, [currentClaim?.fulfillmentNotes, currentClaimId]);

  useEffect(() => {
    if (!currentClaim) {
      setAuditLogs([]);
      return;
    }

    let active = true;

    async function loadAuditTrail() {
      const logs = await fetchAuditTrail("reward_claims", currentClaimId);
      if (active) {
        setAuditLogs(logs);
      }
    }

    loadAuditTrail();

    return () => {
      active = false;
    };
  }, [currentClaim, currentClaimId, fetchAuditTrail]);

  if (!currentClaim) {
    return (
      <AdminShell>
        <NotFoundState
          title="Claim not found"
          description="This reward claim could not be resolved from the active portal state. It may have moved out of scope or not have loaded into the current workspace."
        />
      </AdminShell>
    );
  }

  async function handleSetStatus(
    nextStatus: "processing" | "fulfilled" | "rejected"
  ) {
    if (!currentClaim) {
      return;
    }

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
        <DetailHero
          eyebrow="Claim Review"
          title={currentClaim.rewardTitle}
          description="Review the claim, its risk posture and the delivery complexity before moving fulfillment forward."
          badges={
            <>
              <DetailBadge>{currentClaim.username}</DetailBadge>
              {currentClaim.projectName ? <DetailBadge>{currentClaim.projectName}</DetailBadge> : null}
              {currentClaim.campaignTitle ? <DetailBadge>{currentClaim.campaignTitle}</DetailBadge> : null}
              {currentClaim.rewardType ? <DetailBadge>{currentClaim.rewardType}</DetailBadge> : null}
              <DetailBadge tone={user?.status === "flagged" ? "danger" : "default"}>{riskLabel}</DetailBadge>
              <DetailBadge tone={currentClaim.status === "fulfilled" ? "primary" : currentClaim.status === "rejected" ? "danger" : "warning"}>
                {currentClaim.status}
              </DetailBadge>
            </>
          }
          metrics={
            <>
              <DetailMetricCard label="User" value={currentClaim.username} hint="Claimant currently attached to this reward payout." />
              <DetailMetricCard label="Reward" value={currentClaim.rewardTitle} hint="Payout target being processed." />
              <DetailMetricCard label="Method" value={currentClaim.claimMethod} hint="Fulfillment method currently configured." />
              <DetailMetricCard label="Decision" value={decisionLabel} hint="Primary checkpoint or automation posture." />
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DetailSurface
            title="Claim Decision Context"
            description={decisionReason}
          >
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
              <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  Linked Flags
                </p>
                <div className="mt-3 space-y-3">
                  {linkedFlags.map((flag) => (
                    <div key={flag.id} className="rounded-2xl border border-line bg-card px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <DetailBadge>{flag.flagType.replace(/_/g, " ")}</DetailBadge>
                        <DetailBadge tone="warning">{flag.severity}</DetailBadge>
                        <DetailBadge>{flag.status}</DetailBadge>
                      </div>
                      <p className="mt-3 text-sm text-sub">{flag.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </DetailSurface>

          <DetailSurface
            title="Claim Actions"
            description="Update fulfillment state after checking both delivery complexity and risk."
          >
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
          </DetailSurface>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <DetailSurface
            title="Claim Data"
            description="Core payout, claimant and review metadata for this claim."
          >
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <DetailMetaRow label="Claim ID" value={currentClaim.id} />
              <DetailMetaRow label="Auth User ID" value={currentClaim.authUserId || "-"} />
              <DetailMetaRow label="Reward ID" value={currentClaim.rewardId} />
              <DetailMetaRow label="Reward Type" value={currentClaim.rewardType || "-"} />
              <DetailMetaRow
                label="Reward Cost"
                value={typeof currentClaim.rewardCost === "number" ? `${currentClaim.rewardCost} XP` : "-"}
              />
              <DetailMetaRow label="Project ID" value={currentClaim.projectId || "-"} />
              <DetailMetaRow label="Campaign ID" value={currentClaim.campaignId || "-"} />
              <DetailMetaRow label="Created At" value={formatDate(currentClaim.createdAt)} />
              <DetailMetaRow label="Reviewed By" value={currentClaim.reviewedByAuthUserId || "-"} />
              <DetailMetaRow label="Updated At" value={currentClaim.updatedAt ? formatDate(currentClaim.updatedAt) : "-"} />
              <DetailMetaRow label="Reviewed At" value={currentClaim.reviewedAt ? formatDate(currentClaim.reviewedAt) : "-"} />
            </div>
          </DetailSurface>

          <div className="space-y-6">
            <DetailSidebarSurface title="Fulfillment Note">
              {currentClaim.fulfillmentNotes ? (
                <p className="mt-2 text-sm text-sub">{currentClaim.fulfillmentNotes}</p>
              ) : (
                <InlineEmptyNotice
                  title="No reviewer notes stored yet"
                  description="This claim does not have any fulfillment notes attached yet."
                />
              )}
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Delivery Payload">
              {currentClaim.deliveryPayload ? (
                <pre className="mt-2 whitespace-pre-wrap break-all text-xs text-sub">
                  {currentClaim.deliveryPayload}
                </pre>
              ) : (
                <InlineEmptyNotice
                  title="No delivery payload stored yet"
                  description="This claim does not currently expose additional payout payload data."
                />
              )}
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Audit Trail">
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
                  <InlineEmptyNotice
                    title="No audit events stored yet"
                    description="This claim has not written any review or fulfillment events into the audit trail yet."
                  />
                ) : null}
              </div>
            </DetailSidebarSurface>
          </div>
        </div>
      </div>
    </AdminShell>
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
