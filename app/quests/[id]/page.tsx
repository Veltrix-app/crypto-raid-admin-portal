"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PortalBillingBlockNotice } from "@/components/billing/PortalBillingBlockNotice";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import AdminShell from "@/components/layout/shell/AdminShell";
import QuestForm from "@/components/forms/quest/QuestForm";
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
  DetailStatusRow,
  DetailSurface,
} from "@/components/layout/detail/DetailPrimitives";
import { getQuestVerificationPreview } from "@/lib/quest-verification";
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
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function QuestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [questView, setQuestView] = useState<"operate" | "configure">("operate");

  const getQuestById = useAdminPortalStore((s) => s.getQuestById);
  const updateQuest = useAdminPortalStore((s) => s.updateQuest);
  const deleteQuest = useAdminPortalStore((s) => s.deleteQuest);
  const runProjectContentAction = useAdminPortalStore((s) => s.runProjectContentAction);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);
  const submissions = useAdminPortalStore((s) => s.submissions);
  const [runningAction, setRunningAction] = useState<ProjectContentAction | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);
  const [actionBlock, setActionBlock] = useState<BillingLimitBlock | null>(null);

  const quest = useMemo(
    () => getQuestById(params.id),
    [getQuestById, params.id]
  );
  const questOps = useProjectOps(quest?.projectId, {
    objectType: "quest",
    objectId: params.id,
  });

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

  const currentQuest = quest;
  const project = projects.find((p) => p.id === quest.projectId);
  const lifecycleState = deriveLifecycleState(currentQuest.status, "draft");
  const primaryLifecycleAction = getPrimaryProjectContentAction("quest", currentQuest.status);
  const canArchiveLifecycleAction = canArchiveProjectContent("quest", currentQuest.status);
  const campaign = campaigns.find((c) => c.id === currentQuest.campaignId);
  const relatedRewards = rewards.filter((reward) => reward.projectId === currentQuest.projectId);
  const relatedSubmissions = submissions.filter((submission) => submission.questId === currentQuest.id);
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
  const overrideActions = [
    {
      label: "Pause quest",
      description:
        "Stop routing fresh completions into this quest while you stabilize the action or proof logic.",
      objectType: "quest" as const,
      objectId: quest.id,
      overrideType: "pause" as const,
      reason: "Quest paused from detail workspace.",
    },
    {
      label: "Retry verification",
      description:
        "Queue a manual retry when the next move is re-running verification or proof recovery.",
      objectType: "quest" as const,
      objectId: quest.id,
      overrideType: "manual_retry" as const,
      reason: "Manual verification retry queued from quest detail.",
    },
  ];

  async function handleLifecycleAction(action: ProjectContentAction) {
    setActionMessage(null);
    setActionBlock(null);
    setRunningAction(action);

    try {
      const result = await runProjectContentAction({
        projectId: currentQuest.projectId,
        objectType: "quest",
        objectId: currentQuest.id,
        action,
      });

      if (action === "duplicate") {
        router.push(`/quests/${result.targetId}`);
        return;
      }

      const successLabel =
        action === "publish"
          ? "Quest published."
          : action === "pause"
            ? "Quest paused."
            : action === "resume"
              ? "Quest resumed."
              : "Quest archived.";

      setActionMessage({ tone: "success", text: successLabel });
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
            : "Failed to update quest lifecycle.",
      });
    } finally {
      setRunningAction(null);
    }
  }

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
              <LifecycleStatusPill state={lifecycleState} fallback="draft" />
            </>
          }
          actions={
            <>
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
                  await deleteQuest(quest.id);
                  router.push("/quests");
                }}
                className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition hover:bg-rose-500/15"
              >
                Delete Quest
              </button>
            </>
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

        {actionBlock ? (
          <PortalBillingBlockNotice
            block={actionBlock}
            title="Making another quest live needs more plan capacity"
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

        <div className="rounded-[28px] border border-white/6 bg-white/[0.025] p-5">
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
              eyebrow="Quest posture"
              title="Keep this quest readable and verifiable"
              description={questBlueprintSummary}
              aside={<DetailMetricCard label="Pending reviews" value={pendingSubmissions.length} />}
            >
              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                        Verification route
                      </p>
                      <p className="mt-2 text-sm leading-6 text-sub">
                        {verificationPreview.routeDescription}
                      </p>
                    </div>
                    <DetailBadge tone="primary">{verificationPreview.routeLabel}</DetailBadge>
                  </div>
                </div>
                {questReadinessItems.map((item) => (
                  <DetailStatusRow
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    tone={item.complete ? "primary" : "warning"}
                  />
                ))}
              </div>
            </DetailSurface>

            <DetailSurface
              eyebrow="Next actions"
              title="Keep this quest moving"
              description="Use these routes to tighten the destination, moderate incoming proofs and connect stronger incentives."
            >
              <div className="space-y-3">
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

            <DetailSurface
              eyebrow="Verification pressure"
              title="How this quest will behave under load"
              description="Use this read to judge whether the quest can absorb traffic cleanly or whether moderation and proof friction will start to pile up."
            >
              <div className="grid gap-3 md:grid-cols-4">
                <QuestSignalCard
                  label="Submissions"
                  value={relatedSubmissions.length}
                  hint="All submission volume currently attached to this quest."
                />
                <QuestSignalCard
                  label="Pending"
                  value={pendingSubmissions.length}
                  hint="Open review load that still needs an operator or automated clear."
                />
                <QuestSignalCard
                  label="Rewards"
                  value={relatedRewards.length}
                  hint="Reward options already available in the parent project."
                />
                <QuestSignalCard
                  label="Route"
                  value={verificationPreview.routeLabel}
                  hint="The current verification path contributors will experience."
                />
              </div>
            </DetailSurface>

            <DetailSurface
              eyebrow="Platform Core"
              title="Lifecycle, incidents and overrides"
              description="This operator rail keeps quest verification issues and manual pause or retry controls attached directly to the quest."
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
                          Quest state is explicit so the team can tell when this mission is live,
                          paused or already in a recovery posture.
                        </p>
                      </div>
                      <LifecycleStatusPill state={lifecycleState} fallback="draft" />
                    </div>
                  </div>

                  <OpsIncidentPanel
                    incidents={questOps.openIncidents}
                    emptyTitle="No quest incidents"
                    emptyDescription="No verification, provider or runtime incidents are currently open for this quest."
                    workingIncidentId={questOps.workingIncidentId}
                    onUpdateStatus={questOps.updateIncidentStatus}
                  />
                </div>

                <OpsOverridePanel
                  overrides={questOps.activeOverrides}
                  quickActions={overrideActions}
                  creatingOverride={questOps.creatingOverride}
                  workingOverrideId={questOps.workingOverrideId}
                  onCreateOverride={questOps.createOverride}
                  onResolveOverride={questOps.resolveOverride}
                />
              </div>
            </DetailSurface>
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

              <DetailSidebarSurface title="Operator History">
                <div className="mt-4 space-y-3">
                  {questOps.audits.slice(0, 4).map((audit) => (
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
                  {questOps.audits.length === 0 ? (
                    <p className="text-sm text-sub">
                      No platform audit entries are logged for this quest yet.
                    </p>
                  ) : null}
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

function QuestSignalCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-white/[0.025] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}
