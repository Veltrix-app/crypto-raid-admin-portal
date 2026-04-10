"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import QuestForm from "@/components/forms/quest/QuestForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewQuestPage() {
  const router = useRouter();
  const createQuest = useAdminPortalStore((s) => s.createQuest);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Quest Builder
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Quest</h1>
          <p className="mt-2 text-sm text-sub">
            Create a quest with verification and proof settings.
          </p>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <QuestForm
            projects={projects}
            campaigns={campaigns}
            onSubmit={async (values) => {
              const id = await createQuest(values);
              router.push(`/quests/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}