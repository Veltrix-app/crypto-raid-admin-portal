"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import RaidForm from "@/components/forms/raid/RaidForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewRaidPage() {
  const router = useRouter();
  const createRaid = useAdminPortalStore((s) => s.createRaid);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Raid Builder
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Raid</h1>
          <p className="mt-2 text-sm text-sub">
            Create a raid and attach it to a live campaign.
          </p>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <RaidForm
            projects={projects}
            campaigns={campaigns}
            onSubmit={async (values) => {
              const id = await createRaid(values);
              router.push(`/raids/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}