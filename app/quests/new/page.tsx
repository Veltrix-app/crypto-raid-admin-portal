"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QuestForm from "@/components/forms/quest/QuestForm";
import StudioEntryCommandDeck from "@/components/forms/studio/StudioEntryCommandDeck";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

function NewQuestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createQuest = useAdminPortalStore((s) => s.createQuest);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const requestedProjectId = searchParams.get("projectId") || undefined;
  const requestedCampaignId = searchParams.get("campaignId") || undefined;
  const entrySource = searchParams.get("source") || "direct";
  const effectiveProjectId = requestedProjectId || activeProjectId || undefined;

  const activeProject = projects.find((project) => project.id === effectiveProjectId);
  const activeCampaign = campaigns.find((campaign) => campaign.id === requestedCampaignId);
  const entrySourceLabel =
    entrySource === "launch"
      ? "Launch Workspace"
      : entrySource === "campaign-board"
        ? "Campaign Board"
        : entrySource === "project-overview"
          ? "Project Overview"
          : undefined;
  const returnHref =
    effectiveProjectId && entrySource === "launch"
      ? `/projects/${effectiveProjectId}/launch`
      : effectiveProjectId && entrySource === "campaign-board"
        ? `/projects/${effectiveProjectId}/campaigns`
        : effectiveProjectId && entrySource === "project-overview"
          ? `/projects/${effectiveProjectId}`
          : null;

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Quest Studio"
        title="Design the member action before you launch it"
        description="Create a quest from a mission-first studio surface, with project context, verification posture and member-facing clarity visible before you submit."
        statusBand={
          <StudioEntryCommandDeck
            studio="Quest Studio"
            title="Create one clear member action"
            description="Project, campaign and source context stay visible here, while the builder below focuses on one decision at a time."
            projectName={activeProject?.name}
            entrySourceLabel={entrySourceLabel}
            returnHref={returnHref}
            metrics={[
              { label: "Project", value: activeProject?.name || "Choose" },
              { label: "Campaign", value: activeCampaign?.title || "Optional" },
              { label: "Source", value: entrySourceLabel || "Direct" },
            ]}
            builderAnchor="quest-studio-builder"
          />
        }
      >
        <div id="quest-studio-builder" className="space-y-4">
          <QuestForm
            projects={projects}
            campaigns={campaigns}
            defaultProjectId={effectiveProjectId}
            defaultCampaignId={requestedCampaignId}
            entrySourceLabel={entrySourceLabel}
            onSubmit={async (values) => {
              const id = await createQuest(values);
              router.push(`/quests/${id}`);
            }}
          />
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}

export default function NewQuestPage() {
  return (
    <Suspense fallback={null}>
      <NewQuestPageContent />
    </Suspense>
  );
}
