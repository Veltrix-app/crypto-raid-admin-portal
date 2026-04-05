"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import RewardForm from "@/components/forms/reward/RewardForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewRewardPage() {
  const router = useRouter();
  const createReward = useAdminPortalStore((s) => s.createReward);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Create Reward
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Reward</h1>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <RewardForm
            onSubmit={(values) => {
              const id = createReward(values);
              router.push(`/rewards/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}