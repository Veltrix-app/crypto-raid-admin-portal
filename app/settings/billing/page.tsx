"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SettingsBillingPage() {
  const { activeProjectId, role } = useAdminAuthStore();
  const billingPlans = useAdminPortalStore((s) => s.billingPlans);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);

  const activeProject = projects.find((item) => item.id === activeProjectId);
  const currentPlan = billingPlans.find((item) => item.current) ?? billingPlans[0];
  const activeProjects = projects.filter((item) => item.status === "active").length;
  const activeProjectCampaigns = campaigns.filter((item) => item.projectId === activeProjectId);
  const activeCampaignCount = activeProjectCampaigns.length;
  const liveRewards = rewards.filter((item) => item.projectId === activeProjectId).length;

  const projectLimit = currentPlan?.projectsLimit ?? 0;
  const campaignLimit = currentPlan?.campaignsLimit ?? 0;
  const projectUtilization =
    projectLimit > 0 ? Math.min(100, Math.round((activeProjects / projectLimit) * 100)) : 0;
  const campaignUtilization =
    campaignLimit > 0 ? Math.min(100, Math.round((activeCampaignCount / campaignLimit) * 100)) : 0;

  const billingPressure =
    campaignUtilization >= 85 || projectUtilization >= 85
      ? "Upgrade recommended"
      : campaignUtilization >= 60 || projectUtilization >= 60
        ? "Healthy but growing"
        : "Capacity looks comfortable";

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Workspace Billing
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Billing</h1>
            <p className="mt-2 max-w-3xl text-sm text-sub">
              Track plan capacity, campaign usage and how much room this workspace still has before
              it needs a higher-tier operating setup.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Workspace</p>
            <p className="mt-2 text-lg font-extrabold text-text">
              {activeProject?.name || "Active workspace"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Current Plan" value={currentPlan?.name || "No plan"} />
          <MetricCard
            label="Projects Used"
            value={projectLimit > 0 ? `${activeProjects} / ${projectLimit}` : String(activeProjects)}
          />
          <MetricCard
            label="Campaign Capacity"
            value={
              campaignLimit > 0
                ? `${activeCampaignCount} / ${campaignLimit}`
                : String(activeCampaignCount)
            }
          />
          <MetricCard label="Billing Pressure" value={billingPressure} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Usage Overview</h2>
            <div className="mt-5 space-y-4">
              <UsageRow
                label="Portfolio projects"
                value={`${activeProjects}${projectLimit > 0 ? ` / ${projectLimit}` : ""}`}
                percentage={projectUtilization}
                hint="How many active workspaces are currently consuming plan capacity."
              />
              <UsageRow
                label="Campaign inventory"
                value={`${activeCampaignCount}${campaignLimit > 0 ? ` / ${campaignLimit}` : ""}`}
                percentage={campaignUtilization}
                hint="Campaign load inside the active workspace."
              />
              <UsageRow
                label="Reward inventory"
                value={String(liveRewards)}
                percentage={Math.min(100, liveRewards * 10)}
                hint="Reward operations are not limit-gated yet, but they increase support load."
              />
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-card2 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Workspace Billing Posture
              </p>
              <p className="mt-3 text-sm leading-6 text-sub">
                {role === "super_admin"
                  ? "Use this view to gauge which projects are approaching plan pressure before onboarding volume increases further."
                  : "Use this view to judge whether your current plan still fits the amount of campaigns and operations this workspace is starting to handle."}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Plan Ladder</h2>
            <div className="mt-5 space-y-3">
              {billingPlans.map((plan) => {
                const isCurrent = plan.id === currentPlan?.id;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-4 ${
                      isCurrent ? "border-primary bg-primary/10" : "border-line bg-card2"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-extrabold text-text">{plan.name}</p>
                        <p className="mt-1 text-sm text-sub">
                          EUR {plan.priceMonthly}/month | {plan.projectsLimit} projects |{" "}
                          {plan.campaignsLimit} campaigns
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                          isCurrent ? "bg-primary text-background" : "bg-card text-sub"
                        }`}
                      >
                        {isCurrent ? "Current" : "Available"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {plan.features.map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-sub"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
    </div>
  );
}

function UsageRow({
  label,
  value,
  percentage,
  hint,
}: {
  label: string;
  value: string;
  percentage: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-text">{label}</p>
          <p className="mt-1 text-sm text-sub">{hint}</p>
        </div>
        <p className="text-lg font-extrabold text-text">{value}</p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-card">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
