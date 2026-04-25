"use client";

import { useMemo, useState } from "react";
import {
  OpsMetricCard,
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import WorkspaceSettingsFrame from "@/components/layout/shell/WorkspaceSettingsFrame";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { AdminTeamMember } from "@/types/entities/team-member";

const ROLE_OPTIONS: AdminTeamMember["role"][] = ["reviewer", "analyst", "admin", "owner"];
const STATUS_OPTIONS: AdminTeamMember["status"][] = ["invited", "active"];

export default function SettingsTeamPage() {
  const activeProjectId = useAdminAuthStore((s) => s.activeProjectId);
  const memberships = useAdminAuthStore((s) => s.memberships);
  const portalRole = useAdminAuthStore((s) => s.role);
  const projects = useAdminPortalStore((s) => s.projects);
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const inviteTeamMember = useAdminPortalStore((s) => s.inviteTeamMember);
  const updateTeamMember = useAdminPortalStore((s) => s.updateTeamMember);

  const activeMembership = memberships.find((item) => item.projectId === activeProjectId);
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const workspaceTeam = teamMembers.filter((member) => member.projectId === activeProjectId);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminTeamMember["role"]>("reviewer");
  const [savingId, setSavingId] = useState<string | null>(null);

  const canManageTeam =
    portalRole === "super_admin" ||
    activeMembership?.role === "owner" ||
    activeMembership?.role === "admin";
  const canAssignOwner = portalRole === "super_admin" || activeMembership?.role === "owner";
  const pendingInvites = workspaceTeam.filter((member) => member.status === "invited");
  const activeMembers = workspaceTeam.filter((member) => member.status === "active");
  const roleBreakdown = useMemo(
    () =>
      ROLE_OPTIONS.map((itemRole) => ({
        role: itemRole,
        count: workspaceTeam.filter((member) => member.role === itemRole).length,
      })),
    [workspaceTeam]
  );

  async function handleMemberUpdate(
    memberId: string,
    input: Pick<AdminTeamMember, "role" | "status">
  ) {
    try {
      setSavingId(memberId);
      await updateTeamMember(memberId, input);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminShell>
      <WorkspaceSettingsFrame
        title="Team"
        description="Structure operators, reviewers and owners with a cleaner access model instead of one mixed member dump."
        workspaceName={activeMembership?.projectName || activeProject?.name || "Workspace"}
        healthPills={[
          {
            label: portalRole === "super_admin" ? "Super admin" : activeMembership?.role || "Viewer",
            tone: portalRole === "super_admin" ? "success" : "default",
          },
          {
            label: `${workspaceTeam.length} operators`,
            tone: workspaceTeam.length > 1 ? "success" : "warning",
          },
          {
            label: `${pendingInvites.length} invites`,
            tone: pendingInvites.length > 0 ? "warning" : "default",
          },
        ]}
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Active members" value={activeMembers.length} />
          <OpsMetricCard label="Pending invites" value={pendingInvites.length} emphasis={pendingInvites.length > 0 ? "warning" : "default"} />
          <OpsMetricCard
            label="Admins + owners"
            value={workspaceTeam.filter((member) => ["admin", "owner"].includes(member.role)).length}
          />
          <OpsMetricCard
            label="Review capacity"
            value={workspaceTeam.filter((member) => member.role === "reviewer").length}
          />
        </div>

        <div className="grid gap-4 xl:items-start xl:grid-cols-[1.1fr_0.9fr]">
          <OpsPanel
            eyebrow="Invite rail"
            title="Invite team member"
            description="Bring in operators, reviewers and analysts without over-granting access."
          >
            {canManageTeam ? (
              <form
                className="grid gap-4 md:grid-cols-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await inviteTeamMember({
                    name,
                    email,
                    role,
                    status: "invited",
                  });
                  setName("");
                  setEmail("");
                  setRole("reviewer");
                }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="rounded-[20px] border border-white/[0.04] bg-white/[0.025] px-4 py-3 outline-none transition focus:border-primary/40"
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="rounded-[20px] border border-white/[0.04] bg-white/[0.025] px-4 py-3 outline-none transition focus:border-primary/40"
                  required
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminTeamMember["role"])}
                  className="rounded-[20px] border border-white/[0.04] bg-white/[0.025] px-4 py-3 outline-none transition focus:border-primary/40"
                >
                  {ROLE_OPTIONS.filter((option) => canAssignOwner || option !== "owner").map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <button className="rounded-[20px] bg-primary px-4 py-3 font-bold text-black">
                  Invite
                </button>
              </form>
            ) : (
              <div className="rounded-[22px] border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
                Your current role is view-only for team settings. Owners and admins can invite or
                update members.
              </div>
            )}
          </OpsPanel>

          <OpsPanel
            eyebrow="Permission guide"
            title="Role ladder"
            description="A cleaner read on which role should own which class of work."
            tone="accent"
          >
            <div className="space-y-3">
              <RoleGuideCard
                role="owner"
                description="Full control over workspace settings, team access and high-risk operations."
              />
              <RoleGuideCard
                role="admin"
                description="Can operate campaigns, quests, rewards and team workflows without owning the workspace."
              />
              <RoleGuideCard
                role="reviewer"
                description="Focuses on submissions, claims, flags and moderation decisions."
              />
              <RoleGuideCard
                role="analyst"
                description="Read-only access for campaign, user and performance insights."
              />
            </div>
          </OpsPanel>
        </div>

        <OpsPanel
          eyebrow="Coverage view"
          title="Role breakdown"
          description="See whether the workspace is skewing too heavily to one kind of operator."
        >
          <div className="grid gap-3 md:grid-cols-4">
            {roleBreakdown.map((item) => (
              <div key={item.role} className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{item.role}</p>
                <p className="mt-2 text-[1.45rem] font-extrabold capitalize text-text">{item.count}</p>
              </div>
            ))}
          </div>
        </OpsPanel>

        <div className="grid gap-4 xl:items-start xl:grid-cols-2">
          <TeamSection
            title="Pending invites"
            subtitle="People who have been invited but have not fully become active in this workspace yet."
            members={pendingInvites}
            canManageTeam={canManageTeam}
            canAssignOwner={canAssignOwner}
            savingId={savingId}
            onMemberUpdate={handleMemberUpdate}
          />

          <TeamSection
            title="Active team"
            subtitle="Current operators inside this workspace."
            members={activeMembers}
            canManageTeam={canManageTeam}
            canAssignOwner={canAssignOwner}
            savingId={savingId}
            onMemberUpdate={handleMemberUpdate}
          />
        </div>
      </WorkspaceSettingsFrame>
    </AdminShell>
  );
}

