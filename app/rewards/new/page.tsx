"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  return (
    <Suspense
      fallback={
        <AdminShell>
          <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.014] p-4 text-sm text-sub">
            Loading Reward Studio...
          </div>
        </AdminShell>
      }
    >
      <NewRewardContent />
    </Suspense>
  );
}

function NewRewardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createReward = useAdminPortalStore((s) => s.createReward);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);

  const requestedProjectId = searchParams.get("projectId");
  const defaultProjectId =
    requestedProjectId && projects.some((project) => project.id === requestedProjectId)
      ? requestedProjectId
      : activeProjectId;
  const activeProject = projects.find((project) => project.id === defaultProjectId);
  const activeProjectRewards = rewards.filter((reward) => reward.projectId === defaultProjectId);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Reward Treasury Studio"
        title="Create funded reward"
        description="Build the public reward, choose the funding route, attach proof and define how winners receive value before the reward becomes live."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Reward will land in</p>
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
            description="Projects create rewards here: first the public offer, then treasury proof, claim logic and launch readiness."
          >
            <RewardForm
              projects={projects}
              campaigns={campaigns}
              defaultProjectId={defaultProjectId ?? undefined}
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
                <OpsSnapshotRow label="Funding proof" value="Token-like rewards need Safe, escrow or provider proof before going active" />
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
