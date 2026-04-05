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

  const reward = useMemo(
    () => getRewardById(params.id),
    [getRewardById, params.id]
  );

  if (!reward) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Reward not found</h1>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Reward Detail
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">{reward.title}</h1>
          </div>

          <button
            onClick={() => {
              deleteReward(reward.id);
              router.push("/rewards");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Reward
          </button>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <RewardForm
            initialValues={{
              title: reward.title,
              type: reward.type,
              rarity: reward.rarity,
              cost: reward.cost,
              stock: reward.stock,
            }}
            submitLabel="Update Reward"
            onSubmit={(values) => updateReward(reward.id, values)}
          />
        </div>
      </div>
    </AdminShell>
  );
}