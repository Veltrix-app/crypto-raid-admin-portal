"use client";

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

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Edit Reward</h2>
            <p className="mt-2 text-sm text-sub">
              Update reward settings, fulfillment and visibility.
            </p>

            <div className="mt-6">
              <RewardForm
                projects={projects}
                campaigns={campaigns}
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
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