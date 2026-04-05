"use client";

import { useRouter } from "next/navigation";
import AdminShell from "@/components/layout/shell/AdminShell";
import QuestForm from "@/components/forms/quest/QuestForm";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function NewQuestPage() {
  const router = useRouter();
  const createQuest = useAdminPortalStore((s) => s.createQuest);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Create Quest
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">New Quest</h1>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <QuestForm
            onSubmit={(values) => {
              const id = createQuest(values);
              router.push(`/quests/${id}`);
            }}
          />
        </div>
      </div>
    </AdminShell>
  );
}