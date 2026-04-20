"use client";

import { useRouter } from "next/navigation";
import QuestForm from "@/components/forms/quest/QuestForm";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewQuestPage() {
  const router = useRouter();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createQuest = useAdminPortalStore((s) => s.createQuest);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const activeProjectCampaigns = campaigns.filter((campaign) => campaign.projectId === activeProjectId);

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Quest builder"
        title="New Quest"
        description="Create a quest from a calmer builder surface, with the project and verification context visible before you submit."
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
              label="Workspace campaigns"
              value={activeProjectCampaigns.length}
              emphasis={activeProjectCampaigns.length > 0 ? "primary" : "warning"}
            />
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <OpsPanel
            eyebrow="Quest setup"
            title="Mission configuration"
            description="Define the quest, wire it into the right project and campaign, and keep the verification path clean from the start."
          >
            <QuestForm
              projects={projects}
              campaigns={campaigns}
              defaultProjectId={activeProjectId ?? undefined}
              onSubmit={async (values) => {
                const id = await createQuest(values);
                router.push(`/quests/${id}`);
              }}
            />
          </OpsPanel>

          <div className="space-y-6">
            <OpsPanel
              eyebrow="Builder checklist"
              title="What makes a clean quest"
              description="A small operator guide so verification-heavy quests start in a stable state."
              tone="accent"
            >
              <div className="space-y-3">
                <OpsSnapshotRow label="Objective" value="Clear action, URL and proof expectation" />
                <OpsSnapshotRow label="Placement" value="Correct project and campaign selected" />
                <OpsSnapshotRow label="Verification" value="Provider-gated or manual path chosen intentionally" />
                <OpsSnapshotRow label="Reward signal" value="XP value fits the mission difficulty" />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Workspace context"
              title="Current routing context"
              description="The active project posture so the operator knows whether this quest is landing in a healthy lane."
            >
              <div className="space-y-3">
                <OpsSnapshotRow label="Default project" value={activeProject?.name || "No active project"} />
                <OpsSnapshotRow
                  label="Campaign coverage"
                  value={
                    activeProjectCampaigns.length > 0
                      ? `${activeProjectCampaigns.length} campaigns available`
                      : "No campaigns in the active workspace"
                  }
                />
                <OpsSnapshotRow label="After submit" value="Redirects into quest detail for operate/configure tuning" />
              </div>
            </OpsPanel>
          </div>
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
