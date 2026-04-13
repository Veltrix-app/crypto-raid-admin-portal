"use client";

import AdminShell from "@/components/layout/shell/AdminShell";
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
    {
      label: "Operations",
      value: `${activeCampaignCount} active campaigns | ${openFlags} open flags`,
      complete: true,
    },
  ];

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Workspace Profile
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Profile</h1>
            <p className="mt-2 text-sm text-sub">
              Keep this workspace legible for both your internal team and the
              public-facing campaign layer.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
              Active workspace
            </p>
            <p className="mt-2 text-lg font-extrabold text-text">
              {activeMembership?.projectName || project?.name || "Workspace"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            label="Workspace Role"
            value={role === "super_admin" ? "super admin" : activeMembership?.role || "project admin"}
          />
          <MetricCard label="Active Campaigns" value={String(activeCampaignCount)} />
          <MetricCard label="Pending Invites" value={String(pendingTeamInvites)} />
          <MetricCard label="Open Flags" value={String(openFlags)} />
          <MetricCard label="Template Context" value={String(templateContextCount)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Workspace Snapshot</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Owner Email" value={email || project?.contactEmail || "Not set"} />
              <Field label="Workspace Name" value={project?.name || "Unnamed workspace"} />
              <Field label="Slug" value={project?.slug || "Not set"} />
              <Field label="Environment" value="Production-ready workspace" />
              <Field label="Chain" value={project?.chain || "Not set"} />
              <Field label="Category" value={project?.category || "Not set"} />
            </div>

            <div className="mt-6 rounded-2xl border border-line bg-card2 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Description
              </p>
              <p className="mt-3 text-sm leading-6 text-sub">
                {project?.description ||
                  "Add a short workspace description so project context is clear inside the portal and later across public surfaces."}
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Docs URL" value={project?.docsUrl || "Not set"} />
              <Field label="Waitlist URL" value={project?.waitlistUrl || "Not set"} />
              <Field label="Launch Post URL" value={project?.launchPostUrl || "Not set"} />
              <Field label="Primary Wallet" value={project?.primaryWallet || "Not set"} />
            </div>
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Profile Readiness</h2>
            <div className="mt-5 space-y-3">
              {profileReadiness.map((item) => (
                <div key={item.label} className="rounded-2xl border border-line bg-card2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-text">{item.label}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
                        item.complete
                          ? "bg-primary/15 text-primary"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {item.complete ? "Ready" : "Needs attention"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-sub">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Workspace Links</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field label="Website" value={project?.website || "Not connected"} />
            <Field label="X" value={project?.xUrl || "Not connected"} />
            <Field label="Telegram" value={project?.telegramUrl || "Not connected"} />
            <Field label="Discord" value={project?.discordUrl || "Not connected"} />
            <Field label="Docs" value={project?.docsUrl || "Not connected"} />
            <Field label="Waitlist" value={project?.waitlistUrl || "Not connected"} />
            <Field label="Launch Post" value={project?.launchPostUrl || "Not connected"} />
            <Field label="Contact" value={project?.contactEmail || "Not connected"} />
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Template Context</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field
              label="Token Contract"
              value={project?.tokenContractAddress || "Not set"}
            />
            <Field
              label="NFT Contract"
              value={project?.nftContractAddress || "Not set"}
            />
            <Field
              label="Primary Wallet"
              value={project?.primaryWallet || "Not set"}
            />
            <Field
              label="Brand Accent"
              value={project?.brandAccent || "Not set"}
            />
            <Field
              label="Brand Mood"
              value={project?.brandMood || "Not set"}
            />
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
      <p className="mt-2 text-2xl font-extrabold capitalize text-text">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card2 px-4 py-4">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 break-all font-bold capitalize text-text">{value}</p>
    </div>
  );
}
