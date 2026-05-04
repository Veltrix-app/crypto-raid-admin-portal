"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RaidForm from "@/components/forms/raid/RaidForm";
import StudioEntryCommandDeck from "@/components/forms/studio/StudioEntryCommandDeck";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

function NewRaidPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createRaid = useAdminPortalStore((s) => s.createRaid);
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
        eyebrow="Raid Studio"
        title="Design the pressure wave before you launch it"
        description="Create a raid from the new studio surface, where placement, verification and urgency live inside one guided builder instead of a long ops form."
        statusBand={
          <StudioEntryCommandDeck
            studio="Raid Studio"
            title="Create one focused pressure mission"
            description="Project, campaign and source context stay visible here, while the raid builder keeps action, proof and urgency in one guided flow."
            projectName={activeProject?.name}
            entrySourceLabel={entrySourceLabel}
            returnHref={returnHref}
            metrics={[
              { label: "Project", value: activeProject?.name || "Choose" },
              { label: "Campaign", value: activeCampaign?.title || "Optional" },
              { label: "Source", value: entrySourceLabel || "Direct" },
            ]}
            builderAnchor="raid-studio-builder"
          />
        }
      >
        <div id="raid-studio-builder" className="space-y-4">
          <RaidForm
            projects={projects}
            campaigns={campaigns}
            defaultProjectId={effectiveProjectId}
            defaultCampaignId={requestedCampaignId}
            onSubmit={async (values) => {
              const id = await createRaid(values);
              router.push(`/raids/${id}`);
            }}
          />
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}

export default function NewRaidPage() {
  return (
    <Suspense fallback={null}>
      <NewRaidPageContent />
    </Suspense>
  );
}
