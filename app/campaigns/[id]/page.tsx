"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import CampaignForm from "@/components/forms/campaign/CampaignForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getCampaignById = useAdminPortalStore((s) => s.getCampaignById);
  const updateCampaign = useAdminPortalStore((s) => s.updateCampaign);
  const deleteCampaign = useAdminPortalStore((s) => s.deleteCampaign);
  const raids = useAdminPortalStore((s) => s.raids);
  const quests = useAdminPortalStore((s) => s.quests);
  const projects = useAdminPortalStore((s) => s.projects);

  const campaign = useMemo(
    () => getCampaignById(params.id),
    [getCampaignById, params.id]
  );

  if (!campaign) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Campaign not found</h1>
        </div>
      </AdminShell>
    );
  }

  const relatedRaids = raids.filter((r) => r.campaignId === campaign.id);
  const relatedQuests = quests.filter((q) => q.campaignId === campaign.id);
  const project = projects.find((p) => p.id === campaign.projectId);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Campaign Detail
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">
              {campaign.title}
            </h1>
            <p className="mt-2 text-sm text-sub">
              Project: {project?.name || "Unknown"}
            </p>
          </div>

          <button
            onClick={() => {
              deleteCampaign(campaign.id);
              router.push("/campaigns");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Campaign
          </button>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <CampaignForm
            initialValues={{
              title: campaign.title,
              projectId: campaign.projectId,
              status: campaign.status,
              participants: campaign.participants,
              completionRate: campaign.completionRate,
              xpBudget: campaign.xpBudget,
            }}
            submitLabel="Update Campaign"
            onSubmit={(values) => updateCampaign(campaign.id, values)}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Linked Raids</h2>
            <div className="mt-4 grid gap-3">
              {relatedRaids.length > 0 ? (
                relatedRaids.map((raid) => (
                  <div
                    key={raid.id}
                    className="rounded-2xl border border-line bg-card2 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text">{raid.title}</p>
                        <p className="mt-1 text-sm text-sub">
                          {raid.status} • {raid.rewardXp} XP
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/raids/${raid.id}`)}
                        className="rounded-xl border border-line px-3 py-2 font-semibold"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-sub">No raids yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Linked Quests</h2>
            <div className="mt-4 grid gap-3">
              {relatedQuests.length > 0 ? (
                relatedQuests.map((quest) => (
                  <div
                    key={quest.id}
                    className="rounded-2xl border border-line bg-card2 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-text">{quest.title}</p>
                        <p className="mt-1 text-sm text-sub">
                          {quest.type} • {quest.xp} XP
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/quests/${quest.id}`)}
                        className="rounded-xl border border-line px-3 py-2 font-semibold"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-sub">No quests yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}