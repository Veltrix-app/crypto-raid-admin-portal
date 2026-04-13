"use client";

import { useMemo } from "react";
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
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const users = useAdminPortalStore((s) => s.users);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const claims = useAdminPortalStore((s) => s.claims);

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

  const userSubmissions = submissions.filter((submission) => submission.userId === user.authUserId);
  const userClaims = claims.filter((claim) => claim.authUserId === user.authUserId);
  const approvedSubmissions = userSubmissions.filter((submission) => submission.status === "approved").length;
  const pendingSubmissions = userSubmissions.filter((submission) => submission.status === "pending").length;
  const pendingClaims = userClaims.filter((claim) => claim.status === "pending").length;
  const trustPosture =
    user.status === "flagged"
      ? "Heightened review posture"
      : user.trustScore >= 70
        ? "Healthy contributor posture"
        : "Monitor contribution quality";

  return (
    <AdminShell>
      <div className="space-y-6">
        <DetailHero
          eyebrow="Contributor Detail"
          title={user.username}
          description="Trust, contribution and fulfillment signals for this contributor across the current workspace surfaces."
          badges={
            <>
              <DetailBadge tone={user.status === "flagged" ? "danger" : user.status === "active" ? "primary" : "warning"}>
                {user.status}
              </DetailBadge>
              <DetailBadge>{user.contributionTier}</DetailBadge>
              <DetailBadge tone={user.sybilScore >= 70 ? "danger" : "default"}>Sybil {user.sybilScore}</DetailBadge>
              <DetailBadge tone={user.trustScore >= 70 ? "primary" : "warning"}>Trust {user.trustScore}</DetailBadge>
            </>
          }
          metrics={
            <>
              <DetailMetricCard label="XP" value={user.xp} hint="Current experience footprint across tracked activity." />
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
              <DetailMetricCard label="Global Trust" value={user.trustScore} hint="Current trust score driving moderation confidence." />
              <DetailMetricCard label="Sybil Risk" value={user.sybilScore} hint="Higher values mean stronger identity overlap or abuse pressure." />
              <DetailMetricCard label="Pending Claims" value={pendingClaims} hint="Reward requests still waiting on operator action." />
              <DetailMetricCard label="Reputation Rank" value={user.reputationRank} hint="Current relative standing in the reputation model." />
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
                Contribution tier, completion history and trust posture already tell a clear story here. The next layer to add later would be a richer per-project timeline and review history.
              </p>
            </div>
          </DetailSurface>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <DetailSurface
            title="Activity Snapshot"
            description="Recent contribution and reward behavior tied to this contributor."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <DetailMetaRow label="Auth User ID" value={user.authUserId || "-"} />
              <DetailMetaRow label="Title" value={user.title || "-"} />
              <DetailMetaRow label="Submissions" value={userSubmissions.length} />
              <DetailMetaRow label="Claims" value={userClaims.length} />
              <DetailMetaRow label="Approved submissions" value={approvedSubmissions} />
              <DetailMetaRow label="Pending submissions" value={pendingSubmissions} />
            </div>
          </DetailSurface>

          <div className="space-y-6">
            <DetailSidebarSurface title="Reputation Markers">
              <div className="space-y-4">
                <DetailMetaRow label="Contribution Tier" value={user.contributionTier} />
                <DetailMetaRow label="Status" value={user.status} />
                <DetailMetaRow label="Trust score" value={user.trustScore} />
                <DetailMetaRow label="Sybil score" value={user.sybilScore} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Current Gap">
              <p className="text-sm leading-7 text-sub">
                This detail page now shows the trust and activity posture clearly, but a richer contributor timeline and project-by-project reputation breakdown would be the next upgrade if we want this screen to become a full operator dossier.
              </p>
            </DetailSidebarSurface>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
