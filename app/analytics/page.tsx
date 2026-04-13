"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import {
  OpsHero,
  OpsMetricCard,
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import EngagementChart from "@/components/charts/engagement/EngagementChart";
import RewardsChart from "@/components/charts/rewards/RewardsChart";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { DbVerificationResult } from "@/types/database";
import { AdminVerificationResult } from "@/types/entities/verification-result";

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
  const [verificationResults, setVerificationResults] = useState<AdminVerificationResult[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadVerificationResults() {
      let query = supabase.from("verification_results").select("*").order("created_at", { ascending: false });

      if (role !== "super_admin" && activeProjectId) {
        query = query.eq("project_id", activeProjectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Verification analytics load skipped:", error.message);
        if (active) setVerificationResults([]);
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
  const pendingVerificationCount = verificationResults.filter((item) => item.decisionStatus === "pending").length;
  const rejectedVerificationCount = verificationResults.filter((item) => item.decisionStatus === "rejected").length;
  const duplicateSignalCount = verificationResults.filter((item) => item.duplicateSignalTypes.length > 0).length;
  const averageConfidence = verificationResults.length
    ? Math.round(verificationResults.reduce((sum, item) => sum + item.confidenceScore, 0) / verificationResults.length)
    : 0;
  const autoApproveRate = verificationResults.length
    ? Math.round((autoApprovedCount / verificationResults.length) * 100)
    : 0;

  const questsById = useMemo(() => new Map(quests.map((quest) => [quest.id, quest])), [quests]);

  const campaignHealth = useMemo(() => {
    return campaigns
      .map((campaign) => {
        const campaignQuests = quests.filter((quest) => quest.campaignId === campaign.id);
        const campaignQuestIds = new Set(campaignQuests.map((quest) => quest.id));
        const campaignSubmissions = submissions.filter((submission) => campaignQuestIds.has(submission.questId));
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
                campaignVerificationResults.reduce((sum, item) => sum + item.confidenceScore, 0) /
                  campaignVerificationResults.length
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
        const questVerificationResults = verificationResults.filter((result) => result.questId === quest.id);

        return {
          id: quest.id,
          title: quest.title,
          verificationType: quest.verificationType,
          submissions: questSubmissions.length,
          pending: questSubmissions.filter((item) => item.status === "pending").length,
          rejected: questSubmissions.filter((item) => item.status === "rejected").length,
          duplicates: questVerificationResults.filter((item) => item.duplicateSignalTypes.length > 0).length,
          openFlags: questFlags.filter((flag) => flag.status === "open").length,
          configRisk: questVerificationResults.filter((item) => item.missingConfigKeys.length > 0).length,
        };
      })
      .filter((item) => item.submissions > 0 || item.openFlags > 0)
      .sort((a, b) => b.pending + b.openFlags + b.duplicates - (a.pending + a.openFlags + a.duplicates))
      .slice(0, 6);
  }, [quests, submissions, reviewFlags, verificationResults]);

  const verificationRoutes = summarizeByLabel(verificationResults.map((item) => humanize(item.route)));
  const reviewFlagCount = reviewFlags.filter((flag) => flag.status === "open").length;

  return (
    <AdminShell>
      <div className="space-y-6">
        <OpsHero
          eyebrow="Intelligence Board"
          title="Analytics"
          description="Live intelligence board for conversion, trust, verification throughput and review drag."
          aside={
            <div className="grid grid-cols-2 gap-2">
              <IntelChip label="Auto approve" value={`${autoApproveRate}%`} tone={autoApproveRate >= 60 ? "success" : "warning"} />
              <IntelChip label="Avg confidence" value={`${averageConfidence}%`} tone={averageConfidence >= 70 ? "success" : "warning"} />
            </div>
          }
        />

        <section className="rounded-[32px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(186,255,59,0.10),transparent_28%),linear-gradient(180deg,rgba(11,18,30,0.98),rgba(8,12,20,0.98))] p-6 shadow-[0_25px_90px_rgba(0,0,0,0.38)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Telemetry grid</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-text">
                Performance and risk readout
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-sub">
                The key system signals an operator needs before drilling into campaign or trust detail.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Live dataset</p>
              <p className="mt-2 text-lg font-extrabold text-text">{verificationResults.length} verification records</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
            <OpsMetricCard label="Tracked users" value={totalUsers.toLocaleString()} />
            <OpsMetricCard label="Campaigns" value={campaigns.length} />
            <OpsMetricCard label="Claims" value={claims.length} />
            <OpsMetricCard label="Auto approved" value={autoApprovedCount} emphasis="primary" />
            <OpsMetricCard label="Needs review" value={pendingVerificationCount} emphasis={pendingVerificationCount > 0 ? "warning" : "default"} />
            <OpsMetricCard label="Rejected" value={rejectedVerificationCount} emphasis={rejectedVerificationCount > 0 ? "warning" : "default"} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <IntelStrip label="Duplicate signals" value={duplicateSignalCount} tone={duplicateSignalCount > 0 ? "danger" : "success"} />
            <IntelStrip label="Open review flags" value={reviewFlagCount} tone={reviewFlagCount > 0 ? "warning" : "success"} />
            <IntelStrip label="Reward inventory" value={rewards.length} tone="default" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <OpsPanel
            eyebrow="Conversion board"
            title="Campaign health"
            description="Completion trend versus actual submission volume for the campaigns doing the most work."
            tone="accent"
          >
            <div className="mt-5">
              <EngagementChart
                items={campaignHealth.slice(0, 6).map((campaign) => ({
                  label: campaign.title,
                  value: campaign.submissions || campaign.completionRate,
                }))}
              />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Verification board"
            title="Decision funnel"
            description="How much of the current quest volume Veltrix is routing without project-owner review."
          >
            <div className="mt-5">
              <RewardsChart
                items={[
                  { label: "Auto approved", value: autoApprovedCount },
                  { label: "Needs review", value: pendingVerificationCount },
                  { label: "Rejected", value: rejectedVerificationCount },
                ]}
              />
            </div>
          </OpsPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <OpsPanel
            eyebrow="Route monitor"
            title="Verification route mix"
            description="Which decision paths currently account for the most volume."
          >
            <div className="space-y-3">
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
          </OpsPanel>

          <OpsPanel
            eyebrow="Hotspot board"
            title="Quest review load"
            description="These quests are creating the most moderator drag right now."
          >
            <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
              <div className="grid grid-cols-7 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
                <div>Quest</div>
                <div>Verification</div>
                <div>Submissions</div>
                <div>Pending</div>
                <div>Flags</div>
                <div>Duplicates</div>
                <div>Config risk</div>
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
                  No quest review hotspots yet. As submissions flow in, this will highlight where teams still spend manual effort.
                </div>
              ) : null}
            </div>
          </OpsPanel>
        </div>

        <OpsPanel
          eyebrow="Campaign intel"
          title="Campaign operations snapshot"
          description="A denser owner-facing read on throughput, approvals and confidence by campaign."
        >
          <div className="grid gap-4 xl:grid-cols-3">
            {campaignHealth.slice(0, 6).map((campaign) => (
              <div key={campaign.id} className="rounded-[24px] border border-line bg-card2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{campaign.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-sub">
                      {campaign.submissions} submissions
                    </p>
                  </div>
                  <OpsStatusPill tone={campaign.averageConfidence >= 70 ? "success" : "warning"}>
                    {campaign.averageConfidence}% confidence
                  </OpsStatusPill>
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
        </OpsPanel>

        <div className="flex gap-3">
          <Link href="/analytics/engagement" className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold">
            Engagement
          </Link>
          <Link href="/analytics/rewards" className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold">
            Rewards
          </Link>
          <Link href="/analytics/users" className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold">
            Users
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}

function IntelChip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "success";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
      : tone === "success"
        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
        : "border-white/10 bg-white/[0.05] text-text";

  return (
    <div className={`rounded-[18px] border px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-75">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function IntelStrip({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const barClass =
    tone === "warning"
      ? "bg-amber-300"
      : tone === "danger"
        ? "bg-rose-300"
        : tone === "success"
          ? "bg-emerald-300"
          : "bg-cyan-300";

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
        <p className="text-lg font-extrabold text-text">{value}</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${Math.min(100, Math.max(12, value * 8))}%` }} />
      </div>
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
