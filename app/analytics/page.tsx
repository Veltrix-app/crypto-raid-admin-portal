"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  OpsCommandRead,
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
import type { AdminGrowthOverview } from "@/types/entities/growth-analytics";
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

type AnalyticsView = "growth" | "outcomes" | "campaigns" | "verification";

const analyticsViewOptions: Array<{ value: AnalyticsView; label: string }> = [
  { value: "growth", label: "Growth" },
  { value: "outcomes", label: "Outcomes" },
  { value: "campaigns", label: "Campaigns" },
  { value: "verification", label: "Verification" },
];

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
  const [growthOverview, setGrowthOverview] = useState<AdminGrowthOverview | null>(null);
  const [platformSummary, setPlatformSummary] = useState<MetricSummary | null>(null);
  const [projectSummary, setProjectSummary] = useState<MetricSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>("growth");

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
        const [platformResponse, projectResponse, growthResponse] = await Promise.all([
          fetch("/api/analytics/platform-summary", { cache: "no-store" }),
          activeProjectId
            ? fetch(`/api/analytics/project-summary?projectId=${activeProjectId}`, {
                cache: "no-store",
              })
            : Promise.resolve(null),
          fetch("/api/analytics/growth-overview", { cache: "no-store" }),
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
        const growthPayload =
          growthResponse &&
          ((await growthResponse.json().catch(() => null)) as
            | { ok?: boolean; overview?: AdminGrowthOverview; error?: string }
            | null);

        if (growthResponse && (!growthResponse.ok || !growthPayload?.ok)) {
          throw new Error(
            growthPayload && typeof growthPayload.error === "string"
              ? growthPayload.error
              : "Failed to load growth analytics overview."
          );
        }

        if (!active) return;
        setPlatformSummary(platformPayload.summary);
        setProjectSummary(projectPayload?.ok ? projectPayload.summary ?? null : null);
        setGrowthOverview(growthPayload?.ok ? growthPayload.overview ?? null : null);
        setSummaryError(null);
      } catch (error) {
        if (!active) return;
        setPlatformSummary(null);
        setProjectSummary(null);
        setGrowthOverview(null);
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
    emphasis: "default" | "warning";
  };

  const outcomeCards: OutcomeCard[] = [
    { key: "member_activation_rate", emphasis: "default" },
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
  const growthCards = [
    {
      label: "Visits",
      value:
        growthOverview?.funnel.find((stage) => stage.stage === "anonymous_visit")?.value ?? 0,
      emphasis: "default" as const,
      sub: "Top-of-funnel signal",
    },
    {
      label: "Paid conversions",
      value:
        growthOverview?.funnel.find((stage) => stage.stage === "paid_converted")?.value ?? 0,
      emphasis:
        (growthOverview?.funnel.find((stage) => stage.stage === "paid_converted")?.value ?? 0) > 0
          ? ("default" as const)
          : ("default" as const),
      sub: "Current paid accounts",
    },
    {
      label: "MRR",
      value: formatCurrencyValue(growthOverview?.revenue.mrr ?? 0),
      emphasis: "default" as const,
      sub: `${growthOverview?.revenue.activePaidAccounts ?? 0} paid accounts`,
    },
    {
      label: "Retained 30d",
      value: `${growthOverview?.retention.overallRetained30dRate ?? 0}%`,
      emphasis: "default" as const,
      sub: `${growthOverview?.retention.paidRetained30dRate ?? 0}% for paid cohorts`,
    },
    {
      label: "Expansion ready",
      value: growthOverview?.revenue.expansionReadyAccounts ?? 0,
      emphasis: "default" as const,
      sub: "Accounts with scale posture",
    },
    {
      label: "Benchmarks ready",
      value: `${
        growthOverview?.benchmarkCoverage.workspaceBenchmarksReady ?? 0
      } / ${growthOverview?.benchmarkCoverage.workspaceAccountsMeasured ?? 0}`,
      emphasis: "default" as const,
      sub: "Workspace peer bands live",
    },
  ];
  const attributionSources = growthOverview?.attribution.sources ?? [];
  const analyticsCommandRead =
    analyticsView === "growth"
      ? {
          title: "Growth is the cleanest read right now",
          description:
            "Use this lane when you need to understand whether traffic is turning into durable paid accounts, retained cohorts and expansion pressure.",
          now: `${
            growthOverview?.funnel.find((stage) => stage.stage === "paid_converted")?.value ?? 0
          } paid conversions are currently mapped against ${
            growthOverview?.funnel.find((stage) => stage.stage === "anonymous_visit")?.value ?? 0
          } top-of-funnel visits.`,
          next: `${
            growthOverview?.revenue.expansionReadyAccounts ?? 0
          } accounts are expansion-ready and ${
            growthOverview?.revenue.churnRiskAccounts ?? 0
          } are signaling churn risk.`,
          watch: `${growthOverview?.benchmarkCoverage.workspaceBenchmarksReady ?? 0} workspace benchmark bands are live, with ${
            growthOverview?.retention.overallRetained30dRate ?? 0
          }% retained at 30 days.`,
        }
      : analyticsView === "outcomes"
        ? {
            title: "Outcomes need a reliability read",
            description:
              "This lane is best when you want the platform-health story instead of campaign throughput or commercial funnel pressure.",
            now: `${formatMetricValue(
              platformMetricMap.get("member_activation_rate")?.value ?? 0,
              platformMetricMap.get("member_activation_rate")?.unit ?? "percent"
            )} member activation and ${formatMetricValue(
              platformMetricMap.get("reward_claim_conversion_rate")?.value ?? 0,
              platformMetricMap.get("reward_claim_conversion_rate")?.unit ?? "percent"
            )} reward claim conversion are the headline outcomes.`,
            next: `${formatMetricValue(
              platformMetricMap.get("open_trust_case_count")?.value ?? 0,
              platformMetricMap.get("open_trust_case_count")?.unit ?? "count"
            )} open trust cases and ${formatMetricValue(
              platformMetricMap.get("open_onchain_case_count")?.value ?? 0,
              platformMetricMap.get("open_onchain_case_count")?.unit ?? "count"
            )} open on-chain cases still need follow-through.`,
            watch: `${formatMetricValue(
              platformMetricMap.get("automation_health_score")?.value ?? 0,
              platformMetricMap.get("automation_health_score")?.unit ?? "score"
            )} automation health keeps this lane calm or noisy.`,
          }
        : analyticsView === "campaigns"
          ? {
              title: "Campaign throughput is the pressure lane",
              description:
                "Use campaign mode when the question is where review load, low confidence or weak completion is accumulating right now.",
              now: campaignHealth.length
                ? `${campaignHealth[0].title} currently carries the heaviest submission load with ${campaignHealth[0].submissions} submissions and ${campaignHealth[0].pending} still pending.`
                : "No campaign submission pressure is being reported right now.",
              next: questReviewLoad.length
                ? `${questReviewLoad[0].title} is the first quest lane to inspect for review pressure and verification friction.`
                : "Quest review pressure is calm across the measured set.",
              watch: `${pendingVerificationCount} verification decisions remain pending, with ${duplicateSignalCount} duplicate signal cases in play.`,
            }
          : {
              title: "Verification is the proof-pressure lane",
              description:
                "Stay here when you need to understand manual review load, route quality and where verification friction is slowing campaign flow down.",
              now: `${pendingVerificationCount} verification results are still pending, while ${autoApprovedCount} already resolved through auto approval or approval routes.`,
              next: `${duplicateSignalCount} duplicate-signal cases and ${rejectedVerificationCount} rejections are the next places to inspect for friction or misconfiguration.`,
              watch: `${verificationResults.length} total verification records are currently shaping the route mix and confidence posture.`,
            };

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Outcome board"
        title="Analytics"
        description="Use Analytics for outcomes and trends, not live triage: launch and health pressure lives in Overview, while campaign and verification intelligence stay available here."
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-2.5 md:grid-cols-3 xl:grid-cols-6">
              {(analyticsView === "growth" ? growthCards : outcomeCards).map((card) => {
                if ("key" in card) {
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
                }

                return (
                  <OpsMetricCard
                    key={card.label}
                    label={card.label}
                    value={typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                    emphasis={card.emphasis}
                    sub={card.sub}
                  />
                );
              })}
            </div>

            <OpsCommandRead
              eyebrow="Command read"
              title={analyticsCommandRead.title}
              description={analyticsCommandRead.description}
              now={analyticsCommandRead.now}
              next={analyticsCommandRead.next}
              watch={analyticsCommandRead.watch}
              action={<AnalyticsViewSwitch value={analyticsView} onChange={setAnalyticsView} />}
              rail={
                <OpsPanel
                  eyebrow="Snapshot route"
                  title={summaryError ? "Outcome snapshots are warming up" : "Snapshot route is healthy"}
                  description={
                    summaryError
                      ? "Live portal data still renders. The snapshot layer should stay secondary until the metric job catches up."
                      : "Snapshot-backed outcomes are available for this analytics read."
                  }
                >
                  <div className="space-y-3">
                    <OpsStatusPill tone={summaryError ? "warning" : "default"}>
                      {summaryError ? "snapshot job pending" : "snapshot route ready"}
                    </OpsStatusPill>
                    {summaryError ? (
                      <p className="text-[12px] leading-5 text-sub">{summaryError}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 border-t border-white/[0.025] pt-3">
                      <SoftRouteLink href="/overview" label="Overview" />
                      <SoftRouteLink href="/analytics/engagement" label="Engagement" />
                      <SoftRouteLink href="/analytics/rewards" label="Rewards" />
                    </div>
                  </div>
                </OpsPanel>
              }
            />
          </div>
        }
      >

        {analyticsView === "growth" ? (
          <div className="grid gap-4 xl:items-start xl:grid-cols-[minmax(0,1fr)_360px]">
            <OpsPanel
              eyebrow="Growth model"
              title="Funnel, retention and benchmark read"
              description="This is the main analytics surface: first understand whether traffic moves through the funnel, then check retention and peer coverage."
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_290px]">
                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-sub">
                    Funnel stages
                  </p>
                  <FunnelStageList stages={growthOverview?.funnel ?? []} />
                </div>

                <div className="space-y-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-sub">
                    Cohort health
                  </p>
                  <OpsMetricCard
                    label="Overall retained 30d"
                    value={`${growthOverview?.retention.overallRetained30dRate ?? 0}%`}
                  />
                  <OpsMetricCard
                    label="Paid retained 30d"
                    value={`${growthOverview?.retention.paidRetained30dRate ?? 0}%`}
                  />
                  <OpsMetricCard
                    label="Expansion rate"
                    value={`${growthOverview?.retention.expansionReadyRate ?? 0}%`}
                  />
                  <OpsMetricCard
                    label="Churn risk rate"
                    value={`${growthOverview?.retention.churnRiskRate ?? 0}%`}
                    emphasis={
                      (growthOverview?.retention.churnRiskRate ?? 0) > 0 ? "warning" : "default"
                    }
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <CompactReadCard
                  label="Attribution"
                  title={
                    attributionSources.length > 0
                      ? `${attributionSources.length} tracked sources`
                      : "Awaiting tracked sources"
                  }
                  body={
                    attributionSources.length > 0
                      ? attributionSources
                          .slice(0, 3)
                          .map((source) => `${source.source}: ${source.paidConversions} paid`)
                          .join(" | ")
                      : "Sources will appear here once tracked events move through the funnel."
                  }
                />
                <CompactReadCard
                  label="Benchmarks"
                  title={`${
                    growthOverview?.benchmarkCoverage.workspaceBenchmarksReady ?? 0
                  } / ${
                    growthOverview?.benchmarkCoverage.workspaceAccountsMeasured ?? 0
                  } workspace peer bands`}
                  body="Peer coverage only becomes useful when the measured cohort is large enough."
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Commercial posture"
              title="Revenue and next action"
              description="Keep commercial health and the next operator move in one rail instead of scattering it across the canvas."
            >
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <OpsMetricCard
                  label="MRR"
                  value={formatCurrencyValue(growthOverview?.revenue.mrr ?? 0)}
                />
                <OpsMetricCard
                  label="Active paid"
                  value={growthOverview?.revenue.activePaidAccounts ?? 0}
                />
                <OpsMetricCard
                  label="Free"
                  value={growthOverview?.revenue.freeAccounts ?? 0}
                />
                <OpsMetricCard
                  label="Trialing"
                  value={growthOverview?.revenue.trialingAccounts ?? 0}
                />
                <OpsMetricCard
                  label="Expansion ready"
                  value={growthOverview?.revenue.expansionReadyAccounts ?? 0}
                />
                <OpsMetricCard
                  label="Churn risk"
                  value={growthOverview?.revenue.churnRiskAccounts ?? 0}
                  emphasis={
                    (growthOverview?.revenue.churnRiskAccounts ?? 0) > 0
                      ? "warning"
                      : "default"
                  }
                />
              </div>

              <div className="mt-4 space-y-2.5 border-t border-white/[0.025] pt-4">
                <LinkRow
                  href="/business"
                  title="Open Business"
                  body="Use the commercial cockpit when the growth read points to plan pressure or pricing friction."
                />
                <LinkRow
                  href="/success"
                  title="Open Success"
                  body="Use Success when accounts activate slowly or fail to turn setup into durable motion."
                />
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {analyticsView === "outcomes" ? (
          <>
            <div className="grid gap-4 xl:items-start xl:grid-cols-2">
              <OpsPanel
                eyebrow="Platform outcomes"
                title="Core trend posture"
                description={`Latest platform snapshot: ${platformSummary?.latestSnapshotDate ?? "missing"}.`}
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

            <div className="grid gap-4 xl:items-start xl:grid-cols-[1.05fr_0.95fr]">
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
                        <div key={key} className="rounded-[16px] border border-white/[0.025] bg-white/[0.018] p-3.5">
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
                          <p className="mt-3 text-[1.45rem] font-extrabold tracking-tight text-text">
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
                body="Use the payout workspace when conversion drops because claim handling or delivery is dragging."
                  />
                  <LinkRow
                    href="/moderation"
                    title="Open Moderation"
                body="Use the trust workspace when risk posture or verification review load is the blocker."
                  />
                  <LinkRow
                    href="/onchain"
                    title="Open On-chain"
                body="Use the on-chain workspace when reliability drops because ingest, enrichment or sync is drifting."
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
                <div className="grid gap-3 xl:items-start xl:grid-cols-3">
                  {campaignHealth.slice(0, 6).map((campaign) => (
                <div key={campaign.id} className="rounded-[18px] border border-white/[0.025] bg-white/[0.018] p-3.5">
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
          <div className="grid gap-4 xl:items-start xl:grid-cols-[0.9fr_1.1fr]">
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
              <div className="overflow-hidden rounded-[18px] border border-white/[0.025] bg-white/[0.018]">
                <div className="grid grid-cols-7 border-b border-white/[0.025] px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sub">
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
                    className="grid grid-cols-7 items-center border-b border-white/[0.025] px-4 py-3.5 text-[13px] text-text last:border-b-0"
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
                  <div className="px-4 py-6 text-sm text-sub">
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

function formatCurrencyValue(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function AnalyticsViewSwitch({
  value,
  onChange,
}: {
  value: AnalyticsView;
  onChange: (next: AnalyticsView) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-[14px] border border-white/[0.025] bg-white/[0.016] p-1">
      {analyticsViewOptions.map((option) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[11px] px-2.5 py-1.5 text-[11px] font-semibold transition ${
              active
                ? "bg-white/[0.08] text-text"
                : "text-sub hover:bg-white/[0.04] hover:text-text"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SoftRouteLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-white/[0.025] bg-white/[0.014] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sub transition hover:border-white/[0.08] hover:text-text"
    >
      {label}
    </Link>
  );
}

function FunnelStageList({ stages }: { stages: AdminGrowthOverview["funnel"] }) {
  if (stages.length === 0) {
    return (
      <div className="rounded-[16px] border border-white/[0.025] bg-white/[0.014] px-3.5 py-3">
        <p className="text-[13px] font-semibold text-text">Funnel data is not ready yet</p>
        <p className="mt-1.5 text-[12px] leading-5 text-sub">
          The page keeps the model in place, but avoids showing a large empty chart while the
          snapshot job is still warming up.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-white/[0.025] bg-white/[0.014]">
      {stages.slice(0, 8).map((stage, index) => (
        <div
          key={stage.stage}
          className="grid grid-cols-[32px_minmax(0,1fr)_96px] items-center gap-3 border-b border-white/[0.025] px-3 py-2.5 text-[12px] last:border-b-0"
        >
          <span className="text-[10px] font-bold text-sub">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">{stage.label}</p>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.14em] text-sub">
              {stage.dataSource}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-text">{stage.value.toLocaleString()}</p>
            <p className="mt-0.5 text-[10px] text-sub">
              {stage.conversionRate === null ? "start" : `${stage.conversionRate}%`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactReadCard({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/[0.025] bg-white/[0.016] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sub">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-text">{title}</p>
      <p className="mt-1 text-[11px] leading-5 text-sub">{body}</p>
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
    <Link href={href} className="rounded-[16px] border border-white/[0.025] bg-white/[0.016] px-3.5 py-3 transition hover:border-white/[0.08]">
      <p className="text-[13px] font-bold text-text">{title}</p>
      <p className="mt-1.5 text-[11px] leading-5 text-sub">{body}</p>
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
    <div className="rounded-[16px] border border-white/[0.025] bg-white/[0.016] px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-text">{label}</p>
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">
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
    <div className="rounded-[14px] border border-white/[0.025] bg-white/[0.016] px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1 text-[0.92rem] font-extrabold text-text">{value}</p>
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
