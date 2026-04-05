"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function QuestsPage() {
  const quests = useAdminPortalStore((s) => s.quests);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Quest Builder
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Quests</h1>
          </div>

          <Link
            href="/quests/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Quest
          </Link>
        </div>

        <div className="grid gap-4">
          {quests.map((quest) => {
            const campaign = campaigns.find((c) => c.id === quest.campaignId);

            return (
              <div key={quest.id} className="rounded-[24px] border border-line bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-text">{quest.title}</h2>
                    <p className="mt-2 text-sm text-sub">
                      Campaign: {campaign?.title || "Unknown"} • Type: {quest.type}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold capitalize text-primary">
                      {quest.status}
                    </p>
                    <p className="mt-2 text-sm text-sub">XP: {quest.xp}</p>
                    <Link
                      href={`/quests/${quest.id}`}
                      className="mt-3 inline-block rounded-xl border border-line bg-card2 px-3 py-2 font-semibold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}