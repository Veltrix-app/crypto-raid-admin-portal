"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import AdminShell from "@/components/layout/shell/AdminShell";
import RewardForm from "@/components/forms/reward/RewardForm";
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
import { NotFoundState } from "@/components/layout/state/StatePrimitives";
import { deriveLifecycleState } from "@/lib/platform/core-lifecycle";
import {
  canArchiveProjectContent,
  getPrimaryProjectContentAction,
  type ProjectContentAction,
} from "@/lib/projects/content-actions";
import { useProjectOps } from "@/hooks/useProjectOps";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [rewardView, setRewardView] = useState<"operate" | "configure">("operate");

  const getRewardById = useAdminPortalStore((s) => s.getRewardById);
  const updateReward = useAdminPortalStore((s) => s.updateReward);
  const deleteReward = useAdminPortalStore((s) => s.deleteReward);
  const runProjectContentAction = useAdminPortalStore((s) => s.runProjectContentAction);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const claims = useAdminPortalStore((s) => s.claims);
  const quests = useAdminPortalStore((s) => s.quests);
  const [runningAction, setRunningAction] = useState<ProjectContentAction | null>(null);
  const [actionMessage, setActionMessage] = useState<{
    tone: "error" | "success";
    text: string;
  } | null>(null);

  const reward = useMemo(
    () => getRewardById(params.id),
    [getRewardById, params.id]
  );
  const rewardOps = useProjectOps(reward?.projectId, {
    objectType: "reward",
    objectId: params.id,
  });

  if (!reward) {
    return (
      <AdminShell>
        <NotFoundState
          title="Reward not found"
          description="This reward could not be resolved from the active portal state. It may have been deleted, moved out of scope or not loaded into the current workspace."
        />
      </AdminShell>
    );
  }

  const currentReward = reward;
  const project = projects.find((p) => p.id === reward.projectId);
  const lifecycleState = deriveLifecycleState(currentReward.status, "draft");
  const primaryLifecycleAction = getPrimaryProjectContentAction("reward", currentReward.status);
  const canArchiveLifecycleAction = canArchiveProjectContent("reward", currentReward.status);
  const campaign = campaigns.find((c) => c.id === currentReward.campaignId);
  const relatedClaims = claims.filter((claim) => claim.rewardId === currentReward.id);
  const pendingClaims = relatedClaims.filter((claim) => claim.status === "pending");
  const relatedQuests = quests.filter((quest) => quest.projectId === currentReward.projectId);
  const rewardSummary = getRewardBlueprintSummary(currentReward.rewardType);
  const rewardReadinessItems = [
    {
      label: "Fulfillment",
      value: reward.claimMethod.replace(/_/g, " "),
      complete: true,
    },
    {
      label: "Visibility",
      value: reward.visible ? "Visible in app" : "Hidden",
      complete: reward.visible,
    },
    {
      label: "Claim Flow",
      value: reward.claimable ? "Claimable" : "Passive unlock",
      complete: true,
    },
    {
      label: "Demand",
      value: pendingClaims.length ? `${pendingClaims.length} pending claim${pendingClaims.length === 1 ? "" : "s"}` : "No pending claims",
      complete: pendingClaims.length === 0,
    },
  ];
  const overrideActions = [
    {
      label: "Pause reward",
      description:
        "Stop fresh demand from piling into this reward while the claim or stock posture is being corrected.",
      objectType: "reward" as const,
      objectId: reward.id,
      overrideType: "pause" as const,
      reason: "Reward paused from detail workspace.",
    },
    {
      label: "Manual complete",
      description:
        "Mark this reward for manual completion when the team is handling a claim or delivery path outside automation.",
      objectType: "reward" as const,
      objectId: reward.id,
      overrideType: "manual_complete" as const,
      reason: "Manual completion path queued from reward detail.",
    },
  ];

  async function handleLifecycleAction(action: ProjectContentAction) {
    setActionMessage(null);
    setRunningAction(action);

    try {
      const result = await runProjectContentAction({
        projectId: currentReward.projectId,
        objectType: "reward",
        objectId: currentReward.id,
        action,
      });

      if (action === "duplicate") {
        router.push(`/rewards/${result.targetId}`);
        return;
      }

      const successLabel =
        action === "publish"
          ? "Reward published."
          : action === "pause"
            ? "Reward paused."
            : action === "resume"
              ? "Reward resumed."
              : "Reward archived.";

      setActionMessage({ tone: "success", text: successLabel });
    } catch (error) {
      setActionMessage({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update reward lifecycle.",
      });
    } finally {
      setRunningAction(null);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-4">
        <DetailHero
          eyebrow="Reward Detail"
          title={reward.title}
          description={reward.description}
          badges={
            <>
              <DetailBadge>{project?.name || "Unknown Project"}</DetailBadge>
              {campaign ? <DetailBadge>{campaign.title}</DetailBadge> : null}
              <DetailBadge>{reward.rewardType}</DetailBadge>
              <DetailBadge>{reward.rarity}</DetailBadge>
              <DetailBadge>{reward.claimMethod}</DetailBadge>
              <LifecycleStatusPill state={lifecycleState} fallback="draft" />
            </>
          }
          actions={
            <>
              <button
                onClick={() => void handleLifecycleAction("duplicate")}
                disabled={runningAction !== null}
                className="rounded-[14px] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[12px] font-semibold text-text transition hover:border-primary/30 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningAction === "duplicate" ? "Duplicating..." : "Duplicate"}
              </button>
              {primaryLifecycleAction ? (
                <button
                  onClick={() => void handleLifecycleAction(primaryLifecycleAction.action)}
                  disabled={runningAction !== null}
                  className="rounded-[14px] border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-[12px] font-bold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="rounded-[14px] border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-[12px] font-bold text-amber-200 transition hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {runningAction === "archive" ? "Archiving..." : "Archive"}
                </button>
              ) : null}
              <button
                onClick={async () => {
                  await deleteReward(reward.id);
                  router.push("/rewards");
                }}
                className="rounded-[14px] border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[12px] font-bold text-rose-300 transition hover:bg-rose-500/15"
              >
                Delete Reward
              </button>
            </>
          }
          metrics={
            <>
              <DetailMetricCard label="Project" value={project?.name || "-"} hint="Workspace owning this incentive." />
              <DetailMetricCard label="Cost" value={reward.cost} hint="XP pressure required to unlock it." />
              <DetailMetricCard label="Claimable" value={reward.claimable ? "Yes" : "No"} hint="Whether contributors can actively claim it." />
              <DetailMetricCard label="Visible" value={reward.visible ? "Yes" : "No"} hint="Whether it currently surfaces in the app." />
            </>
          }
        />

        {actionMessage ? (
          <div
            className={`rounded-[18px] border px-4 py-3 text-[12px] font-semibold ${
              actionMessage.tone === "success"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200"
            }`}
          >
            {actionMessage.text}
          </div>
        ) : null}

        <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                Reward workspace
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-sub">
                Operate mode keeps claim and readiness context visible. Configure mode keeps the builder and settings focused.
              </p>
            </div>
            <SegmentToggle
              value={rewardView}
              onChange={setRewardView}
              options={[
                { value: "operate", label: "Operate" },
                { value: "configure", label: "Configure" },
              ]}
            />
          </div>
        </div>

        {rewardView === "operate" ? (
          <>
            <DetailSurface
              eyebrow="Reward posture"
              title="Keep this reward legible and deliverable"
              description={rewardSummary}
              aside={<DetailMetricCard label="Pending claims" value={pendingClaims.length} />}
            >
              <div className="space-y-3">
                <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] px-4 py-4">
                  <p className="text-sm leading-7 text-sub">
                    Use the settings below to keep scarcity, visibility and claim pressure aligned with how this reward should feel inside the contributor journey.
                  </p>
                </div>
                {rewardReadinessItems.map((item) => (
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
              title="Keep the reward loop healthy"
              description="Use these routes to manage demand, connect new quest pressure and tune scarcity."
            >
              <div className="space-y-3">
                <DetailActionTile
                  href="/claims"
                  label="Review reward claims"
                  description={`${relatedClaims.length} claim${relatedClaims.length === 1 ? "" : "s"} currently route through this reward.`}
                />
                <DetailActionTile
                  href={relatedQuests.length > 0 ? "/quests" : "/quests/new"}
                  label={relatedQuests.length > 0 ? "Connect to active quests" : "Create a quest"}
                  description={
                    relatedQuests.length > 0
                      ? `${relatedQuests.length} quest${relatedQuests.length === 1 ? "" : "s"} exist in this project and can be used to drive reward demand.`
                      : "Add a quest next so contributors have a clear path to unlock this reward."
                  }
                />
                <DetailActionTile
                  href="#edit-reward"
                  label="Tune stock and delivery"
                  description="Use the builder below to align scarcity, visibility and claim behavior with the intended campaign pressure."
                />
              </div>
            </DetailSurface>

            <DetailSurface
              eyebrow="Claim pressure"
              title="How this reward will behave under demand"
              description="Use this read to judge whether the reward can absorb claims cleanly or whether stock, delivery method and visibility will start creating operator drag."
            >
              <div className="grid gap-3 md:grid-cols-4">
                <RewardSignalCard
                  label="Claims"
                  value={relatedClaims.length}
                  hint="All claim volume currently attached to this reward."
                />
                <RewardSignalCard
                  label="Pending"
                  value={pendingClaims.length}
                  hint="Open fulfillment or review work still waiting on an operator."
                />
                <RewardSignalCard
                  label="Stock"
                  value={reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-"}
                  hint="The current scarcity posture contributors will hit."
                />
                <RewardSignalCard
                  label="Method"
                  value={reward.claimMethod.replace(/_/g, " ")}
                  hint="The delivery path currently configured for this reward."
                />
              </div>
            </DetailSurface>

            <DetailSurface
              eyebrow="Platform Core"
              title="Lifecycle, incidents and overrides"
              description="This operator rail keeps reward-side claim issues and manual pause or completion controls attached directly to the reward."
            >
              <div className="mt-4 grid gap-4 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
                <div className="space-y-4">
                  <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                          Lifecycle posture
                        </p>
                        <p className="mt-2 text-sm leading-6 text-sub">
                          Reward state is explicit so operators can tell when this incentive is
                          live, paused or already in a recovery path.
                        </p>
                      </div>
                      <LifecycleStatusPill state={lifecycleState} fallback="draft" />
                    </div>
                  </div>

                  <OpsIncidentPanel
                    incidents={rewardOps.openIncidents}
                    emptyTitle="No reward incidents"
                    emptyDescription="No provider, runtime or claim-delivery incidents are currently open for this reward."
                    workingIncidentId={rewardOps.workingIncidentId}
                    onUpdateStatus={rewardOps.updateIncidentStatus}
                  />
                </div>

                <OpsOverridePanel
                  overrides={rewardOps.activeOverrides}
                  quickActions={overrideActions}
                  creatingOverride={rewardOps.creatingOverride}
                  workingOverrideId={rewardOps.workingOverrideId}
                  onCreateOverride={rewardOps.createOverride}
                  onResolveOverride={rewardOps.resolveOverride}
                />
              </div>
            </DetailSurface>
          </>
        ) : null}

        {rewardView === "configure" ? (
          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr] xl:items-start">
            <DetailSurface
              title="Edit Reward"
              description="Update reward settings, fulfillment and visibility without leaving the detail workspace."
            >
              <div className="mt-6" id="edit-reward">
                <RewardForm
                  projects={projects}
                  campaigns={campaigns}
                  defaultProjectId={reward.projectId}
                  initialValues={{
                    projectId: reward.projectId,
                    campaignId: reward.campaignId || "",

                    title: reward.title,
                    description: reward.description,

                    type: reward.type,
                    rewardType: reward.rewardType,

                    rarity: reward.rarity,

                    cost: reward.cost,
                    claimable: reward.claimable,
                    visible: reward.visible,

                    icon: reward.icon || "",
                    imageUrl: reward.imageUrl || "",

                    stock: reward.stock,
                    unlimitedStock: reward.unlimitedStock,

                    claimMethod: reward.claimMethod,
                    deliveryConfig: reward.deliveryConfig || "",

                    status: reward.status,
                  }}
                  submitLabel="Update Reward"
                  onSubmit={async (values) => {
                    await updateReward(reward.id, values);
                  }}
                />
              </div>
            </DetailSurface>

            <div className="space-y-4">
              <DetailSidebarSurface title="Reward Settings">
                <div className="mt-4 space-y-4">
                  <DetailMetaRow label="Reward Type" value={reward.rewardType} />
                  <DetailMetaRow label="Rarity" value={reward.rarity} />
                  <DetailMetaRow label="Claim Method" value={reward.claimMethod} />
                  <DetailMetaRow label="Claimable" value={reward.claimable ? "Yes" : "No"} />
                  <DetailMetaRow label="Visible" value={reward.visible ? "Yes" : "No"} />
                  <DetailMetaRow
                    label="Stock"
                    value={reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-"}
                  />
                </div>
              </DetailSidebarSurface>

              <DetailSidebarSurface title="Assets">
                <div className="mt-4 space-y-4">
                  <DetailMetaRow label="Icon URL" value={reward.icon || "-"} />
                  <DetailMetaRow label="Image URL" value={reward.imageUrl || "-"} />
                  <DetailMetaRow label="Claims" value={relatedClaims.length} />
                  <DetailMetaRow label="Pending Claims" value={pendingClaims.length} />
                </div>
              </DetailSidebarSurface>

              <DetailSidebarSurface title="Operator History">
                <div className="mt-4 space-y-3">
                  {rewardOps.audits.slice(0, 4).map((audit) => (
                    <div key={audit.id} className="rounded-[14px] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5">
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
                  {rewardOps.audits.length === 0 ? (
                    <p className="text-sm text-sub">
                      No platform audit entries are logged for this reward yet.
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

function getRewardBlueprintSummary(rewardType: string) {
  const rewardTypeLabel = rewardType.replace(/_/g, " ");

  switch (rewardType) {
    case "token":
    case "nft":
      return "This reward is configured as an onchain incentive. Make sure the delivery config, network and claimant expectations are explicit before campaign traffic scales up.";
    case "role":
    case "access":
      return "This reward unlocks access rather than a transferable asset. The smoother the delivery step, the more credible the whole campaign loop feels to contributors.";
    case "allowlist":
      return "This reward is scarcity-driven. Clear stock limits, eligibility rules and claim timing matter here, because ambiguity will create support load fast.";
    case "badge":
      return "This reward reinforces reputation and progression. It works best when paired with quests that feel meaningful enough to justify a visible achievement.";
    case "physical":
      return "This reward depends on manual fulfillment, so it needs especially clear stock, region and delivery instructions to stay operationally manageable.";
    default:
      return `This reward is currently configured as ${rewardTypeLabel}. Tighten the claim method, stock logic and campaign connection so it becomes an intentional part of the reward loop.`;
  }
}

function RewardSignalCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.04] bg-white/[0.025] px-3.5 py-3.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-2 text-[1.18rem] font-extrabold tracking-[-0.03em] text-text">{value}</p>
      <p className="mt-2 text-[11px] leading-5 text-sub">{hint}</p>
    </div>
  );
}
