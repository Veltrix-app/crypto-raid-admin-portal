"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
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
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Campaign not found</h1>
          <p className="mt-2 text-sm text-sub">
            This campaign could not be found in the admin portal store.
          </p>
        </div>
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
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Campaign Detail
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {campaign.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{project?.name || "Unknown Project"}</Badge>
              <Badge className="capitalize">{campaign.campaignType}</Badge>
              <Badge className="capitalize">{campaign.visibility}</Badge>
              <Badge className="capitalize">{campaign.status}</Badge>
              {campaign.featured ? <Badge>Featured</Badge> : null}
            </div>

            <p className="mt-4 text-sm text-sub">{campaign.shortDescription}</p>

            {campaign.longDescription ? (
              <p className="mt-3 text-sm leading-6 text-sub">
                {campaign.longDescription}
              </p>
            ) : null}

            <div className="mt-5 rounded-2xl border border-line bg-card2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Builder Summary
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">
                {getCampaignBlueprintSummary(campaign.campaignType)}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await deleteCampaign(campaign.id);
              router.push("/campaigns");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Campaign
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Project" value={project?.name || "-"} />
          <InfoCard label="XP Budget" value={campaign.xpBudget} />
          <InfoCard label="Participants" value={campaign.participants} />
          <InfoCard label="Progress" value={`${campaign.completionRate}%`} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Submissions" value={snapshot?.submissions ?? relatedSubmissions.length} />
          <InfoCard label="Auto Approved" value={snapshot?.autoApproved ?? 0} />
          <InfoCard label="Open Flags" value={snapshot?.openFlags ?? relatedFlags.filter((flag) => flag.status === "open").length} />
          <InfoCard label="Avg Confidence" value={`${snapshot?.averageConfidence ?? 0}%`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Campaign Readiness
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  What this campaign still needs
                </h2>
              </div>

              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Active Mechanics
                </p>
                <p className="mt-2 text-2xl font-extrabold text-text">
                  {relatedQuests.length + relatedRaids.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {readinessItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-line bg-card2 p-4"
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
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Next Actions
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-text">
              Build out the campaign loop
            </h2>

            <div className="mt-5 space-y-3">
              <ActionLink
                href={relatedQuests.length > 0 ? "/quests" : "/quests/new"}
                label={relatedQuests.length > 0 ? "Review quests" : "Create first quest"}
                description={
                  relatedQuests.length > 0
                    ? `${relatedQuests.length} quest${relatedQuests.length === 1 ? "" : "s"} already shape this campaign.`
                    : "Quests are the backbone of the contributor journey, so add one next."
                }
              />
              <ActionLink
                href={relatedRaids.length > 0 ? "/raids" : "/raids/new"}
                label={relatedRaids.length > 0 ? "Review raids" : "Add a raid"}
                description={
                  relatedRaids.length > 0
                    ? `${relatedRaids.length} raid${relatedRaids.length === 1 ? "" : "s"} are linked to this campaign.`
                    : "Raids help layer in time-sensitive social momentum on top of the quest structure."
                }
              />
              <ActionLink
                href={relatedRewards.length > 0 ? "/rewards" : "/rewards/new"}
                label={relatedRewards.length > 0 ? "Review rewards" : "Create reward loop"}
                description={
                  relatedRewards.length > 0
                    ? `${relatedRewards.length} reward${relatedRewards.length === 1 ? "" : "s"} complete the incentive loop here.`
                    : "Campaigns convert better when the payoff is visible, so connect a reward next."
                }
              />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Analytics Snapshot
              </p>
              <h2 className="mt-2 text-xl font-extrabold text-text">
                How this campaign is actually behaving
              </h2>
            </div>
            <Link
              href="/analytics"
              className="rounded-2xl border border-line bg-card2 px-4 py-3 font-semibold"
            >
              Open Analytics
            </Link>
          </div>

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
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Campaign</h2>
            <p className="mt-2 text-sm text-sub">
              Update this campaign's content, visibility and timing.
            </p>

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
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Campaign Assets</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Slug" value={campaign.slug || "-"} />
                <DetailRow label="Type" value={campaign.campaignType} />
                <DetailRow label="Visibility" value={campaign.visibility} />
                <DetailRow label="Featured" value={campaign.featured ? "Yes" : "No"} />
                <DetailRow label="Starts At" value={campaign.startsAt || "-"} />
                <DetailRow label="Ends At" value={campaign.endsAt || "-"} />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Linked Content</h2>

              <div className="mt-4 grid gap-3">
                <DetailRow label="Raids" value={relatedRaids.length} />
                <DetailRow label="Quests" value={relatedQuests.length} />
                <DetailRow label="Rewards" value={relatedRewards.length} />
              </div>
            </div>
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

function ActionLink({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-line bg-card2 p-4 transition hover:border-primary/40"
    >
      <p className="font-bold text-text">{label}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
    </Link>
  );
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
