"use client";

import { useRouter } from "next/navigation";
import RewardForm from "@/components/forms/reward/RewardForm";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewRewardPage() {
  const router = useRouter();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createReward = useAdminPortalStore((s) => s.createReward);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const activeProjectRewards = rewards.filter((reward) => reward.projectId === activeProjectId);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Reward builder"
        title="New Reward"
        description="Create a reward from a calmer catalog-first surface so visibility, stock and fulfillment settings are easier to reason about."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Default workspace</p>
            <p className="text-lg font-extrabold text-text">{activeProject?.name || "No active project"}</p>
          </div>
        }
        statusBand={
          <div className="grid gap-4 md:grid-cols-3">
            <OpsMetricCard label="Projects" value={projects.length} />
            <OpsMetricCard label="Campaigns" value={campaigns.length} />
            <OpsMetricCard
              label="Workspace rewards"
              value={activeProjectRewards.length}
              emphasis={activeProjectRewards.length > 0 ? "primary" : "default"}
            />
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <OpsPanel
            eyebrow="Reward setup"
            title="Catalog and fulfillment configuration"
            description="Define the reward itself first, then make the claim and inventory posture explicit from the start."
          >
            <RewardForm
              projects={projects}
              campaigns={campaigns}
              defaultProjectId={activeProjectId ?? undefined}
              onSubmit={async (values) => {
                const id = await createReward(values);
                router.push(`/rewards/${id}`);
              }}
            />
          </OpsPanel>

          <div className="space-y-4">
            <OpsPanel
              eyebrow="Builder checklist"
              title="What makes a clean reward"
              description="Keep the catalog and claim logic understandable before this reward ever hits the live lane."
              tone="accent"
            >
              <div className="space-y-3">
                <OpsSnapshotRow label="Catalog signal" value="Title, type and rarity are legible" />
                <OpsSnapshotRow label="Stock posture" value="Unlimited vs limited stock is intentional" />
                <OpsSnapshotRow label="Claim path" value="Fulfillment method matches the reward type" />
                <OpsSnapshotRow label="Visibility" value="Public-facing availability is set deliberately" />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Workspace context"
              title="Current inventory context"
              description="A quick read on where this reward is landing and what happens right after creation."
            >
              <div className="space-y-3">
                <OpsSnapshotRow label="Default project" value={activeProject?.name || "No active project"} />
                <OpsSnapshotRow
                  label="Reward inventory"
                  value={
                    activeProjectRewards.length > 0
                      ? `${activeProjectRewards.length} rewards already in this workspace`
                      : "No rewards in the active workspace yet"
                  }
                />
                <OpsSnapshotRow label="After submit" value="Redirects into reward detail for operate/configure tuning" />
              </div>
            </OpsPanel>
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
