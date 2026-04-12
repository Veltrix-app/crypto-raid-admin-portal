"use client";

import Link from "next/link";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SettingsPage() {
  const { activeProjectId, memberships } = useAdminAuthStore();
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
    },
    {
      href: "/settings/team",
      title: "Team",
      description: "Invite operators, reviewers and admins into the workspace.",
      metric: `${workspaceTeam.length} team members`,
    },
    {
      href: "/settings/billing",
      title: "Billing",
      description: "Plan posture, usage limits and capacity planning.",
      metric: currentPlan ? currentPlan.name : "No active plan",
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Workspace Settings
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Settings</h1>
            <p className="mt-2 text-sm text-sub">
              Keep identity, team structure and billing posture aligned for this workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Active workspace</p>
            <p className="mt-2 text-lg font-extrabold text-text">
              {activeMembership?.projectName || activeProject?.name || "Workspace"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {settingsCards.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-[24px] border border-line bg-card p-6 transition hover:border-primary/40"
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Workspace module
              </p>
              <h2 className="mt-3 text-xl font-extrabold text-text">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-sub">{item.description}</p>
              <div className="mt-5 rounded-2xl border border-line bg-card2 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Current signal</p>
                <p className="mt-2 text-sm font-bold text-text">{item.metric}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Configuration Priorities</h2>
            <div className="mt-5 space-y-3">
              <PriorityRow
                label="Brand and public profile"
                value={
                  activeProject?.description && activeProject?.website
                    ? "Profile looks healthy"
                    : "Profile still needs stronger public context"
                }
              />
              <PriorityRow
                label="Team structure"
                value={
                  workspaceTeam.length > 1
                    ? "Roles are distributed across a team"
                    : "Still dependent on a very small operator set"
                }
              />
              <PriorityRow
                label="Billing posture"
                value={currentPlan ? `${currentPlan.name} plan active` : "Billing plan not detected"}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Workspace Snapshot</h2>
            <div className="mt-5 space-y-3">
              <PriorityRow label="Role" value={activeMembership?.role || "project admin"} />
              <PriorityRow label="Contact email" value={activeProject?.contactEmail || "Not set"} />
              <PriorityRow
                label="Visibility"
                value={activeProject?.isPublic ? "Public workspace" : "Private workspace"}
              />
              <PriorityRow label="Current plan" value={currentPlan?.name || "No plan"} />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function PriorityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 text-sm font-bold text-text">{value}</p>
    </div>
  );
}
