"use client";

import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import WorkspaceSettingsFrame from "@/components/layout/shell/WorkspaceSettingsFrame";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SettingsBillingPage() {
  const { activeProjectId, role, memberships } = useAdminAuthStore();
  const billingPlans = useAdminPortalStore((s) => s.billingPlans);
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const rewards = useAdminPortalStore((s) => s.rewards);

  const activeMembership = memberships.find((item) => item.projectId === activeProjectId);
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
      <WorkspaceSettingsFrame
        title="Billing"
        description="Track plan posture, usage pressure and how much headroom this workspace still has before growth starts to squeeze operations."
        workspaceName={activeMembership?.projectName || activeProject?.name || "Workspace"}
        healthPills={[
          {
            label: currentPlan?.name || "No plan",
            tone: currentPlan ? "default" : "warning",
          },
          {
            label: billingPressure,
            tone:
              billingPressure === "Upgrade recommended"
                ? "warning"
                : billingPressure === "Healthy but growing"
                  ? "default"
                  : "success",
          },
          {
            label: role === "super_admin" ? "Portfolio view" : "Workspace view",
            tone: role === "super_admin" ? "success" : "default",
          },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Current plan" value={currentPlan?.name || "No plan"} />
          <OpsMetricCard
            label="Projects used"
            value={projectLimit > 0 ? `${activeProjects} / ${projectLimit}` : activeProjects}
            emphasis={projectUtilization >= 85 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Campaign capacity"
            value={campaignLimit > 0 ? `${activeCampaignCount} / ${campaignLimit}` : activeCampaignCount}
            emphasis={campaignUtilization >= 85 ? "warning" : campaignUtilization >= 60 ? "primary" : "default"}
          />
          <OpsMetricCard label="Reward inventory" value={liveRewards} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <OpsPanel
            eyebrow="Usage overview"
            title="Capacity posture"
            description="See where workspace growth is starting to push into plan limits or operational support load."
          >
            <div className="space-y-4">
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
                hint="Reward operations are not limit-gated yet, but they still increase support load."
              />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Posture summary"
            title="Billing pressure"
            description="A quick operator read on whether the current plan still fits the shape of the workspace."
            tone="accent"
          >
            <div className="space-y-3">
              <div className="rounded-[22px] border border-line bg-card2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-text">Plan signal</p>
                  <OpsStatusPill
                    tone={
                      billingPressure === "Upgrade recommended"
                        ? "warning"
                        : billingPressure === "Healthy but growing"
                          ? "default"
                          : "success"
                    }
                  >
                    {billingPressure}
                  </OpsStatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-sub">
                  {role === "super_admin"
                    ? "Use this view to gauge which projects are approaching plan pressure before onboarding volume increases further."
                    : "Use this view to judge whether your current plan still fits the amount of campaigns and operations this workspace is starting to handle."}
                </p>
              </div>

              <OpsSnapshotRow label="Current plan" value={currentPlan?.name || "No plan"} />
              <OpsSnapshotRow
                label="Project capacity"
                value={projectLimit > 0 ? `${activeProjects} of ${projectLimit} used` : `${activeProjects} used`}
              />
              <OpsSnapshotRow
                label="Campaign capacity"
                value={campaignLimit > 0 ? `${activeCampaignCount} of ${campaignLimit} used` : `${activeCampaignCount} used`}
              />
            </div>
          </OpsPanel>
        </div>

        <OpsPanel
          eyebrow="Plan ladder"
          title="Available tiers"
          description="The current plan plus the next levels the workspace can grow into."
        >
          <div className="space-y-3">
            {billingPlans.map((plan) => {
              const isCurrent = plan.id === currentPlan?.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-[22px] border p-4 ${
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
                    <OpsStatusPill tone={isCurrent ? "success" : "default"}>
                      {isCurrent ? "Current" : "Available"}
                    </OpsStatusPill>
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
        </OpsPanel>
      </WorkspaceSettingsFrame>
    </AdminShell>
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
    <div className="rounded-[22px] border border-line bg-card2 p-4">
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
