"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PortalBillingBlockNotice } from "@/components/billing/PortalBillingBlockNotice";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import LifecycleStatusPill from "@/components/platform/LifecycleStatusPill";
import OpsIncidentPanel from "@/components/platform/OpsIncidentPanel";
import OpsOverridePanel from "@/components/platform/OpsOverridePanel";
import {
  DetailActionTile,
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { deriveLifecycleState } from "@/lib/platform/core-lifecycle";
import {
  canArchiveProjectContent,
  getPrimaryProjectContentAction,
  type ProjectContentAction,
} from "@/lib/projects/content-actions";
import {
  isBillingLimitError,
  type BillingLimitBlock,
} from "@/lib/billing/entitlement-blocks";
import { useProjectOps } from "@/hooks/useProjectOps";
import { createClient } from "@/lib/supabase/client";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { DbAuditLog, DbVerificationResult } from "@/types/database";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getCampaignById = useAdminPortalStore((s) => s.getCampaignById);
  const updateCampaign = useAdminPortalStore((s) => s.updateCampaign);
  const deleteCampaign = useAdminPortalStore((s) => s.deleteCampaign);
  const runProjectContentAction = useAdminPortalStore((s) => s.runProjectContentAction);
  const projects = useAdminPortalStore((s) => s.projects);
  const raids = useAdminPortalStore((s) => s.raids);
  const quests = useAdminPortalStore((s) => s.quests);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const [snapshot, setSnapshot] = useState<{
    submissions: number;
    approved: number;
    pending: number;
    rejected: number;
    autoApproved: number;
    duplicateSignals: number;
    openFlags: number;
    averageConfidence: number;
  } | null>(null);
  const [distributionSummary, setDistributionSummary] = useState<{
    recipients: number;
    claimableRecipients: number;
    totalDistributed: number;
    rewardAsset: string;
  } | null>(null);
  const [callbackFailures, setCallbackFailures] = useState<DbAuditLog[]>([]);
  const [finalizingRewards, setFinalizingRewards] = useState(false);
  const [finalizeMessage, setFinalizeMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);
  const [runningAction, setRunningAction] = useState<ProjectContentAction | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [actionBlock, setActionBlock] = useState<BillingLimitBlock | null>(null);

  const campaignEntry = useMemo(
    () => getCampaignById(params.id),
    [getCampaignById, params.id]
  );
  const campaignOps = useProjectOps(campaignEntry?.projectId, {
    objectType: "campaign",
    objectId: params.id,
  });
  const currentCampaign = campaignEntry ?? null;
  const currentCampaignId = currentCampaign?.id ?? "";
  const currentCampaignProjectId = currentCampaign?.projectId ?? "";
  const lifecycleState = deriveLifecycleState(currentCampaign?.status ?? "draft", "draft");
  const primaryLifecycleAction = getPrimaryProjectContentAction(
    "campaign",
    currentCampaign?.status ?? "draft"
  );
  const canArchiveLifecycleAction = canArchiveProjectContent(
    "campaign",
    currentCampaign?.status ?? "draft"
  );
  const project = projects.find((p) => p.id === currentCampaignProjectId);
  const relatedRaids = raids.filter((r) => r.campaignId === currentCampaignId);
  const relatedQuests = quests.filter((q) => q.campaignId === currentCampaignId);
  const relatedRewards = rewards.filter((reward) => reward.campaignId === currentCampaignId);
  const relatedQuestIdList = useMemo(
    () => relatedQuests.map((quest) => quest.id),
    [relatedQuests]
  );
  const relatedQuestIds = useMemo(() => new Set(relatedQuestIdList), [relatedQuestIdList]);
  const relatedSubmissions = submissions.filter((submission) =>
    relatedQuestIds.has(submission.questId)
  );
  const relatedFlags = reviewFlags.filter(
    (flag) =>
      flag.sourceTable === "quest_submissions" &&
      relatedSubmissions.some((submission) => submission.id === flag.sourceId)
  );
  const readinessItems = [
    {
      label: "Messaging",
      value: currentCampaign?.shortDescription ? "Hook defined" : "Needs hook",
      complete: !!currentCampaign?.shortDescription,
    },
    {
      label: "Timing",
      value: currentCampaign?.startsAt && currentCampaign?.endsAt ? "Scheduled window" : "No full window",
      complete: !!currentCampaign?.startsAt && !!currentCampaign?.endsAt,
    },
    {
      label: "Mechanics",
      value: `${relatedQuests.length} quests / ${relatedRaids.length} raids`,
      complete: relatedQuests.length + relatedRaids.length > 0,
    },
    {
      label: "Reward Loop",
      value: relatedRewards.length ? `${relatedRewards.length} rewards linked` : "No linked rewards",
      complete: relatedRewards.length > 0,
    },
  ];
  const overrideActions = [
    {
      label: "Pause campaign rail",
      description:
        "Freeze new traffic while you stabilize messaging, rewards or moderation pressure.",
      objectType: "campaign" as const,
      objectId: currentCampaignId,
      overrideType: "pause" as const,
      reason: "Campaign rail paused from detail workspace.",
    },
    {
      label: "Queue manual retry",
      description:
        "Mark this campaign for a manual retry pass when the next move is operator recovery.",
      objectType: "campaign" as const,
      objectId: currentCampaignId,
      overrideType: "manual_retry" as const,
      reason: "Manual retry queued from campaign detail.",
    },
  ];

  useEffect(() => {
    if (!currentCampaign) {
      setSnapshot(null);
      return;
    }

    let active = true;
    const supabase = createClient();

    async function loadCampaignSnapshot() {
      const { data: dailyRow } = await supabase
        .from("campaign_analytics_daily")
        .select("*")
        .eq("campaign_id", currentCampaignId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: verificationRows } =
        relatedQuests.length > 0
          ? await supabase
              .from("verification_results")
              .select("*")
              .in("quest_id", relatedQuests.map((quest) => quest.id))
          : { data: [] };

      if (!active) return;

      const results = (verificationRows ?? []) as DbVerificationResult[];
      const snapshotFromLive = {
        submissions: relatedSubmissions.length,
        approved: relatedSubmissions.filter((item) => item.status === "approved").length,
        pending: relatedSubmissions.filter((item) => item.status === "pending").length,
        rejected: relatedSubmissions.filter((item) => item.status === "rejected").length,
        autoApproved: results.filter(
          (item) => item.route === "rule_auto_approved" || item.decision_status === "approved"
        ).length,
        duplicateSignals: results.filter(
          (item) => (item.duplicate_signal_types ?? []).length > 0
        ).length,
        openFlags: relatedFlags.filter((flag) => flag.status === "open").length,
        averageConfidence: results.length
          ? Math.round(
              results.reduce((sum, item) => sum + item.confidence_score, 0) / results.length
            )
          : 0,
      };

      if (dailyRow) {
        setSnapshot({
          submissions: dailyRow.submissions ?? snapshotFromLive.submissions,
          approved: dailyRow.approved_submissions ?? snapshotFromLive.approved,
          pending: dailyRow.pending_submissions ?? snapshotFromLive.pending,
          rejected: dailyRow.rejected_submissions ?? snapshotFromLive.rejected,
          autoApproved: dailyRow.auto_approved_submissions ?? snapshotFromLive.autoApproved,
          duplicateSignals: dailyRow.duplicate_signal_count ?? snapshotFromLive.duplicateSignals,
          openFlags: dailyRow.open_review_flags ?? snapshotFromLive.openFlags,
          averageConfidence: dailyRow.average_confidence ?? snapshotFromLive.averageConfidence,
        });
        return;
      }

      setSnapshot(snapshotFromLive);
    }

    loadCampaignSnapshot();

    return () => {
      active = false;
    };
  }, [currentCampaign, currentCampaignId, relatedFlags, relatedQuests, relatedSubmissions]);

  useEffect(() => {
    if (!currentCampaign) {
      setDistributionSummary(null);
      return;
    }

    let active = true;
    const supabase = createClient();

    async function loadDistributionSummary() {
      const { data, error } = await supabase
        .from("reward_distributions")
        .select("reward_amount, reward_asset, status")
        .eq("campaign_id", currentCampaignId);

      if (!active || error) {
        if (error && active) {
          console.error("[campaign-distributions] failed", error.message);
        }
        return;
      }

      const rows = data ?? [];
      const totalDistributed = rows.reduce(
        (sum, row) => sum + Number(row.reward_amount ?? 0),
        0
      );

      setDistributionSummary({
        recipients: rows.length,
        claimableRecipients: rows.filter((row) => row.status === "claimable").length,
        totalDistributed,
        rewardAsset:
          (rows.find((row) => typeof row.reward_asset === "string" && row.reward_asset.trim())
            ?.reward_asset as string | undefined) ??
          currentCampaign?.rewardType ??
          "campaign_pool",
      });
    }

    void loadDistributionSummary();

    return () => {
      active = false;
    };
  }, [currentCampaign, currentCampaignId, currentCampaign?.rewardType]);

  useEffect(() => {
    if (!currentCampaign) {
      setCallbackFailures([]);
      return;
    }

    let active = true;
    const supabase = createClient();

    async function loadCallbackFailures() {
      if (relatedQuestIdList.length === 0) {
        setCallbackFailures([]);
        return;
      }

      const { data, error } = await supabase
        .from("admin_audit_logs")
        .select("*")
        .eq("action", "verification_callback_failed")
        .in("source_id", relatedQuestIdList)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!active) {
        return;
      }

      if (error) {
        console.error("[campaign-callback-failures] failed", error.message);
        return;
      }

      setCallbackFailures((data ?? []) as DbAuditLog[]);
    }

    void loadCallbackFailures();

    return () => {
      active = false;
    };
  }, [currentCampaign, relatedQuestIdList]);

  if (!currentCampaign) {
    return (
      <AdminShell>
        <NotFoundState
          title="Campaign not found"
          description="This campaign could not be resolved from the current admin portal store state. It may have been deleted, moved out of scope or never loaded into the active workspace."
        />
      </AdminShell>
    );
  }

  const campaign = currentCampaign;

  async function handleLifecycleAction(action: ProjectContentAction) {
    if (!currentCampaign) {
      return;
    }

    setActionMessage(null);
    setActionBlock(null);
    setRunningAction(action);

    try {
      const result = await runProjectContentAction({
        projectId: currentCampaign.projectId,
        objectType: "campaign",
        objectId: currentCampaign.id,
        action,
      });

      if (action === "duplicate") {
        router.push(`/campaigns/${result.targetId}`);
        return;
      }

      const successLabel =
        action === "publish"
          ? "Campaign published."
          : action === "pause"
            ? "Campaign paused."
            : action === "resume"
              ? "Campaign resumed."
              : "Campaign archived.";

      setActionMessage({
        tone: "success",
        text: successLabel,
      });
    } catch (error) {
      if (isBillingLimitError(error)) {
        setActionBlock(error.block);
        return;
      }

      setActionMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update campaign lifecycle.",
      });
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <DetailHero
          eyebrow="Campaign Detail"
          title={campaign.title}
          description={campaign.longDescription || campaign.shortDescription}
          badges={
            <>
              <DetailBadge>{project?.name || "Unknown Project"}</DetailBadge>
              <DetailBadge>{campaign.campaignType.replace(/_/g, " ")}</DetailBadge>
              <DetailBadge>{campaign.visibility}</DetailBadge>
              <LifecycleStatusPill state={lifecycleState} fallback="draft" />
              {campaign.featured ? <DetailBadge tone="warning">Featured</DetailBadge> : null}
            </>
          }
          actions={
            <>
              <Link
                href="/analytics"
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 font-semibold text-text transition hover:border-primary/30 hover:bg-primary/5"
              >
                Open Analytics
              </Link>
              <button
                onClick={() => void handleLifecycleAction("duplicate")}
                disabled={runningAction !== null}
                className="rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 font-semibold text-text transition hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAction === "duplicate" ? "Duplicating..." : "Duplicate"}
              </button>
              {primaryLifecycleAction ? (
                <button
                  onClick={() => void handleLifecycleAction(primaryLifecycleAction.action)}
                  disabled={runningAction !== null}
                  className="rounded-[18px] border border-primary/30 bg-primary/10 px-4 py-3 font-bold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningAction === primaryLifecycleAction.action
                    ? `${primaryLifecycleAction.label}...`
                    : primaryLifecycleAction.label}
                </button>
              ) : null}
              {canArchiveLifecycleAction ? (
                <button
                  onClick={() => void handleLifecycleAction("archive")}
                  disabled={runningAction !== null}
                  className="rounded-[18px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-bold text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningAction === "archive" ? "Archiving..." : "Archive"}
                </button>
              ) : null}
              <button
                onClick={async () => {
                  await deleteCampaign(campaign.id);
                  router.push("/campaigns");
                }}
                className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
              >
                Delete Campaign
              </button>
            </>
          }
          metrics={
            <>
              <DetailMetricCard label="Project" value={project?.name || "-"} hint="Workspace owning this campaign." />
              <DetailMetricCard label="XP Budget" value={campaign.xpBudget} hint="Total reward pressure planned in this loop." />
              <DetailMetricCard
                label="Reward Pool"
                value={`${currentCampaign.rewardPoolAmount ?? 0}`}
                hint={`${currentCampaign.rewardType ?? "campaign_pool"} routed through AESP finalization.`}
              />
              <DetailMetricCard label="Participants" value={campaign.participants} hint="Current contributor volume attached here." />
              <DetailMetricCard label="Completion" value={`${campaign.completionRate}%`} hint="Current finish rate across the campaign path." />
              <DetailMetricCard label="Submissions" value={snapshot?.submissions ?? relatedSubmissions.length} hint="Total quest submissions routed into this campaign." />
              <DetailMetricCard label="Auto Approved" value={snapshot?.autoApproved ?? 0} hint="Submissions cleared by rules without manual work." />
              <DetailMetricCard label="Open Flags" value={snapshot?.openFlags ?? relatedFlags.filter((flag) => flag.status === "open").length} hint="Trust or moderation items still unresolved." />
              <DetailMetricCard label="Avg Confidence" value={`${snapshot?.averageConfidence ?? 0}%`} hint="Verification confidence across recent activity." />
            </>
          }
        />

        {actionBlock ? (
          <PortalBillingBlockNotice
            block={actionBlock}
            title="Publishing another campaign needs more plan capacity"
          />
        ) : null}

        {actionMessage ? (
          <div
            className={`rounded-[24px] border px-5 py-4 text-sm font-semibold ${
              actionMessage.tone === "success"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200"
            }`}
          >
            {actionMessage.text}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <DetailSurface
            eyebrow="Readiness"
            title="What this campaign still needs"
            description="A quick operator read on messaging, timing, mechanics and incentive coverage before you scale more traffic into the loop."
            aside={<DetailMetricCard label="Active Mechanics" value={relatedQuests.length + relatedRaids.length} />}
          >
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {readinessItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
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
                      {item.complete ? "Ready" : "Needs attention"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-sub">{item.value}</p>
                </div>
              ))}
            </div>
          </DetailSurface>

        <DetailSurface
          eyebrow="Next Actions"
          title="Studios and next actions"
          description="Keep the campaign moving by opening the right builder with this campaign already wired in."
        >
          <div className="mt-5 space-y-3">
            <DetailActionTile
                href={`/quests/new?projectId=${campaign.projectId}&campaignId=${campaign.id}`}
                label="Open Quest Studio"
                description={
                  relatedQuests.length > 0
                    ? `${relatedQuests.length} quest${relatedQuests.length === 1 ? "" : "s"} already shape this campaign. Add the next one in Quest Studio with this campaign prefilled.`
                    : "Start the contributor journey in Quest Studio with this campaign already attached."
                }
              />
              <DetailActionTile
                href={`/raids/new?projectId=${campaign.projectId}&campaignId=${campaign.id}`}
                label="Open Raid Builder"
                description={
                  relatedRaids.length > 0
                    ? `${relatedRaids.length} raid${relatedRaids.length === 1 ? "" : "s"} are linked already. Open the builder to layer in the next pressure wave from this campaign context.`
                    : "Raids help layer in time-sensitive social momentum on top of the quest structure."
                }
              />
              <DetailActionTile
                href={relatedRewards.length > 0 ? "/rewards" : "/rewards/new"}
                label={relatedRewards.length > 0 ? "Review rewards" : "Create reward loop"}
                description={
                  relatedRewards.length > 0
                    ? `${relatedRewards.length} reward${relatedRewards.length === 1 ? "" : "s"} complete the incentive loop here.`
                    : "Campaigns convert better when the payoff is visible, so connect a reward next."
                }
              />
            </div>
          </DetailSurface>
        </div>

        <DetailSurface
          eyebrow="Analytics Snapshot"
          title="How this campaign is actually behaving"
          description="These numbers show whether the loop is clearing smoothly or building moderation and fraud drag."
        >
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <AnalyticsStat
              label="Approved"
              value={snapshot?.approved ?? relatedSubmissions.filter((item) => item.status === "approved").length}
              hint="Submissions that cleared review or automation."
            />
            <AnalyticsStat
              label="Pending"
              value={snapshot?.pending ?? relatedSubmissions.filter((item) => item.status === "pending").length}
              hint="Current manual review load inside this campaign."
            />
            <AnalyticsStat
              label="Rejected"
              value={snapshot?.rejected ?? relatedSubmissions.filter((item) => item.status === "rejected").length}
              hint="Submissions that failed validation or moderation."
            />
            <AnalyticsStat
              label="Duplicate Signals"
              value={snapshot?.duplicateSignals ?? 0}
              hint="Identity or proof overlap detected in this campaign."
            />
          </div>
        </DetailSurface>

        <DetailSurface
          eyebrow="Platform Core"
          title="Lifecycle, incidents and overrides"
          description="This operator rail keeps the campaign's runtime incidents, manual overrides and explicit lifecycle state in one place."
        >
          <div className="mt-5 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      Lifecycle posture
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      Campaign state is explicit now, so operators can immediately tell whether
                      this loop is live, paused, ready or in recovery.
                    </p>
                  </div>
                  <LifecycleStatusPill state={lifecycleState} fallback="draft" />
                </div>
              </div>

              <OpsIncidentPanel
                incidents={campaignOps.openIncidents}
                emptyTitle="No campaign incidents"
                emptyDescription="No provider, runtime or manual-test incidents are currently open for this campaign."
                workingIncidentId={campaignOps.workingIncidentId}
                onUpdateStatus={campaignOps.updateIncidentStatus}
              />
            </div>

            <OpsOverridePanel
              overrides={campaignOps.activeOverrides}
              quickActions={overrideActions}
              creatingOverride={campaignOps.creatingOverride}
              workingOverrideId={campaignOps.workingOverrideId}
              onCreateOverride={campaignOps.createOverride}
              onResolveOverride={campaignOps.resolveOverride}
            />
          </div>
        </DetailSurface>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <DetailSurface
            title="Edit Campaign"
            description="Tighten the hook, structure and timing without leaving the detail view."
          >
            <div className="mt-6">
              <CampaignForm
                projects={projects}
                defaultProjectId={campaign.projectId}
                initialValues={{
                  projectId: campaign.projectId,

                  title: campaign.title,
                  slug: campaign.slug,

                  shortDescription: campaign.shortDescription,
                  longDescription: campaign.longDescription || "",

                  bannerUrl: campaign.bannerUrl || "",
                  thumbnailUrl: campaign.thumbnailUrl || "",

                  campaignType: campaign.campaignType,
                  campaignMode: campaign.campaignMode ?? "offchain",
                  rewardType: campaign.rewardType ?? "campaign_pool",
                  rewardPoolAmount: campaign.rewardPoolAmount ?? 0,
                  minXpRequired: campaign.minXpRequired ?? 0,
                  activityThreshold: campaign.activityThreshold ?? 0,
                  lockDays: campaign.lockDays ?? 0,

                  xpBudget: campaign.xpBudget,
                  participants: campaign.participants,
                  completionRate: campaign.completionRate,

                  visibility: campaign.visibility,
                  featured: campaign.featured,

                  startsAt: campaign.startsAt || "",
                  endsAt: campaign.endsAt || "",

                  status: campaign.status,
                }}
                submitLabel="Update Campaign"
                onSubmit={async (values) => {
                  await updateCampaign(campaign.id, values);
                }}
              />
            </div>
          </DetailSurface>

          <div className="space-y-6">
            <DetailSidebarSurface title="Campaign Assets">
              <div className="mt-4 space-y-4">
                <DetailMetaRow label="Slug" value={campaign.slug || "-"} />
                <DetailMetaRow label="Type" value={campaign.campaignType} />
                <DetailMetaRow label="Mode" value={campaign.campaignMode ?? "offchain"} />
                <DetailMetaRow label="Visibility" value={campaign.visibility} />
                <DetailMetaRow label="Featured" value={campaign.featured ? "Yes" : "No"} />
                <DetailMetaRow label="Starts At" value={campaign.startsAt || "-"} />
                <DetailMetaRow label="Ends At" value={campaign.endsAt || "-"} />
                <DetailMetaRow label="Reward Type" value={campaign.rewardType ?? "campaign_pool"} />
                <DetailMetaRow label="Reward Pool" value={String(campaign.rewardPoolAmount ?? 0)} />
                <DetailMetaRow label="Min Active XP" value={String(campaign.minXpRequired ?? 0)} />
                <DetailMetaRow label="Activity Threshold" value={String(campaign.activityThreshold ?? 0)} />
                <DetailMetaRow label="Lock Days" value={String(campaign.lockDays ?? 0)} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Linked Content">
              <div className="mt-4 grid gap-3">
                <DetailMetaRow label="Raids" value={relatedRaids.length} />
                <DetailMetaRow label="Quests" value={relatedQuests.length} />
                <DetailMetaRow label="Rewards" value={relatedRewards.length} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Distribution Engine">
              <div className="mt-4 space-y-4">
                <DetailMetaRow
                  label="Recipients"
                  value={distributionSummary ? distributionSummary.recipients : 0}
                />
                <DetailMetaRow
                  label="Claimable"
                  value={distributionSummary ? distributionSummary.claimableRecipients : 0}
                />
                <DetailMetaRow
                  label="Distributed"
                  value={
                    distributionSummary
                      ? `${distributionSummary.totalDistributed.toFixed(4)} ${distributionSummary.rewardAsset}`
                      : `0 ${currentCampaign.rewardType ?? "campaign_pool"}`
                  }
                />
                <button
                  onClick={async () => {
                    setFinalizingRewards(true);
                    setFinalizeMessage(null);

                    try {
                      const response = await fetch(`/api/campaigns/${campaign.id}/finalize`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({}),
                      });

                      const payload = await response.json().catch(() => null);
                      if (!response.ok || !payload?.ok) {
                        throw new Error(payload?.error ?? "Reward finalization failed.");
                      }

                      const supabase = createClient();
                      const { data } = await supabase
                        .from("reward_distributions")
                        .select("reward_amount, reward_asset, status")
                        .eq("campaign_id", campaign.id);

                      const rows = data ?? [];
                      setDistributionSummary({
                        recipients: rows.length,
                        claimableRecipients: rows.filter((row) => row.status === "claimable").length,
                        totalDistributed: rows.reduce(
                          (sum, row) => sum + Number(row.reward_amount ?? 0),
                          0
                        ),
                        rewardAsset:
                          (rows.find(
                            (row) =>
                              typeof row.reward_asset === "string" && row.reward_asset.trim()
                          )?.reward_asset as string | undefined) ??
                          campaign.rewardType ??
                          "campaign_pool",
                      });
                      setFinalizeMessage({
                        tone: "success",
                        text: "Reward distributions were finalized and the campaign pool is now claimable.",
                      });
                    } catch (error) {
                      setFinalizeMessage({
                        tone: "error",
                        text:
                          error instanceof Error
                            ? error.message
                            : "Reward finalization failed.",
                      });
                    } finally {
                      setFinalizingRewards(false);
                    }
                  }}
                  className="w-full rounded-[18px] border border-primary/25 bg-primary/10 px-4 py-3 font-bold text-primary transition hover:bg-primary/15"
                  disabled={finalizingRewards}
                >
                  {finalizingRewards ? "Finalizing..." : "Finalize distributions"}
                </button>
                {finalizeMessage ? (
                  <div
                    className={`rounded-[18px] px-4 py-3 text-sm ${
                      finalizeMessage.tone === "error"
                        ? "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                        : finalizeMessage.tone === "success"
                          ? "border border-primary/30 bg-primary/10 text-primary"
                          : "border border-line bg-card2 text-sub"
                    }`}
                  >
                    {finalizeMessage.text}
                  </div>
                ) : null}
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Operator Signals">
              <div className="mt-4 space-y-4">
                <DetailMetaRow label="Callback failures" value={callbackFailures.length} />
                <DetailMetaRow
                  label="Open trust flags"
                  value={relatedFlags.filter((flag) => flag.status === "open").length}
                />
                <DetailMetaRow
                  label="Latest callback issue"
                  value={callbackFailures[0]?.summary ?? "No callback failures logged"}
                />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Operator History">
              <div className="mt-4 space-y-3">
                {campaignOps.audits.slice(0, 4).map((audit) => (
                  <div key={audit.id} className="rounded-2xl border border-line bg-card2 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      {audit.action_type.replace(/_/g, " ")}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-text">
                      {new Date(audit.created_at).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm text-sub">
                      {typeof audit.metadata.summary === "string"
                        ? audit.metadata.summary
                        : `${audit.object_type} · ${audit.object_id}`}
                    </p>
                  </div>
                ))}
                {campaignOps.audits.length === 0 ? (
                  <p className="text-sm text-sub">
                    No platform audit entries are logged for this campaign yet.
                  </p>
                ) : null}
              </div>
            </DetailSidebarSurface>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function getCampaignBlueprintSummary(campaignType: string) {
  const label = campaignType.replace(/_/g, " ");

  switch (campaignType) {
    case "social_growth":
      return "This campaign is tuned for awareness and reach. The biggest lever here is making every quest and raid point at the same message so momentum compounds instead of scattering.";
    case "community_growth":
      return "This campaign is designed to turn attention into owned community. It works best when quests move users from lightweight joins into higher-trust contribution steps.";
    case "onchain":
      return "This campaign is onchain-led, so clarity around wallets, eligibility and claims matters more than raw volume. Keep the flow tight and verification predictable.";
    case "referral":
      return "This campaign grows through contributor distribution. Reward design and abuse resistance matter here because low-quality referrals can distort the whole loop.";
    case "content":
      return "This campaign depends on creator energy and moderation quality. Strong brief-writing and clear proof criteria will matter as much as the incentive layer.";
    default:
      return `This campaign is currently configured as ${label}. Use the builder below to tighten its hook, mechanics and reward loop before scaling traffic into it.`;
  }
}

function AnalyticsStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
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
