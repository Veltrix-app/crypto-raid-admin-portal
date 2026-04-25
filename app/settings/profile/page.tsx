"use client";

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

export default function SettingsProfilePage() {
  const { email, role, activeProjectId, memberships } = useAdminAuthStore();
  const projects = useAdminPortalStore((s) => s.projects);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);

  const activeMembership = memberships.find((item) => item.projectId === activeProjectId);
  const project = projects.find((item) => item.id === activeProjectId);
  const projectCampaigns = campaigns.filter((item) => item.projectId === activeProjectId);
  const projectTeamMembers = teamMembers.filter((item) => item.projectId === activeProjectId);
  const activeCampaignCount = projectCampaigns.filter((item) => item.status === "active").length;
  const pendingTeamInvites = projectTeamMembers.filter((item) => item.status === "invited").length;
  const openFlags = reviewFlags.filter((item) => item.status === "open").length;
  const connectedPublicLinks = [
    project?.website,
    project?.xUrl,
    project?.telegramUrl,
    project?.discordUrl,
    project?.docsUrl,
    project?.waitlistUrl,
  ].filter(Boolean).length;
  const templateContextCount = [
    project?.docsUrl,
    project?.waitlistUrl,
    project?.launchPostUrl,
    project?.tokenContractAddress,
    project?.nftContractAddress,
    project?.primaryWallet,
    project?.brandAccent,
    project?.brandMood,
  ].filter(Boolean).length;

  const profileReadiness = [
    {
      label: "Workspace profile",
      value: project?.description ? "Ready" : "Needs description",
      complete: !!project?.description,
    },
    {
      label: "Contact email",
      value: project?.contactEmail || "Missing",
      complete: !!project?.contactEmail,
    },
    {
      label: "Public links",
      value: connectedPublicLinks > 0 ? `${connectedPublicLinks} links connected` : "Not connected",
      complete: connectedPublicLinks > 0,
    },
    {
      label: "Template context",
      value:
        templateContextCount > 0
          ? `${templateContextCount} advanced context fields ready`
          : "Add launch, docs, waitlist or contract context",
      complete: templateContextCount > 0,
    },
  ] as const;

  return (
    <AdminShell>
      <WorkspaceSettingsFrame
        title="Profile"
        description="Shape the workspace identity that operators, community rails and public-facing launches rely on."
        workspaceName={activeMembership?.projectName || project?.name || "Workspace"}
        healthPills={[
          {
            label: role === "super_admin" ? "Super admin" : activeMembership?.role || "Project operator",
            tone: role === "super_admin" ? "success" : "default",
          },
          {
            label: project?.isPublic ? "Public profile" : "Private profile",
            tone: project?.isPublic ? "success" : "warning",
          },
          {
            label: connectedPublicLinks > 0 ? `${connectedPublicLinks} links` : "No links",
            tone: connectedPublicLinks > 0 ? "success" : "warning",
          },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-5">
          <OpsMetricCard label="Role" value={role === "super_admin" ? "Super admin" : activeMembership?.role || "Project admin"} />
          <OpsMetricCard label="Active campaigns" value={activeCampaignCount} />
          <OpsMetricCard label="Pending invites" value={pendingTeamInvites} />
          <OpsMetricCard label="Open flags" value={openFlags} emphasis={openFlags > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Template context" value={templateContextCount} emphasis={templateContextCount > 0 ? "primary" : "warning"} />
        </div>

        <div className="grid gap-4 xl:items-start xl:grid-cols-[1.1fr_0.9fr]">
          <OpsPanel
            eyebrow="Workspace snapshot"
            title="Identity and context"
            description="The naming, contact and launch context operators lean on when they work inside this workspace."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <OpsSnapshotRow label="Owner email" value={email || project?.contactEmail || "Not set"} />
              <OpsSnapshotRow label="Workspace name" value={project?.name || "Unnamed workspace"} />
              <OpsSnapshotRow label="Slug" value={project?.slug || "Not set"} />
              <OpsSnapshotRow label="Chain" value={project?.chain || "Not set"} />
              <OpsSnapshotRow label="Category" value={project?.category || "Not set"} />
              <OpsSnapshotRow label="Visibility" value={project?.isPublic ? "Public workspace" : "Private workspace"} />
            </div>

            <div className="mt-5 rounded-[18px] border border-white/[0.04] bg-white/[0.025] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Description</p>
              <p className="mt-3 text-sm leading-6 text-sub">
                {project?.description ||
                  "Add a short workspace description so project context is clear across the portal and the public-facing rails."}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <OpsSnapshotRow label="Docs URL" value={project?.docsUrl || "Not set"} />
              <OpsSnapshotRow label="Waitlist URL" value={project?.waitlistUrl || "Not set"} />
              <OpsSnapshotRow label="Launch post URL" value={project?.launchPostUrl || "Not set"} />
              <OpsSnapshotRow label="Primary wallet" value={project?.primaryWallet || "Not set"} />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Readiness rail"
            title="Profile readiness"
            description="The highest-signal checks for whether this workspace identity is ready to support campaigns and community surfaces."
            tone="accent"
          >
            <div className="space-y-3">
              {profileReadiness.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <OpsStatusPill tone={item.complete ? "success" : "warning"}>
                      {item.complete ? "Ready" : "Needs attention"}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-3 text-sm text-sub">{item.value}</p>
                </div>
              ))}
            </div>
          </OpsPanel>
        </div>

        <div className="grid gap-4 xl:items-start xl:grid-cols-2">
          <OpsPanel
            eyebrow="Public links"
            title="Connected presence"
            description="The key external surfaces that help operators and members understand where this workspace lives."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <OpsSnapshotRow label="Website" value={project?.website || "Not connected"} />
              <OpsSnapshotRow label="X" value={project?.xUrl || "Not connected"} />
              <OpsSnapshotRow label="Telegram" value={project?.telegramUrl || "Not connected"} />
              <OpsSnapshotRow label="Discord" value={project?.discordUrl || "Not connected"} />
              <OpsSnapshotRow label="Docs" value={project?.docsUrl || "Not connected"} />
              <OpsSnapshotRow label="Waitlist" value={project?.waitlistUrl || "Not connected"} />
              <OpsSnapshotRow label="Launch post" value={project?.launchPostUrl || "Not connected"} />
              <OpsSnapshotRow label="Contact" value={project?.contactEmail || "Not connected"} />
            </div>
          </OpsPanel>

          <OpsPanel
            eyebrow="Template context"
            title="Advanced launch context"
            description="These fields enrich automations, prompts and operator workflows with stronger project context."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <OpsSnapshotRow label="Token contract" value={project?.tokenContractAddress || "Not set"} />
              <OpsSnapshotRow label="NFT contract" value={project?.nftContractAddress || "Not set"} />
              <OpsSnapshotRow label="Primary wallet" value={project?.primaryWallet || "Not set"} />
              <OpsSnapshotRow label="Brand accent" value={project?.brandAccent || "Not set"} />
              <OpsSnapshotRow label="Brand mood" value={project?.brandMood || "Not set"} />
            </div>
          </OpsPanel>
        </div>
      </WorkspaceSettingsFrame>
    </AdminShell>
  );
}
