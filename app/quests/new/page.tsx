"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QuestForm from "@/components/forms/quest/QuestForm";
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
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Studio context</p>
            <p className="text-lg font-extrabold text-text">{activeProject?.name || "No active project"}</p>
          </div>
        }
      >
        <div className="space-y-4">
          {entrySourceLabel ? (
            <div className="rounded-[16px] border border-primary/16 bg-primary/[0.055] p-3.5 text-[12px] leading-5 text-primary">
              <span className="font-semibold text-white">{entrySourceLabel}</span> handed this quest into the studio with project context already loaded.
              {returnHref ? (
                <>
                  {" "}
                  <a href={returnHref} className="font-semibold text-primary underline underline-offset-4">
                    Go back to that workspace
                  </a>
                  {" "}if you need to recheck launch posture first.
                </>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] p-3.5 text-[12px] leading-5 text-sub">
            This studio now keeps the member-facing preview and quest watchlist inside the builder
            itself, so you can stay focused on one decision at a time instead of scanning side
            panels.
          </div>

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
