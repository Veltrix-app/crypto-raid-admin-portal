"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import AdminShell from "@/components/layout/shell/AdminShell";
import QuestForm from "@/components/forms/quest/QuestForm";
import {
  DetailActionTile,
  DetailBadge,
  DetailHero,
  DetailMetaRow,
  DetailMetricCard,
  DetailSidebarSurface,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { getQuestVerificationPreview } from "@/lib/quest-verification";
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function QuestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [questView, setQuestView] = useState<"operate" | "configure">("operate");

  const getQuestById = useAdminPortalStore((s) => s.getQuestById);
  const updateQuest = useAdminPortalStore((s) => s.updateQuest);
  const deleteQuest = useAdminPortalStore((s) => s.deleteQuest);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);

  const quest = useMemo(
    () => getQuestById(params.id),
    [getQuestById, params.id]
  );

  if (!quest) {
    return (
      <AdminShell>
        <NotFoundState
          title="Quest not found"
          description="This quest could not be resolved from the current workspace state. It may have been deleted, moved to another project or not loaded into the active scope."
        />
      </AdminShell>
    );
  }

  const project = projects.find((p) => p.id === quest.projectId);
  const campaign = campaigns.find((c) => c.id === quest.campaignId);
  const relatedRewards = rewards.filter((reward) => reward.projectId === quest.projectId);
  const relatedSubmissions = submissions.filter((submission) => submission.questId === quest.id);
  const pendingSubmissions = relatedSubmissions.filter(
    (submission) => submission.status === "pending"
  );
  const questBlueprintSummary = getQuestBlueprintSummary(quest.questType);
  const verificationPreview = getQuestVerificationPreview({
    questType: quest.questType,
    verificationType: quest.verificationType,
    verificationProvider: quest.verificationProvider,
    completionMode: quest.completionMode,
    proofRequired: quest.proofRequired,
    proofType: quest.proofType,
    autoApprove: quest.autoApprove,
    verificationConfig: quest.verificationConfig,
  });
  const questReadinessItems = [
    {
      label: "Destination",
      value: quest.actionUrl ? "Connected" : "Missing URL",
      complete: !!quest.actionUrl,
    },
    {
      label: "Verification",
      value: verificationPreview.routeLabel,
      complete:
        !verificationPreview.invalidConfig &&
        verificationPreview.missingConfigKeys.length === 0,
    },
    {
      label: "Proof Flow",
      value: quest.proofRequired ? quest.proofType : "No proof required",
      complete: !quest.proofRequired || quest.proofType !== "none",
    },
    {
      label: "Moderation",
      value: pendingSubmissions.length
        ? `${pendingSubmissions.length} pending`
        : "Clear",
      complete: pendingSubmissions.length === 0,
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <DetailHero
          eyebrow="Quest Detail"
          title={quest.title}
          description={quest.shortDescription || quest.description}
          badges={
            <>
              <DetailBadge>{project?.name || "Unknown Project"}</DetailBadge>
              <DetailBadge>{campaign?.title || "Unknown Campaign"}</DetailBadge>
              <DetailBadge>{quest.questType}</DetailBadge>
              <DetailBadge>{quest.verificationType}</DetailBadge>
              <DetailBadge tone={quest.status === "active" ? "primary" : "default"}>{quest.status}</DetailBadge>
            </>
          }
          actions={
            <button
              onClick={async () => {
                await deleteQuest(quest.id);
                router.push("/quests");
              }}
              className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
            >
              Delete Quest
            </button>
          }
          metrics={
            <>
              <DetailMetricCard label="Project" value={project?.name || "-"} hint="Workspace this quest belongs to." />
              <DetailMetricCard label="Campaign" value={campaign?.title || "-"} hint="Campaign path that contains this quest." />
              <DetailMetricCard label="XP" value={quest.xp} hint="Progression value awarded on completion." />
              <DetailMetricCard label="Auto Approve" value={quest.autoApprove ? "Yes" : "No"} hint="Whether low-risk proofs can clear automatically." />
            </>
          }
        />

        <div className="rounded-[28px] border border-line bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Quest workspace
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">
                Operate mode keeps readiness and moderation visible. Configure mode keeps the builder and settings focused.
              </p>
            </div>
            <SegmentToggle
              value={questView}
              onChange={setQuestView}
              options={[
                { value: "operate", label: "Operate" },
                { value: "configure", label: "Configure" },
              ]}
            />
          </div>
        </div>

        {questView === "operate" ? (
          <>
            <DetailSurface
              eyebrow="Quest Logic"
              title="Builder Summary and Verification Route"
              description={questBlueprintSummary}
            >
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                      Verification Route
                    </p>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      {verificationPreview.routeDescription}
                    </p>
                  </div>
                  <DetailBadge tone="primary">{verificationPreview.routeLabel}</DetailBadge>
                </div>
              </div>
            </DetailSurface>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <DetailSurface
                eyebrow="Quest Readiness"
                title="What this quest still needs"
                description="A concise operator read on destination quality, verification stability and moderation drag."
                aside={<DetailMetricCard label="Pending Reviews" value={pendingSubmissions.length} />}
              >
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {questReadinessItems.map((item) => (
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
                      <p className="mt-3 text-sm text-sub capitalize">{item.value}</p>
                    </div>
                  ))}
                </div>
              </DetailSurface>

              <DetailSurface
                eyebrow="Next Actions"
                title="Keep this campaign moving"
                description="Use these routes to tighten the destination, moderate incoming proofs and connect stronger incentives."
              >
                <div className="mt-5 space-y-3">
                  <DetailActionTile
                    href={quest.actionUrl || "#edit-quest"}
                    label={quest.actionUrl ? "Open quest destination" : "Add quest destination"}
                    description={
                      quest.actionUrl
                        ? "Sanity-check the contributor journey from the exact destination page."
                        : "Point this quest at the live page, post or wallet action before launch."
                    }
                  />
                  <DetailActionTile
                    href="/submissions"
                    label="Review submissions"
                    description={`${relatedSubmissions.length} submission${relatedSubmissions.length === 1 ? "" : "s"} linked to this quest.`}
                  />
                  <DetailActionTile
                    href={relatedRewards.length > 0 ? "/rewards" : "/rewards/new"}
                    label={relatedRewards.length > 0 ? "Link campaign rewards" : "Create a reward"}
                    description={
                      relatedRewards.length > 0
                        ? `${relatedRewards.length} reward${relatedRewards.length === 1 ? "" : "s"} already exist in this project.`
                        : "Add a reward next so contributors see a clear payoff for completing quests."
                    }
                  />
                </div>
              </DetailSurface>
            </div>
          </>
        ) : null}

        {questView === "configure" ? (
          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
            <DetailSurface
              title="Edit Quest"
              description="Update quest logic, verification and timing without leaving the detail workspace."
            >
              <div className="mt-6" id="edit-quest">
                <QuestForm
                  projects={projects}
                  campaigns={campaigns}
                  defaultProjectId={quest.projectId}
                  initialValues={{
                    projectId: quest.projectId,
                    campaignId: quest.campaignId,

                    title: quest.title,
                    description: quest.description,
                    shortDescription: quest.shortDescription || "",

                    type: quest.type,
                    questType: quest.questType,
                    platform: quest.platform || "custom",

                    xp: quest.xp,
                    actionLabel: quest.actionLabel,
                    actionUrl: quest.actionUrl || "",

                    proofRequired: quest.proofRequired,
                    proofType: quest.proofType,

                    autoApprove: quest.autoApprove,
                    verificationType: quest.verificationType,
                    verificationProvider: quest.verificationProvider,
                    completionMode: quest.completionMode,
                    verificationConfig: quest.verificationConfig || "",

                    isRepeatable: quest.isRepeatable,
                    cooldownSeconds: quest.cooldownSeconds,
                    maxCompletionsPerUser: quest.maxCompletionsPerUser,
                    sortOrder: quest.sortOrder,

                    startsAt: quest.startsAt || "",
                    endsAt: quest.endsAt || "",

                    status: quest.status,
                  }}
                  submitLabel="Update Quest"
                  onSubmit={async (values) => {
                    await updateQuest(quest.id, values);
                  }}
                />
              </div>
            </DetailSurface>

            <div className="space-y-6">
              <DetailSidebarSurface title="Quest Settings">
                <div className="mt-4 space-y-4">
                  <DetailMetaRow label="Quest Type" value={quest.questType} />
                  <DetailMetaRow label="Platform" value={quest.platform || "-"} />
                  <DetailMetaRow label="Verification" value={quest.verificationType} />
                  <DetailMetaRow label="Proof Required" value={quest.proofRequired ? "Yes" : "No"} />
                  <DetailMetaRow label="Proof Type" value={quest.proofType} />
                  <DetailMetaRow label="Repeatable" value={quest.isRepeatable ? "Yes" : "No"} />
                  <DetailMetaRow label="Sort Order" value={quest.sortOrder} />
                  <DetailMetaRow label="Starts At" value={quest.startsAt || "-"} />
                  <DetailMetaRow label="Ends At" value={quest.endsAt || "-"} />
                </div>
              </DetailSidebarSurface>

              <DetailSidebarSurface title="Verification Rules">
                <div className="mt-4 space-y-4">
                  <DetailMetaRow label="Route" value={verificationPreview.routeLabel} />
                  <DetailMetaRow
                    label="Required Config"
                    value={
                      verificationPreview.requiredConfigKeys.length
                        ? verificationPreview.requiredConfigKeys.join(", ")
                        : "No required keys"
                    }
                  />
                  <DetailMetaRow
                    label="Missing Config"
                    value={
                      verificationPreview.invalidConfig
                        ? "Invalid JSON"
                        : verificationPreview.missingConfigKeys.length
                          ? verificationPreview.missingConfigKeys.join(", ")
                          : "None"
                    }
                  />
                  <DetailMetaRow
                    label="Proof Expectation"
                    value={verificationPreview.proofExpectation}
                  />
                </div>
              </DetailSidebarSurface>

              <DetailSidebarSurface title="Action">
                <div className="mt-4 space-y-4">
                  <DetailMetaRow label="Action Label" value={quest.actionLabel} />
                  <DetailMetaRow label="Action URL" value={quest.actionUrl || "-"} />
                  <DetailMetaRow label="Submissions" value={relatedSubmissions.length} />
                  <DetailMetaRow label="Pending Reviews" value={pendingSubmissions.length} />
                </div>
              </DetailSidebarSurface>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}

function getQuestBlueprintSummary(questType: string) {
  const questTypeLabel = questType.replace(/_/g, " ");

  switch (questType) {
    case "social_follow":
      return "This quest is set up as a social growth touchpoint. The critical thing here is making the target account and CTA unmistakably clear so contributors can complete it in one tap.";
    case "telegram_join":
    case "discord_join":
      return "This quest is positioned as a community entry point. Make sure the invite destination is stable and the moderation team is ready for new members once traffic starts flowing.";
    case "wallet_connect":
    case "token_hold":
    case "nft_hold":
    case "onchain_tx":
      return "This quest acts as a wallet or onchain verification step. The most important part is that the verification config matches the exact asset, contract or action you want to validate.";
    case "referral":
      return "This quest is a growth loop. Treat the reward and verification rules carefully so projects attract genuine referrals instead of low-quality farming.";
    case "manual_proof":
      return "This quest depends on human review, so the proof instructions need to be extremely explicit. Clear proof rules reduce moderation load and improve submission quality.";
    default:
      return `This quest is currently configured as ${questTypeLabel}. Use the builder to tighten the action destination, verification and reward loop before making it a core campaign step.`;
  }
}
