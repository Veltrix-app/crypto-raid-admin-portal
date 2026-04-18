"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { createClient } from "@/lib/supabase/client";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import type { DbOnchainEvent, DbRewardDistribution, DbTrustSnapshot } from "@/types/database";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const users = useAdminPortalStore((s) => s.users);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const claims = useAdminPortalStore((s) => s.claims);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const applyTrustAction = useAdminPortalStore((s) => s.applyTrustAction);
  const [trustSnapshots, setTrustSnapshots] = useState<DbTrustSnapshot[]>([]);
  const [rewardDistributions, setRewardDistributions] = useState<DbRewardDistribution[]>([]);
  const [onchainEvents, setOnchainEvents] = useState<DbOnchainEvent[]>([]);
  const [activeTrustAction, setActiveTrustAction] = useState<"watch" | "flag" | "clear" | "restore" | null>(null);

  const user = useMemo(
    () => users.find((item) => item.authUserId === params.id || item.id === params.id),
    [users, params.id]
  );

  if (!user) {
    return (
      <AdminShell>
        <NotFoundState
          title="Contributor not found"
          description="This contributor could not be resolved from the active portal state. They may not belong to the current workspace scope or their profile has not loaded yet."
        />
      </AdminShell>
    );
  }

  const currentUser = user;

  const userSubmissions = submissions.filter((submission) => submission.userId === currentUser.authUserId);
  const userClaims = claims.filter((claim) => claim.authUserId === currentUser.authUserId);
  const approvedSubmissions = userSubmissions.filter((submission) => submission.status === "approved").length;
  const pendingSubmissions = userSubmissions.filter((submission) => submission.status === "pending").length;
  const pendingClaims = userClaims.filter((claim) => claim.status === "pending").length;
  const trustPosture =
    currentUser.status === "flagged"
      ? "Heightened review posture"
      : currentUser.trustScore >= 70
        ? "Healthy contributor posture"
        : "Monitor contribution quality";
  const latestTrustSnapshot = trustSnapshots[0] ?? null;
  const userReviewFlags = reviewFlags
    .filter((flag) => flag.authUserId === currentUser.authUserId)
    .slice(0, 8);
  const openUserReviewFlags = userReviewFlags.filter((flag) => flag.status === "open");
  const claimableDistributions = rewardDistributions.filter(
    (distribution) => distribution.status === "claimable"
  );
  const totalClaimableAmount = claimableDistributions.reduce(
    (sum, distribution) => sum + Number(distribution.reward_amount ?? 0),
    0
  );

  useEffect(() => {
    if (!currentUser.authUserId) {
      return;
    }

    let active = true;
    const supabase = createClient();

    async function loadIdentitySignals() {
      const [{ data: trustRows }, { data: distributionRows }, { data: onchainRows }] =
        await Promise.all([
          supabase
            .from("trust_snapshots")
            .select("*")
            .eq("auth_user_id", currentUser.authUserId)
            .order("created_at", { ascending: false })
            .limit(6),
          supabase
            .from("reward_distributions")
            .select("*")
            .eq("auth_user_id", currentUser.authUserId)
            .order("updated_at", { ascending: false })
            .limit(12),
          supabase
            .from("onchain_events")
            .select("*")
            .eq("auth_user_id", currentUser.authUserId)
            .order("created_at", { ascending: false })
            .limit(12),
        ]);

      if (!active) {
        return;
      }

      setTrustSnapshots((trustRows ?? []) as DbTrustSnapshot[]);
      setRewardDistributions((distributionRows ?? []) as DbRewardDistribution[]);
      setOnchainEvents((onchainRows ?? []) as DbOnchainEvent[]);
    }

    void loadIdentitySignals();

    return () => {
      active = false;
    };
  }, [currentUser.authUserId]);

  async function handleTrustAction(
    action: "watch_wallet" | "flag_user" | "clear_watch" | "restore_user",
    reason: string
  ) {
    if (!currentUser.authUserId) {
      return;
    }

    const nextState =
      action === "watch_wallet"
        ? "watch"
        : action === "flag_user"
          ? "flag"
          : action === "clear_watch"
            ? "clear"
            : "restore";

    try {
      setActiveTrustAction(nextState);
      await applyTrustAction({
        authUserId: currentUser.authUserId,
        action,
        reason,
      });
    } finally {
      setActiveTrustAction(null);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <DetailHero
          eyebrow="Contributor Detail"
          title={currentUser.username}
          description="Trust, contribution and fulfillment signals for this contributor across the current workspace surfaces."
          badges={
            <>
              <DetailBadge tone={currentUser.status === "flagged" ? "danger" : currentUser.status === "active" ? "primary" : "warning"}>
                {currentUser.status}
              </DetailBadge>
              <DetailBadge>{currentUser.contributionTier}</DetailBadge>
              <DetailBadge tone={currentUser.sybilScore >= 70 ? "danger" : "default"}>Sybil {currentUser.sybilScore}</DetailBadge>
              <DetailBadge tone={currentUser.trustScore >= 70 ? "primary" : "warning"}>Trust {currentUser.trustScore}</DetailBadge>
            </>
          }
          metrics={
            <>
              <DetailMetricCard label="XP" value={currentUser.xp} hint="Current experience footprint across tracked activity." />
              <DetailMetricCard label="Approved" value={approvedSubmissions} hint="Submissions that successfully cleared review." />
              <DetailMetricCard label="Pending" value={pendingSubmissions} hint="Submissions still sitting in moderation." />
              <DetailMetricCard label="Claims" value={userClaims.length} hint="Rewards this contributor has attempted to claim." />
            </>
          }
        />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <DetailSurface
            eyebrow="Trust Posture"
            title={trustPosture}
            description="Use this surface to understand whether the contributor is compounding quality or creating moderation drag."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <DetailMetricCard label="Global Trust" value={currentUser.trustScore} hint="Current trust score driving moderation confidence." />
              <DetailMetricCard label="Sybil Risk" value={currentUser.sybilScore} hint="Higher values mean stronger identity overlap or abuse pressure." />
              <DetailMetricCard label="Pending Claims" value={pendingClaims} hint="Reward requests still waiting on operator action." />
              <DetailMetricCard label="Reputation Rank" value={currentUser.reputationRank} hint="Current relative standing in the reputation model." />
              <DetailMetricCard label="Claimable Pools" value={claimableDistributions.length} hint="Campaign distributions this contributor can already claim." />
              <DetailMetricCard label="On-chain Events" value={onchainEvents.length} hint="Recent on-chain events normalized into the AESP intake layer." />
              <DetailMetricCard label="Open flags" value={openUserReviewFlags.length} hint="Trust or fraud flags that still need an operator decision." />
            </div>
          </DetailSurface>

          <DetailSurface
            eyebrow="Operator Read"
            title="Recommended next move"
            description={
              user.status === "flagged"
                ? "Keep this contributor in a tighter review lane and inspect recent proofs before trusting automated approvals."
                : pendingSubmissions > 0 || pendingClaims > 0
                  ? "Clear the pending queue to avoid unnecessary trust drag while the user is still active."
                  : "This contributor currently looks stable. Focus on maintaining progression and reward clarity."
            }
          >
            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-sm leading-7 text-sub">
                Latest trust snapshot score:{" "}
                <span className="font-semibold text-text">
                  {latestTrustSnapshot ? latestTrustSnapshot.score : currentUser.trustScore}
                </span>
                . Claimable campaign balance:{" "}
                <span className="font-semibold text-text">
                  {Number(totalClaimableAmount.toFixed(4))}
                </span>
                . Recent on-chain events tracked:{" "}
                <span className="font-semibold text-text">{onchainEvents.length}</span>. Open flags:{" "}
                <span className="font-semibold text-text">{openUserReviewFlags.length}</span>.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => handleTrustAction("watch_wallet", "Applied from contributor detail operator read.")}
                disabled={activeTrustAction === "watch"}
                className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-bold text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Put wallet on watch
              </button>
              <button
                onClick={() => handleTrustAction("flag_user", "Contributor flagged from contributor detail operator read.")}
                disabled={activeTrustAction === "flag"}
                className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Flag contributor
              </button>
              <button
                onClick={() => handleTrustAction("clear_watch", "Wallet watch cleared from contributor detail operator read.")}
                disabled={activeTrustAction === "clear"}
                className="rounded-2xl border border-line bg-card px-4 py-3 font-bold text-sub disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear watch
              </button>
              <button
                onClick={() => handleTrustAction("restore_user", "Contributor restored from contributor detail operator read.")}
                disabled={activeTrustAction === "restore"}
                className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Restore contributor
              </button>
            </div>
          </DetailSurface>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <DetailSurface
            title="Activity Snapshot"
            description="Recent contribution and reward behavior tied to this contributor."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DetailMetaRow label="Auth User ID" value={currentUser.authUserId || "-"} />
              <DetailMetaRow label="Title" value={currentUser.title || "-"} />
              <DetailMetaRow label="Submissions" value={userSubmissions.length} />
              <DetailMetaRow label="Claims" value={userClaims.length} />
              <DetailMetaRow label="Approved submissions" value={approvedSubmissions} />
              <DetailMetaRow label="Pending submissions" value={pendingSubmissions} />
              <DetailMetaRow label="Claimable distributions" value={claimableDistributions.length} />
              <DetailMetaRow label="On-chain events" value={onchainEvents.length} />
              <DetailMetaRow label="Open trust flags" value={openUserReviewFlags.length} />
            </div>
          </DetailSurface>

          <div className="space-y-6">
            <DetailSidebarSurface title="Reputation Markers">
              <div className="space-y-4">
                <DetailMetaRow label="Contribution Tier" value={currentUser.contributionTier} />
                <DetailMetaRow label="Status" value={currentUser.status} />
                <DetailMetaRow label="Trust score" value={currentUser.trustScore} />
                <DetailMetaRow label="Sybil score" value={currentUser.sybilScore} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Live Trust Snapshot">
              {latestTrustSnapshot ? (
                <div className="space-y-4">
                  <DetailMetaRow label="Score" value={latestTrustSnapshot.score} />
                  <DetailMetaRow
                    label="Captured"
                    value={new Date(latestTrustSnapshot.created_at).toLocaleString()}
                  />
                  <div className="rounded-2xl border border-line bg-card px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Reasons</p>
                    <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">
                      {JSON.stringify(latestTrustSnapshot.reasons ?? {}, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-7 text-sub">
                  No trust snapshot has landed for this contributor yet.
                </p>
              )}
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Claimable Distribution Read">
              <div className="space-y-4">
                <DetailMetaRow label="Claimable lanes" value={claimableDistributions.length} />
                <DetailMetaRow
                  label="Claimable total"
                  value={Number(totalClaimableAmount.toFixed(4))}
                />
                <DetailMetaRow label="Latest asset" value={claimableDistributions[0]?.reward_asset ?? "-"} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Trust & Fraud Flags">
              {userReviewFlags.length > 0 ? (
                <div className="space-y-4">
                  {userReviewFlags.map((flag) => (
                    <div key={flag.id} className="rounded-2xl border border-line bg-card px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                          {flag.flagType.replace(/_/g, " ")}
                        </span>
                        <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                          {flag.status}
                        </span>
                        <span className="rounded-full border border-line px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-sub">
                          {flag.severity}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-sub">{flag.reason}</p>
                      {flag.metadata ? (
                        <pre className="mt-3 whitespace-pre-wrap break-all text-xs text-sub">{flag.metadata}</pre>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-sub">
                  No trust or fraud flags have been raised for this contributor yet.
                </p>
              )}
            </DetailSidebarSurface>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
