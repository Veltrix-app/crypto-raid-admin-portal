"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewCampaignPage() {
  const router = useRouter();
  const createCampaign = useAdminPortalStore((s) => s.createCampaign);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Create Campaign
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Campaign</h1>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <CampaignForm
            onSubmit={(values) => {
              const id = createCampaign(values);
              router.push(`/campaigns/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}