"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import RaidForm from "@/components/forms/raid/RaidForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewRaidPage() {
  const router = useRouter();
  const createRaid = useAdminPortalStore((s) => s.createRaid);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Create Raid
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Raid</h1>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <RaidForm
            onSubmit={(values) => {
              const id = createRaid(values);
              router.push(`/raids/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}