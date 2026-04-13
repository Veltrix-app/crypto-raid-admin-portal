"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
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
import { createClient } from "@/lib/supabase/client";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { DbVerificationResult } from "@/types/database";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getCampaignById = useAdminPortalStore((s) => s.getCampaignById);
  const updateCampaign = useAdminPortalStore((s) => s.updateCampaign);
  const deleteCampaign = useAdminPortalStore((s) => s.deleteCampaign);
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

  const campaign = useMemo(
    () => getCampaignById(params.id),
    [getCampaignById, params.id]
  );

  if (!campaign) {
    return (
      <AdminShell>
        <NotFoundState
          title="Campaign not found"
          description="This campaign could not be resolved from the current admin portal store state. It may have been deleted, moved out of scope or never loaded into the active workspace."
        />
      </AdminShell>
    );
  }

  const currentCampaign = campaign;
  const project = projects.find((p) => p.id === campaign.projectId);
  const relatedRaids = raids.filter((r) => r.campaignId === campaign.id);
  const relatedQuests = quests.filter((q) => q.campaignId === campaign.id);
  const relatedRewards = rewards.filter((reward) => reward.campaignId === campaign.id);
  const relatedQuestIds = new Set(relatedQuests.map((quest) => quest.id));
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
      value: campaign.shortDescription ? "Hook defined" : "Needs hook",
      complete: !!campaign.shortDescription,
    },
    {
      label: "Timing",
      value: campaign.startsAt && campaign.endsAt ? "Scheduled window" : "No full window",
      complete: !!campaign.startsAt && !!campaign.endsAt,
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

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function loadCampaignSnapshot() {
      const { data: dailyRow } = await supabase
        .from("campaign_analytics_daily")
        .select("*")
        .eq("campaign_id", currentCampaign.id)
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
  }, [currentCampaign.id, relatedQuests, relatedSubmissions, relatedFlags]);

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
              <DetailBadge tone={campaign.status === "active" ? "primary" : "default"}>
                {campaign.status}
              </DetailBadge>
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
              <DetailMetricCard label="Participants" value={campaign.participants} hint="Current contributor volume attached here." />
              <DetailMetricCard label="Completion" value={`${campaign.completionRate}%`} hint="Current finish rate across the campaign path." />
              <DetailMetricCard label="Submissions" value={snapshot?.submissions ?? relatedSubmissions.length} hint="Total quest submissions routed into this campaign." />
              <DetailMetricCard label="Auto Approved" value={snapshot?.autoApproved ?? 0} hint="Submissions cleared by rules without manual work." />
              <DetailMetricCard label="Open Flags" value={snapshot?.openFlags ?? relatedFlags.filter((flag) => flag.status === "open").length} hint="Trust or moderation items still unresolved." />
              <DetailMetricCard label="Avg Confidence" value={`${snapshot?.averageConfidence ?? 0}%`} hint="Verification confidence across recent activity." />
            </>
          }
        />

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
            title="Build out the campaign loop"
            description="Keep the campaign moving by filling the weakest part of the contributor journey next."
          >
            <div className="mt-5 space-y-3">
              <DetailActionTile
                href={relatedQuests.length > 0 ? "/quests" : "/quests/new"}
                label={relatedQuests.length > 0 ? "Review quests" : "Create first quest"}
                description={
                  relatedQuests.length > 0
                    ? `${relatedQuests.length} quest${relatedQuests.length === 1 ? "" : "s"} already shape this campaign.`
                    : "Quests are the backbone of the contributor journey, so add one next."
                }
              />
              <DetailActionTile
                href={relatedRaids.length > 0 ? "/raids" : "/raids/new"}
                label={relatedRaids.length > 0 ? "Review raids" : "Add a raid"}
                description={
                  relatedRaids.length > 0
                    ? `${relatedRaids.length} raid${relatedRaids.length === 1 ? "" : "s"} are linked to this campaign.`
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
                <DetailMetaRow label="Visibility" value={campaign.visibility} />
                <DetailMetaRow label="Featured" value={campaign.featured ? "Yes" : "No"} />
                <DetailMetaRow label="Starts At" value={campaign.startsAt || "-"} />
                <DetailMetaRow label="Ends At" value={campaign.endsAt || "-"} />
              </div>
            </DetailSidebarSurface>

            <DetailSidebarSurface title="Linked Content">
              <div className="mt-4 grid gap-3">
                <DetailMetaRow label="Raids" value={relatedRaids.length} />
                <DetailMetaRow label="Quests" value={relatedQuests.length} />
                <DetailMetaRow label="Rewards" value={relatedRewards.length} />
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
