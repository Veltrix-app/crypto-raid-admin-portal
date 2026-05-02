"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import EngagementChart from "@/components/charts/engagement/EngagementChart";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function AnalyticsEngagementPage() {
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const raids = useAdminPortalStore((s) => s.raids);
  const quests = useAdminPortalStore((s) => s.quests);
  const submissions = useAdminPortalStore((s) => s.submissions);

  const questSubmissions = quests.map((quest) => ({
    label: quest.title,
    value: submissions.filter((submission) => submission.questId === quest.id).length,
  }));

  return (
    <AdminShell>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
            Engagement Analytics
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-text">Engagement</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-sub">
            This view focuses on where contributors are actually moving: campaign throughput,
            quest activity and raid participation.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <MetricCard
            label="Active Campaigns"
            value={campaigns.filter((campaign) => campaign.status === "active").length}
            hint="Campaigns currently open for contributor action."
          />
          <MetricCard
            label="Quest Touchpoints"
            value={quests.length}
            hint="Distinct quest steps shaping the journey."
          />
          <MetricCard
            label="Raid Surges"
            value={raids.length}
            hint="Time-sensitive social pushes currently linked to workspaces."
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.014] p-5">
            <h2 className="text-[1.08rem] font-extrabold text-text">Campaign Completion</h2>
            <p className="mt-2 text-sm text-sub">
              Which campaigns are actually converting activity into completion.
            </p>
            <div className="mt-5">
              <EngagementChart
                items={campaigns.map((campaign) => ({
                  label: campaign.title,
                  value: campaign.completionRate,
                }))}
              />
            </div>
          </div>

          <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.014] p-5">
            <h2 className="text-[1.08rem] font-extrabold text-text">Raid Participation</h2>
            <p className="mt-2 text-sm text-sub">
              Social pushes that are pulling the strongest immediate response.
            </p>
            <div className="mt-5">
              <EngagementChart
                items={raids.map((raid) => ({
                  label: raid.title,
                  value: raid.participants,
                }))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.014] p-5">
          <h2 className="text-[1.08rem] font-extrabold text-text">Quest Activity</h2>
          <p className="mt-2 text-sm text-sub">
            Submission volume per quest shows where contributors spend their actual effort.
          </p>
          <div className="mt-5">
            <EngagementChart items={questSubmissions} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.026] bg-white/[0.014] p-4">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-1.5 text-[1.4rem] font-extrabold text-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}
