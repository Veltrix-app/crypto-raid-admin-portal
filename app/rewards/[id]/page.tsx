"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import RewardForm from "@/components/forms/reward/RewardForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RewardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getRewardById = useAdminPortalStore((s) => s.getRewardById);
  const updateReward = useAdminPortalStore((s) => s.updateReward);
  const deleteReward = useAdminPortalStore((s) => s.deleteReward);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const claims = useAdminPortalStore((s) => s.claims);
  const quests = useAdminPortalStore((s) => s.quests);

  const reward = useMemo(
    () => getRewardById(params.id),
    [getRewardById, params.id]
  );

  if (!reward) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Reward not found</h1>
          <p className="mt-2 text-sm text-sub">
            This reward could not be found in the admin portal store.
          </p>
        </div>
      </AdminShell>
    );
  }

  const project = projects.find((p) => p.id === reward.projectId);
  const campaign = campaigns.find((c) => c.id === reward.campaignId);
  const relatedClaims = claims.filter((claim) => claim.rewardId === reward.id);
  const pendingClaims = relatedClaims.filter((claim) => claim.status === "pending");
  const relatedQuests = quests.filter((quest) => quest.projectId === reward.projectId);
  const rewardSummary = getRewardBlueprintSummary(reward.rewardType);
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

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Reward Detail
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {reward.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{project?.name || "Unknown Project"}</Badge>
              {campaign ? <Badge>{campaign.title}</Badge> : null}
              <Badge className="capitalize">{reward.rewardType}</Badge>
              <Badge className="capitalize">{reward.rarity}</Badge>
              <Badge className="capitalize">{reward.claimMethod}</Badge>
              <Badge className="capitalize">{reward.status}</Badge>
            </div>

            <p className="mt-4 text-sm text-sub">{reward.description}</p>

            <div className="mt-5 rounded-2xl border border-line bg-card2 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Builder Summary
              </p>
              <p className="mt-2 text-sm leading-6 text-sub">{rewardSummary}</p>
            </div>
          </div>

          <button
            onClick={async () => {
              await deleteReward(reward.id);
              router.push("/rewards");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Reward
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Project" value={project?.name || "-"} />
          <InfoCard label="Cost" value={reward.cost} />
          <InfoCard label="Claimable" value={reward.claimable ? "Yes" : "No"} />
          <InfoCard label="Visible" value={reward.visible ? "Yes" : "No"} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Reward Readiness
                </p>
                <h2 className="mt-2 text-xl font-extrabold text-text">
                  What this reward still needs
                </h2>
              </div>

              <div className="rounded-2xl border border-line bg-card2 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  Pending Claims
                </p>
                <p className="mt-2 text-2xl font-extrabold text-text">
                  {pendingClaims.length}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {rewardReadinessItems.map((item) => (
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
                  <p className="mt-3 text-sm text-sub capitalize">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Next Actions
            </p>
            <h2 className="mt-2 text-xl font-extrabold text-text">
              Keep the reward loop healthy
            </h2>

            <div className="mt-5 space-y-3">
              <ActionLink
                href="/claims"
                label="Review reward claims"
                description={`${relatedClaims.length} claim${relatedClaims.length === 1 ? "" : "s"} currently route through this reward.`}
              />
              <ActionLink
                href={relatedQuests.length > 0 ? "/quests" : "/quests/new"}
                label={relatedQuests.length > 0 ? "Connect to active quests" : "Create a quest"}
                description={
                  relatedQuests.length > 0
                    ? `${relatedQuests.length} quest${relatedQuests.length === 1 ? "" : "s"} exist in this project and can be used to drive reward demand.`
                    : "Add a quest next so contributors have a clear path to unlock this reward."
                }
              />
              <ActionLink
                href="#edit-reward"
                label="Tune stock and delivery"
                description="Use the builder below to align scarcity, visibility and claim behavior with the intended campaign pressure."
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div id="edit-reward" className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Reward</h2>
            <p className="mt-2 text-sm text-sub">
              Update reward settings, fulfillment and visibility.
            </p>

            <div className="mt-6">
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
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Reward Settings</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Reward Type" value={reward.rewardType} />
                <DetailRow label="Rarity" value={reward.rarity} />
                <DetailRow label="Claim Method" value={reward.claimMethod} />
                <DetailRow label="Claimable" value={reward.claimable ? "Yes" : "No"} />
                <DetailRow label="Visible" value={reward.visible ? "Yes" : "No"} />
                <DetailRow
                  label="Stock"
                  value={reward.unlimitedStock ? "Unlimited" : reward.stock ?? "-"}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-card p-6">
              <h2 className="text-xl font-extrabold text-text">Assets</h2>

              <div className="mt-4 space-y-4">
                <DetailRow label="Icon URL" value={reward.icon || "-"} />
                <DetailRow label="Image URL" value={reward.imageUrl || "-"} />
                <DetailRow label="Claims" value={relatedClaims.length} />
                <DetailRow label="Pending Claims" value={pendingClaims.length} />
              </div>
            </div>
          </div>
        </div>
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

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold capitalize text-text">{value}</p>
    </div>
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
