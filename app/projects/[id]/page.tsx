"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import ProjectForm from "@/components/forms/project/ProjectForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getProjectById = useAdminPortalStore((s) => s.getProjectById);
  const updateProject = useAdminPortalStore((s) => s.updateProject);
  const deleteProject = useAdminPortalStore((s) => s.deleteProject);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  const project = useMemo(
    () => getProjectById(params.id),
    [getProjectById, params.id]
  );

  if (!project) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Project not found</h1>
        </div>
      </AdminShell>
    );
  }

  const relatedCampaigns = campaigns.filter((c) => c.projectId === project.id);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Project Detail
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {project.logo} {project.name}
            </h1>
            <p className="mt-2 text-sm text-sub">{project.description}</p>
          </div>

          <button
            onClick={() => {
              deleteProject(project.id);
              router.push("/projects");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Project
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard label="Chain" value={project.chain} />
          <InfoCard label="Members" value={project.members.toLocaleString()} />
          <InfoCard label="Campaigns" value={relatedCampaigns.length} />
          <InfoCard label="Onboarding" value={project.onboardingStatus} />
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <ProjectForm
            initialValues={{
              name: project.name,
              chain: project.chain,
              status: project.status,
              members: project.members,
              campaigns: project.campaigns,
              logo: project.logo,
              website: project.website,
              contactEmail: project.contactEmail,
              description: project.description,
              onboardingStatus: project.onboardingStatus,
            }}
            submitLabel="Update Project"
            onSubmit={(values) => updateProject(project.id, values)}
          />
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Related Campaigns</h2>
          <div className="mt-4 grid gap-3">
            {relatedCampaigns.length > 0 ? (
              relatedCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-line bg-card2 px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text">{campaign.title}</p>
                      <p className="mt-1 text-sm text-sub">
                        {campaign.status} • {campaign.participants} participants
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/campaigns/${campaign.id}`)}
                      className="rounded-xl border border-line px-3 py-2 font-semibold"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-sub">No campaigns linked yet.</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold capitalize text-text">{value}</p>
    </div>
  );
}