function RoleGuideCard({
  role,
  description,
}: {
  role: AdminTeamMember["role"];
  description: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/[0.04] bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold capitalize text-text">{role}</p>
        <OpsStatusPill tone={role === "owner" ? "warning" : role === "reviewer" ? "success" : "default"}>
          {role}
        </OpsStatusPill>
      </div>
      <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
    </div>
  );
}

function TeamSection({
  title,
  subtitle,
  members,
  canManageTeam,
  canAssignOwner,
  savingId,
  onMemberUpdate,
}: {
  title: string;
  subtitle: string;
  members: AdminTeamMember[];
  canManageTeam: boolean;
  canAssignOwner: boolean;
  savingId: string | null;
  onMemberUpdate: (
    memberId: string,
    input: Pick<AdminTeamMember, "role" | "status">
  ) => Promise<void>;
}) {
  return (
    <OpsPanel eyebrow="Team lane" title={title} description={subtitle}>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="rounded-[18px] border border-white/[0.04] bg-white/[0.025] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-text">{member.name}</h3>
                <p className="mt-2 text-sm text-sub">{member.email}</p>
                {member.joinedAt ? (
                  <p className="mt-2 text-xs text-sub">
                    Joined {new Date(member.joinedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>

              {canManageTeam ? (
                <div className="grid min-w-[220px] gap-3">
                  <select
                    value={member.role}
                    disabled={savingId === member.id}
                    onChange={(e) =>
                      onMemberUpdate(member.id, {
                        role: e.target.value as AdminTeamMember["role"],
                        status: member.status,
                      })
                    }
                    className="rounded-[18px] border border-white/[0.04] bg-white/[0.02] px-4 py-3 outline-none"
                  >
                    {ROLE_OPTIONS.filter((option) => canAssignOwner || option !== "owner").map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>

                  <select
                    value={member.status}
                    disabled={savingId === member.id}
                    onChange={(e) =>
                      onMemberUpdate(member.id, {
                        role: member.role,
                        status: e.target.value as AdminTeamMember["status"],
                      })
                    }
                    className="rounded-[18px] border border-white/[0.04] bg-white/[0.02] px-4 py-3 outline-none"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-semibold capitalize text-primary">{member.role}</p>
                  <p className="mt-2 text-sm capitalize text-sub">{member.status}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 ? (
          <InlineEmptyNotice
            title="No members in this section yet"
            description="As invites go out or teammates become active, they will appear here with the right role and status controls."
          />
        ) : null}
      </div>
    </OpsPanel>
  );
}
