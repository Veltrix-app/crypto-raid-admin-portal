"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import WorkspaceSettingsFrame from "@/components/layout/shell/WorkspaceSettingsFrame";
import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SettingsPage() {
  const { activeProjectId, memberships, role } = useAdminAuthStore();
  const projects = useAdminPortalStore((s) => s.projects);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const billingPlans = useAdminPortalStore((s) => s.billingPlans);

  const activeProject = projects.find((project) => project.id === activeProjectId);
  const activeMembership = memberships.find((item) => item.projectId === activeProjectId);
  const workspaceTeam = teamMembers.filter((member) => member.projectId === activeProjectId);
  const currentPlan = billingPlans.find((plan) => plan.current) ?? billingPlans[0];

  const settingsCards = [
    {
      href: "/settings/profile",
      title: "Profile",
      description: "Workspace profile, links, branding and public readiness.",
      metric: activeProject?.isPublic ? "Public profile live" : "Private workspace",
      tone: activeProject?.isPublic ? "success" : "warning",
    },
    {
      href: "/settings/team",
      title: "Team",
      description: "Invite operators, reviewers and admins into the workspace.",
      metric: `${workspaceTeam.length} team members`,
      tone: workspaceTeam.length > 1 ? "success" : "warning",
    },
    {
      href: "/settings/billing",
      title: "Billing",
      description: "Plan posture, usage limits and capacity planning.",
      metric: currentPlan ? currentPlan.name : "No active plan",
      tone: currentPlan ? "default" : "warning",
    },
    {
      href: "/settings/security",
      title: "Security",
      description: "2FA, sessions, export/delete requests and enterprise identity controls.",
      metric: "Security workspace",
      tone: "default",
    },
  ] as const;

  return (
    <AdminShell>
      <WorkspaceSettingsFrame
        title="Settings"
        description="One clean control rail for workspace identity, access structure and billing posture."
        workspaceName={activeMembership?.projectName || activeProject?.name || "Workspace"}
        healthPills={[
          {
            label: role === "super_admin" ? "Super admin" : activeMembership?.role || "Project operator",
            tone: role === "super_admin" ? "success" : "default",
          },
          {
            label: activeProject?.isPublic ? "Public" : "Private",
            tone: activeProject?.isPublic ? "success" : "warning",
          },
          {
            label: currentPlan?.name || "No plan",
            tone: currentPlan ? "default" : "warning",
          },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard
            label="Workspace profile"
            value={activeProject?.description ? "Ready" : "Needs work"}
            emphasis={activeProject?.description ? "primary" : "warning"}
          />
          <OpsMetricCard
            label="Team operators"
            value={workspaceTeam.length}
            emphasis={workspaceTeam.length > 1 ? "primary" : "warning"}
          />
          <OpsMetricCard label="Current plan" value={currentPlan?.name || "None"} />
          <OpsMetricCard label="Security" value="Manage access" />
        </div>

        <OpsPanel
          eyebrow="Settings modules"
          title="Choose the rail you want to tune"
          description="Each surface now owns one clear concern, so identity, team and billing no longer blur into each other."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {settingsCards.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-[24px] border border-line bg-card2 p-5 transition hover:border-primary/35 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                    Workspace module
                  </p>
                  <OpsStatusPill tone={item.tone}>{item.metric}</OpsStatusPill>
                </div>
                <h2 className="mt-4 text-xl font-extrabold text-text">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-sub">{item.description}</p>
              </Link>
            ))}
          </div>
        </OpsPanel>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <OpsPanel
            eyebrow="Configuration priorities"
            title="What still deserves cleanup"
            description="A short read on the areas that still create friction before a workspace feels truly launch-ready."
            tone="accent"
          >
            <div className="space-y-3">
              <OpsSnapshotRow
                label="Brand and public profile"
                value={
                  activeProject?.description && activeProject?.website
                    ? "Profile looks healthy"
                    : "Profile still needs stronger public context"
                }
              />
              <OpsSnapshotRow
                label="Team structure"
                value={
                  workspaceTeam.length > 1
                    ? "Roles are distributed across a team"
                    : "Still dependent on a very small operator set"
                }
              />
              <OpsSnapshotRow
                label="Billing posture"
                value={currentPlan ? `${currentPlan.name} plan active` : "Billing plan not detected"}
              />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Workspace snapshot"
            title="Core settings state"
            description="The smallest possible summary of role, contactability, visibility and plan."
          >
            <div className="space-y-3">
              <OpsSnapshotRow label="Role" value={activeMembership?.role || "project admin"} />
              <OpsSnapshotRow label="Contact email" value={activeProject?.contactEmail || "Not set"} />
              <OpsSnapshotRow
                label="Visibility"
                value={activeProject?.isPublic ? "Public workspace" : "Private workspace"}
              />
              <OpsSnapshotRow label="Current plan" value={currentPlan?.name || "No plan"} />
            </div>
          </OpsPanel>
        </div>
      </WorkspaceSettingsFrame>
    </AdminShell>
  );
}
