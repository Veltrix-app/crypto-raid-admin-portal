"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewCampaignPage() {
  const router = useRouter();
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const createCampaign = useAdminPortalStore((s) => s.createCampaign);
  const projects = useAdminPortalStore((s) => s.projects);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Campaign Builder
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Campaign</h1>
          <p className="mt-2 text-sm text-sub">
            Create a campaign and attach it to a project.
          </p>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <CampaignForm
            projects={projects}
            defaultProjectId={activeProjectId ?? undefined}
            onSubmit={async (values) => {
              const id = await createCampaign(values);
              router.push(`/campaigns/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}
