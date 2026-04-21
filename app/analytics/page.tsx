"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsMetricCard,
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import EngagementChart from "@/components/charts/engagement/EngagementChart";
import RewardsChart from "@/components/charts/rewards/RewardsChart";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { createClient } from "@/lib/supabase/client";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { DbVerificationResult } from "@/types/database";
import { AdminVerificationResult } from "@/types/entities/verification-result";

type MetricSummary = {
  latestSnapshotDate: string | null;
  metrics: Array<{
    key: string;
    label: string;
    section: string;
    unit: string;
    value: number;
    healthState: string;
    points: Array<{ date: string; value: number; healthState: string }>;
  }>;
};

export default function AnalyticsPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const claims = useAdminPortalStore((s) => s.claims);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const role = useAdminAuthStore((s) => s.role);
  const [verificationResults, setVerificationResults] = useState<AdminVerificationResult[]>([]);
  const [platformSummary, setPlatformSummary] = useState<MetricSummary | null>(null);
  const [projectSummary, setProjectSummary] = useState<MetricSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<"outcomes" | "campaigns" | "verification">(
    "outcomes"
  );

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

    async function loadMetricSummaries() {
      try {
        const [platformResponse, projectResponse] = await Promise.all([
          fetch("/api/analytics/platform-summary", { cache: "no-store" }),
          activeProjectId
            ? fetch(`/api/analytics/project-summary?projectId=${activeProjectId}`, {
                cache: "no-store",
              })
            : Promise.resolve(null),
        ]);

        const platformPayload = (await platformResponse.json().catch(() => null)) as
          | { ok?: boolean; summary?: MetricSummary; error?: string }
          | null;

        if (!platformResponse.ok || !platformPayload?.ok || !platformPayload.summary) {
          throw new Error(
            platformPayload && typeof platformPayload.error === "string"
              ? platformPayload.error
              : "Failed to load platform analytics summary."
          );
        }

        const projectPayload =
          projectResponse &&
          ((await projectResponse.json().catch(() => null)) as
            | { ok?: boolean; summary?: MetricSummary; error?: string }
            | null);

        if (!active) return;
        setPlatformSummary(platformPayload.summary);
        setProjectSummary(projectPayload?.ok ? projectPayload.summary ?? null : null);
        setSummaryError(null);
      } catch (error) {
        if (!active) return;
        setPlatformSummary(null);
        setProjectSummary(null);
        setSummaryError(
          error instanceof Error ? error.message : "Failed to load analytics summaries."
        );
      }
    }

    void loadVerificationResults();
    void loadMetricSummaries();

    return () => {
      active = false;
    };
  }, [activeProjectId, role]);

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
  const questsById = useMemo(() => new Map(quests.map((quest) => [quest.id, quest])), [quests]);

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
        const questVerificationResults = verificationResults.filter((result) => result.questId === quest.id);

        return {
          id: quest.id,
          title: quest.title,
          verificationType: quest.verificationType,
          submissions: questSubmissions.length,
          pending: questSubmissions.filter((item) => item.status === "pending").length,
          rejected: questSubmissions.filter((item) => item.status === "rejected").length,
          duplicates: questVerificationResults.filter((item) => item.duplicateSignalTypes.length > 0)
            .length,
          openFlags: questFlags.filter((flag) => flag.status === "open").length,
          configRisk: questVerificationResults.filter((item) => item.missingConfigKeys.length > 0)
            .length,
        };
      })
      .filter((item) => item.submissions > 0 || item.openFlags > 0)
      .sort(
        (a, b) => b.pending + b.openFlags + b.duplicates - (a.pending + a.openFlags + a.duplicates)
      )
      .slice(0, 6);
  }, [quests, submissions, reviewFlags, verificationResults]);

  const verificationRoutes = summarizeByLabel(
    verificationResults.map((item) => humanize(item.route))
  );

  const platformMetricMap = useMemo(
    () => new Map((platformSummary?.metrics ?? []).map((metric) => [metric.key, metric])),
    [platformSummary]
  );
  const projectMetricMap = useMemo(
    () => new Map((projectSummary?.metrics ?? []).map((metric) => [metric.key, metric])),
    [projectSummary]
  );

  type OutcomeCard = {
    key: string;
    emphasis: "default" | "primary" | "warning";
  };

  const outcomeCards: OutcomeCard[] = [
    { key: "member_activation_rate", emphasis: "primary" },
    { key: "linked_readiness_rate", emphasis: "default" },
    { key: "reward_claim_conversion_rate", emphasis: "default" },
    { key: "automation_health_score", emphasis: "default" },
    {
      key: "open_trust_case_count",
      emphasis:
        (platformMetricMap.get("open_trust_case_count")?.value ?? 0) > 0
          ? ("warning" as OutcomeCard["emphasis"])
          : ("default" as OutcomeCard["emphasis"]),
    },
    {
      key: "open_onchain_case_count",
      emphasis:
        (platformMetricMap.get("open_onchain_case_count")?.value ?? 0) > 0
          ? ("warning" as OutcomeCard["emphasis"])
          : ("default" as OutcomeCard["emphasis"]),
    },
  ];

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Outcome board"
        title="Analytics"
        description="Use Analytics for outcomes and trends, not live triage: launch and health pressure lives in Overview, while campaign and verification intelligence stay available here."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href="/overview"
              className="rounded-2xl border border-line bg-card px-4 py-3 font-semibold"
            >
              Overview
            </Link>
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
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              {outcomeCards.map((card) => {
                const metric = platformMetricMap.get(card.key);
                return (
                  <OpsMetricCard
                    key={card.key}
                    label={metric?.label ?? humanize(card.key)}
                    value={formatMetricValue(metric?.value ?? 0, metric?.unit ?? "count")}
                    emphasis={card.emphasis}
                    sub={metric?.healthState ? humanize(metric.healthState) : undefined}
                  />
                );
              })}
            </div>

            <OpsPanel
              title="Analytics work modes"
              description="Keep outcomes and trends separate from campaign throughput and verification review load."
              action={
                <SegmentToggle
                  value={analyticsView}
                  onChange={setAnalyticsView}
                  options={[
                    { value: "outcomes", label: "Outcomes" },
                    { value: "campaigns", label: "Campaigns" },
                    { value: "verification", label: "Verification" },
                  ]}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-3">
                <ModeCard
                  label="Outcomes"
                  body="Activation, readiness, trust, claims and on-chain reliability trends."
                />
                <ModeCard
                  label="Campaigns"
                  body="Throughput, completion and confidence by campaign."
                />
                <ModeCard
                  label="Verification"
                  body="Route mix, manual review pressure and proof bottlenecks."
                />
              </div>
            </OpsPanel>
          </div>
        }
      >
        {summaryError ? (
          <OpsPanel eyebrow="Summary error" title="Analytics summaries could not load" description={summaryError}>
            <p className="text-sm leading-6 text-sub">
              Verification and campaign intelligence still render from live portal data, but the new snapshot-backed outcome board needs the Phase 7 metric job to be healthy.
            </p>
          </OpsPanel>
        ) : null}

        {analyticsView === "outcomes" ? (
          <>
            <div className="grid gap-6 xl:grid-cols-2">
              <OpsPanel
                eyebrow="Platform outcomes"
                title="Core trend posture"
                description={`Latest platform snapshot: ${platformSummary?.latestSnapshotDate ?? "missing"}.`}
                tone="accent"
              >
                <EngagementChart
                  items={[
                    metricToChartItem(platformMetricMap.get("member_activation_rate")),
                    metricToChartItem(platformMetricMap.get("linked_readiness_rate")),
                    metricToChartItem(platformMetricMap.get("campaign_completion_rate")),
                    metricToChartItem(platformMetricMap.get("reward_claim_conversion_rate")),
                    metricToChartItem(platformMetricMap.get("automation_health_score")),
                  ].filter((item): item is { label: string; value: number } => Boolean(item))}
                />
              </OpsPanel>

              <OpsPanel
                eyebrow="Risk posture"
                title="Reliability and case pressure"
                description="Keep the case-driven systems legible without turning Analytics into a live queue page."
              >
                <RewardsChart
                  items={[
                    metricToChartItem(platformMetricMap.get("open_trust_case_count")),
                    metricToChartItem(platformMetricMap.get("open_payout_case_count")),
                    metricToChartItem(platformMetricMap.get("open_onchain_case_count")),
                    metricToChartItem(platformMetricMap.get("support_escalation_count")),
                  ].filter((item): item is { label: string; value: number } => Boolean(item))}
                />
              </OpsPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <OpsPanel
                eyebrow="Workspace lens"
                title="Active project outcome read"
                description={
                  activeProjectId
                    ? `Latest project snapshot: ${projectSummary?.latestSnapshotDate ?? "missing"}.`
                    : "Pick an active project to see the project-level lens."
                }
              >
                {projectSummary ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      "project_launch_readiness_score",
                      "project_activation_rate",
                      "project_linked_readiness_rate",
                      "project_reward_claim_conversion_rate",
                      "project_provider_failure_count",
                      "project_support_escalation_count",
                    ].map((key) => {
                      const metric = projectMetricMap.get(key);
                      return (
                        <div key={key} className="rounded-[22px] border border-line bg-card2 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold text-text">{metric?.label ?? humanize(key)}</p>
                            <OpsStatusPill
                              tone={
                                metric?.healthState === "critical"
                                  ? "danger"
                                  : metric?.healthState === "warning" || metric?.healthState === "watch"
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {metric?.healthState ? humanize(metric.healthState) : "stable"}
                            </OpsStatusPill>
                          </div>
                          <p className="mt-3 text-2xl font-extrabold tracking-tight text-text">
                            {formatMetricValue(metric?.value ?? 0, metric?.unit ?? "count")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-sub">
                    No project snapshot is available yet for the active workspace.
                  </p>
                )}
              </OpsPanel>

              <OpsPanel
                eyebrow="Execution links"
                title="When a metric needs action"
                description="Keep the handoff from trend board back to execution explicit."
              >
                <div className="grid gap-4">
                  <LinkRow
                    href="/overview"
                    title="Open Overview"
                    body="Use the launch and health command center when the issue is live right now."
                  />
                  <LinkRow
                    href="/claims"
                    title="Open Claims"
                    body="Use the payout rail when conversion drops because claim handling or delivery is dragging."
                  />
                  <LinkRow
                    href="/moderation"
                    title="Open Moderation"
                    body="Use the trust rail when risk posture or verification review load is the blocker."
                  />
                  <LinkRow
                    href="/onchain"
                    title="Open On-chain"
                    body="Use the on-chain rail when reliability drops because ingest, enrichment or sync is drifting."
                  />
                </div>
              </OpsPanel>
            </div>
          </>
        ) : null}

        {analyticsView === "campaigns" ? (
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
                    <OpsStatusPill
                      tone={campaign.averageConfidence >= 70 ? "success" : "warning"}
                    >
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
        ) : null}

        {analyticsView === "verification" ? (
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
                      share={
                        verificationResults.length
                          ? Math.round((item.value / verificationResults.length) * 100)
                          : 0
                      }
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
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function metricToChartItem(metric?: MetricSummary["metrics"][number]) {
  if (!metric) return null;
  return {
    label: metric.label,
    value: Math.round(metric.value),
  };
}

function formatMetricValue(value: number, unit: string) {
  if (unit === "percent" || unit === "score") {
    return `${Math.round(value)}%`;
  }
  return Math.round(value).toLocaleString();
}

function ModeCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{body}</p>
    </div>
  );
}

function LinkRow({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="rounded-[24px] border border-line bg-card2 p-5 transition hover:border-primary/40">
      <p className="font-bold text-text">{title}</p>
      <p className="mt-3 text-sm leading-6 text-sub">{body}</p>
    </Link>
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
