"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import QuestForm from "@/components/forms/quest/QuestForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function QuestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const getQuestById = useAdminPortalStore((s) => s.getQuestById);
  const updateQuest = useAdminPortalStore((s) => s.updateQuest);
  const deleteQuest = useAdminPortalStore((s) => s.deleteQuest);

  const quest = useMemo(() => getQuestById(params.id), [getQuestById, params.id]);

  if (!quest) {
    return (
      <AdminShell>
        <div className="rounded-[24px] border border-line bg-card p-6">
          <h1 className="text-2xl font-extrabold text-text">Quest not found</h1>
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
              Quest Detail
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">{quest.title}</h1>
          </div>

          <button
            onClick={() => {
              deleteQuest(quest.id);
              router.push("/quests");
            }}
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 font-bold text-rose-300"
          >
            Delete Quest
          </button>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <QuestForm
            initialValues={{
              title: quest.title,
              campaignId: quest.campaignId,
              type: quest.type,
              status: quest.status,
              xp: quest.xp,
            }}
            submitLabel="Update Quest"
            onSubmit={(values) => updateQuest(quest.id, values)}
          />
        </div>
      </div>
    </AdminShell>
  );
}