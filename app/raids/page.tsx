"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function RaidsPage() {
  const raids = useAdminPortalStore((s) => s.raids);
  const campaigns = useAdminPortalStore((s) => s.campaigns);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Raid Control
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Raids</h1>
          </div>

          <Link
            href="/raids/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Raid
          </Link>
        </div>

        <div className="grid gap-4">
          {raids.map((raid) => {
            const campaign = campaigns.find((c) => c.id === raid.campaignId);

            return (
              <div key={raid.id} className="rounded-[24px] border border-line bg-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-text">{raid.title}</h2>
                    <p className="mt-2 text-sm text-sub">
                      Campaign: {campaign?.title || "Unknown"} • Participants:{" "}
                      {raid.participants}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold capitalize text-primary">
                      {raid.status}
                    </p>
                    <p className="mt-2 text-sm text-sub">Reward XP: {raid.rewardXp}</p>
                    <Link
                      href={`/raids/${raid.id}`}
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