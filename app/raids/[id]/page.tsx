"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import RaidForm from "@/components/forms/raid/RaidForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RaidDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getRaidById = useAdminPortalStore((s) => s.getRaidById);
  const updateRaid = useAdminPortalStore((s) => s.updateRaid);
  const deleteRaid = useAdminPortalStore((s) => s.deleteRaid);

  const raid = useMemo(() => getRaidById(params.id), [getRaidById, params.id]);

  if (!raid) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Raid not found</h1>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Raid Detail
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">{raid.title}</h1>
          </div>

          <button
            onClick={() => {
              deleteRaid(raid.id);
              router.push("/raids");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Raid
          </button>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <RaidForm
            initialValues={{
              title: raid.title,
              campaignId: raid.campaignId,
              status: raid.status,
              participants: raid.participants,
              rewardXp: raid.rewardXp,
            }}
            submitLabel="Update Raid"
            onSubmit={(values) => updateRaid(raid.id, values)}
          />
        </div>
      </div>
    </AdminShell>
  );
}