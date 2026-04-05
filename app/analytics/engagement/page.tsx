"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import EngagementChart from "@/components/charts/engagement/EngagementChart";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function AnalyticsEngagementPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const raids = useAdminPortalStore((s) => s.raids);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Engagement Analytics
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Engagement</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Campaign Completion</h2>
            <div className="mt-5">
              <EngagementChart
                items={campaigns.map((c) => ({
                  label: c.title,
                  value: c.completionRate,
                }))}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Raid Participation</h2>
            <div className="mt-5">
              <EngagementChart
                items={raids.map((r) => ({
                  label: r.title,
                  value: r.participants,
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}