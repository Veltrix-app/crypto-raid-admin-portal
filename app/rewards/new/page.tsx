"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import RewardForm from "@/components/forms/reward/RewardForm";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewRewardPage() {
  const router = useRouter();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createReward = useAdminPortalStore((s) => s.createReward);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Reward Builder
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Reward</h1>
          <p className="mt-2 text-sm text-sub">
            Create a reward with visibility, stock and fulfillment settings.
          </p>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <RewardForm
            projects={projects}
            campaigns={campaigns}
            defaultProjectId={activeProjectId ?? undefined}
            onSubmit={async (values) => {
              const id = await createReward(values);
              router.push(`/rewards/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}
