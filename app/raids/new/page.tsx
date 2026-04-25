"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RaidForm from "@/components/forms/raid/RaidForm";
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
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Studio context</p>
            <p className="text-lg font-extrabold text-text">{activeProject?.name || "No active project"}</p>
          </div>
        }
      >
        <div className="space-y-4">
          {entrySourceLabel ? (
            <div className="rounded-[16px] border border-primary/16 bg-primary/10 p-3.5 text-[12px] leading-5 text-primary">
              <span className="font-semibold text-white">{entrySourceLabel}</span> handed this raid into the studio with project context already loaded.
              {returnHref ? (
                <>
                  {" "}
                  <a href={returnHref} className="font-semibold text-primary underline underline-offset-4">
                    Go back to that workspace
                  </a>
                  {" "}if you want to recheck launch posture first.
                </>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] p-3.5 text-[12px] leading-5 text-sub">
            The studio now keeps the member preview, watchlist and verification posture inside the
            builder itself, so you can shape one pressure mission at a time instead of scanning a
            separate checklist column.
          </div>

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
