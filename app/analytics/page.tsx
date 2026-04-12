"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import EngagementChart from "@/components/charts/engagement/EngagementChart";
import RewardsChart from "@/components/charts/rewards/RewardsChart";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { AdminVerificationResult } from "@/types/entities/verification-result";
import { DbVerificationResult } from "@/types/database";

export default function AnalyticsPage() {
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const claims = useAdminPortalStore((s) => s.claims);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const [verificationResults, setVerificationResults] = useState<
    AdminVerificationResult[]
  >([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadVerificationResults() {
      let query = supabase
        .from("verification_results")
        .select("*")
        .order("created_at", { ascending: false });

      if (role !== "super_admin" && activeProjectId) {
        query = query.eq("project_id", activeProjectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Verification analytics load skipped:", error.message);
        if (active) {
          setVerificationResults([]);
        }
        return;
      }

      if (!active) return;

      setVerificationResults(
        ((data ?? []) as DbVerificationResult[]).map((row) => ({
          id: row.id,
          authUserId: row.auth_user_id ?? undefined,
          projectId: row.project_id ?? undefined,
          questId: row.quest_id ?? undefined,
          sourceTable: row.source_table,
          sourceId: row.source_id,
          verificationType: row.verification_type,
          route: row.route,
          decisionStatus: row.decision_status,
          decisionReason: row.decision_reason,
          confidenceScore: row.confidence_score,
          requiredConfigKeys: row.required_config_keys ?? [],
          missingConfigKeys: row.missing_config_keys ?? [],
          duplicateSignalTypes: row.duplicate_signal_types ?? [],
          metadata: row.metadata ? JSON.stringify(row.metadata, null, 2) : undefined,
          createdAt: row.created_at,
        }))
      );
    }

    loadVerificationResults();

    return () => {
      active = false;
    };
  }, [activeProjectId, role]);

  const totalUsers = projects.reduce((sum, project) => sum + project.members, 0);
  const autoApprovedCount = verificationResults.filter(
    (item) => item.route === "rule_auto_approved" || item.decisionStatus === "approved"
  ).length;
  const pendingVerificationCount = verificationResults.filter(
    (item) => item.decisionStatus === "pending"
  ).length;
  const rejectedVerificationCount = verificationResults.filter(
    (item) => item.decisionStatus === "rejected"
  ).length;
  const duplicateSignalCount = verificationResults.filter(
    (item) => item.duplicateSignalTypes.length > 0
  ).length;
  const averageConfidence = verificationResults.length
    ? Math.round(
        verificationResults.reduce((sum, item) => sum + item.confidenceScore, 0) /
          verificationResults.length
      )
    : 0;
  const autoApproveRate = verificationResults.length
    ? Math.round((autoApprovedCount / verificationResults.length) * 100)
    : 0;

  const questsById = useMemo(
    () => new Map(quests.map((quest) => [quest.id, quest])),
    [quests]
  );

  const campaignHealth = useMemo(() => {
    return campaigns
      .map((campaign) => {
        const campaignQuests = quests.filter((quest) => quest.campaignId === campaign.id);
        const campaignQuestIds = new Set(campaignQuests.map((quest) => quest.id));
        const campaignSubmissions = submissions.filter((submission) =>
          campaignQuestIds.has(submission.questId)
        );
        const campaignVerificationResults = verificationResults.filter((result) => {
          const quest = result.questId ? questsById.get(result.questId) : undefined;
          return quest?.campaignId === campaign.id;
        });

        return {
          id: campaign.id,
          title: campaign.title,
          participants: campaign.participants,
          completionRate: campaign.completionRate,
          submissions: campaignSubmissions.length,
          approved: campaignSubmissions.filter((item) => item.status === "approved").length,
          pending: campaignSubmissions.filter((item) => item.status === "pending").length,
          rejected: campaignSubmissions.filter((item) => item.status === "rejected").length,
          autoApproved: campaignVerificationResults.filter(
            (item) => item.route === "rule_auto_approved" || item.decisionStatus === "approved"
          ).length,
          averageConfidence: campaignVerificationResults.length
            ? Math.round(
                campaignVerificationResults.reduce(
                  (sum, item) => sum + item.confidenceScore,
                  0
                ) / campaignVerificationResults.length
              )
            : 0,
        };
      })
      .sort((a, b) => b.submissions - a.submissions || b.completionRate - a.completionRate);
  }, [campaigns, quests, submissions, verificationResults, questsById]);

  const questReviewLoad = useMemo(() => {
    return quests
      .map((quest) => {
        const questSubmissions = submissions.filter((submission) => submission.questId === quest.id);
        const questFlags = reviewFlags.filter(
          (flag) =>
            flag.sourceTable === "quest_submissions" &&
            questSubmissions.some((submission) => submission.id === flag.sourceId)
        );
        const questVerificationResults = verificationResults.filter(
          (result) => result.questId === quest.id
        );

        return {
          id: quest.id,
          title: quest.title,
          verificationType: quest.verificationType,
          submissions: questSubmissions.length,
          pending: questSubmissions.filter((item) => item.status === "pending").length,
          rejected: questSubmissions.filter((item) => item.status === "rejected").length,
          duplicates: questVerificationResults.filter(
            (item) => item.duplicateSignalTypes.length > 0
          ).length,
          openFlags: questFlags.filter((flag) => flag.status === "open").length,
          configRisk: questVerificationResults.filter(
            (item) => item.missingConfigKeys.length > 0
          ).length,
        };
      })
      .filter((item) => item.submissions > 0 || item.openFlags > 0)
      .sort(
        (a, b) =>
          b.pending +
          b.openFlags +
          b.duplicates -
          (a.pending + a.openFlags + a.duplicates)
      )
      .slice(0, 6);
  }, [quests, submissions, reviewFlags, verificationResults]);

  const moderationHealth = [
    {
      label: "Pending",
      value: submissions.filter((s) => s.status === "pending").length,
    },
    {
      label: "Approved",
      value: submissions.filter((s) => s.status === "approved").length,
    },
    {
      label: "Rejected",
      value: submissions.filter((s) => s.status === "rejected").length,
    },
  ];

  const verificationRoutes = summarizeByLabel(
    verificationResults.map((item) => humanize(item.route))
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Performance Analytics
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Analytics</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-sub">
              This layer focuses on campaign health, verification throughput and review load so
              project owners can see where Veltrix is auto-handling work and where humans are still
              getting dragged in.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/analytics/engagement"
              className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
            >
              Engagement
            </Link>
            <Link
              href="/analytics/rewards"
              className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
            >
              Rewards
            </Link>
            <Link
              href="/analytics/users"
              className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
            >
              Users
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Card label="Tracked Users" value={totalUsers.toLocaleString()} />
          <Card label="Campaigns" value={campaigns.length} />
          <Card label="Rewards" value={rewards.length} />
          <Card label="Claims" value={claims.length} />
          <Card label="Auto-Approve Rate" value={`${autoApproveRate}%`} />
          <Card label="Avg Confidence" value={`${averageConfidence}%`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Campaign Health</h2>
            <p className="mt-2 text-sm text-sub">
              Completion trend versus actual submission volume per campaign.
            </p>
            <div className="mt-5">
              <EngagementChart
                items={campaignHealth.slice(0, 6).map((campaign) => ({
                  label: campaign.title,
                  value: campaign.submissions || campaign.completionRate,
                }))}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Verification Funnel</h2>
            <p className="mt-2 text-sm text-sub">
              How much of the current quest volume Veltrix is auto-routing without owner review.
            </p>
            <div className="mt-5">
              <RewardsChart
                items={[
                  { label: "Auto Approved", value: autoApprovedCount },
                  { label: "Needs Review", value: pendingVerificationCount },
                  { label: "Rejected", value: rejectedVerificationCount },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Moderation Health</h2>
            <div className="mt-5">
              <RewardsChart items={moderationHealth} />
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <MetricPill
                label="Duplicate Signals"
                value={duplicateSignalCount}
                hint="Submissions with shared proof or wallet overlap."
              />
              <MetricPill
                label="Open Review Flags"
                value={reviewFlags.filter((flag) => flag.status === "open").length}
                hint="Total unresolved moderation or abuse alerts."
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Verification Routes</h2>
            <p className="mt-2 text-sm text-sub">
              Which decision paths are currently driving the most volume.
            </p>
            <div className="mt-5 space-y-3">
              {verificationRoutes.length > 0 ? (
                verificationRoutes.map((item) => (
                  <RouteRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    share={verificationResults.length ? Math.round((item.value / verificationResults.length) * 100) : 0}
                  />
                ))
              ) : (
                <p className="text-sm text-sub">
                  Verification route metrics will appear here as new submission decisions come in.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-text">Quest Review Load</h2>
              <p className="mt-2 text-sm text-sub">
                These quests are creating the most moderator work right now.
              </p>
            </div>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              Foundation
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] border border-line bg-card2">
            <div className="grid grid-cols-7 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
              <div>Quest</div>
              <div>Verification</div>
              <div>Submissions</div>
              <div>Pending</div>
              <div>Flags</div>
              <div>Duplicates</div>
              <div>Config Risk</div>
            </div>

            {questReviewLoad.map((quest) => (
              <div
                key={quest.id}
                className="grid grid-cols-7 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
              >
                <div className="font-semibold">{quest.title}</div>
                <div className="capitalize">{humanize(quest.verificationType)}</div>
                <div>{quest.submissions}</div>
                <div>{quest.pending}</div>
                <div>{quest.openFlags}</div>
                <div>{quest.duplicates}</div>
                <div>{quest.configRisk}</div>
              </div>
            ))}

            {questReviewLoad.length === 0 ? (
              <div className="px-5 py-8 text-sm text-sub">
                No quest review hotspots yet. As submissions flow in, this will highlight where
                projects are still spending manual effort.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Campaign Operations Snapshot</h2>
          <p className="mt-2 text-sm text-sub">
            A quick owner-facing view of campaign throughput, approvals and confidence.
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {campaignHealth.slice(0, 6).map((campaign) => (
              <div key={campaign.id} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{campaign.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-sub">
                      {campaign.submissions} submissions
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                    {campaign.averageConfidence}% confidence
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <SnapshotStat label="Approved" value={campaign.approved} />
                  <SnapshotStat label="Pending" value={campaign.pending} />
                  <SnapshotStat label="Rejected" value={campaign.rejected} />
                  <SnapshotStat label="Auto" value={campaign.autoApproved} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-text">{value}</p>
    </div>
  );
}

function MetricPill({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}

function RouteRow({
  label,
  value,
  share,
}: {
  label: string;
  value: number;
  share: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-text">{label}</p>
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">
          {value} ({share}%)
        </span>
      </div>
    </div>
  );
}

function SnapshotStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-lg font-extrabold text-text">{value}</p>
    </div>
  );
}

function humanize(value: string) {
  return value.replace(/_/g, " ");
}

function summarizeByLabel(labels: string[]) {
  const counts = labels.reduce((acc, label) => {
    acc.set(label, (acc.get(label) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
