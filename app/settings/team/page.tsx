"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { AdminTeamMember } from "@/types/entities/team-member";

const ROLE_OPTIONS: AdminTeamMember["role"][] = [
  "reviewer",
  "analyst",
  "admin",
  "owner",
];

const STATUS_OPTIONS: AdminTeamMember["status"][] = ["invited", "active"];

export default function SettingsTeamPage() {
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const inviteTeamMember = useAdminPortalStore((s) => s.inviteTeamMember);
  const updateTeamMember = useAdminPortalStore((s) => s.updateTeamMember);
  const activeMembership = useAdminAuthStore((s) =>
    s.memberships.find((item) => item.projectId === s.activeProjectId)
  );
  const portalRole = useAdminAuthStore((s) => s.role);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminTeamMember["role"]>("reviewer");
  const [savingId, setSavingId] = useState<string | null>(null);

  const canManageTeam = portalRole === "super_admin" || activeMembership?.role === "owner" || activeMembership?.role === "admin";
  const canAssignOwner = portalRole === "super_admin" || activeMembership?.role === "owner";
  const pendingInvites = teamMembers.filter((member) => member.status === "invited");
  const activeMembers = teamMembers.filter((member) => member.status === "active");
  const roleBreakdown = useMemo(
    () =>
      ROLE_OPTIONS.map((itemRole) => ({
        role: itemRole,
        count: teamMembers.filter((member) => member.role === itemRole).length,
      })),
    [teamMembers]
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
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Team Management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-text">Team</h1>
            <p className="mt-2 text-sm text-sub">
              Managing workspace access for {activeMembership?.projectName || "this project"}.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
              Your access
            </p>
            <p className="mt-2 text-lg font-extrabold capitalize text-text">
              {portalRole === "super_admin" ? "super admin" : activeMembership?.role || "viewer"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Active Members" value={activeMembers.length} />
          <MetricCard label="Pending Invites" value={pendingInvites.length} />
          <MetricCard
            label="Admins + Owners"
            value={teamMembers.filter((member) => ["admin", "owner"].includes(member.role)).length}
          />
          <MetricCard label="Review Capacity" value={teamMembers.filter((member) => member.role === "reviewer").length} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Invite Team Member</h2>
            <p className="mt-2 text-sm text-sub">
              Bring in operators, reviewers and analysts without over-granting access.
            </p>

            {canManageTeam ? (
              <form
                className="mt-5 grid gap-4 md:grid-cols-4"
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
                  className="rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                  required
                />
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as AdminTeamMember["role"])
                  }
                  className="rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
                >
                  {ROLE_OPTIONS.filter((option) => canAssignOwner || option !== "owner").map(
                    (option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    )
                  )}
                </select>
                <button className="rounded-2xl bg-primary px-4 py-3 font-bold text-black">
                  Invite
                </button>
              </form>
            ) : (
              <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
                Your current role is view-only for team settings. Owners and admins can invite or
                update members.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-line bg-card p-6">
            <h2 className="text-xl font-extrabold text-text">Role Guide</h2>
            <div className="mt-5 space-y-3">
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
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Role Breakdown</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {roleBreakdown.map((item) => (
              <div key={item.role} className="rounded-2xl border border-line bg-card2 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
                  {item.role}
                </p>
                <p className="mt-2 text-2xl font-extrabold capitalize text-text">
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <TeamSection
            title="Pending Invites"
            subtitle="People who have been invited but have not fully become active in this workspace yet."
            members={pendingInvites}
            canManageTeam={canManageTeam}
            canAssignOwner={canAssignOwner}
            savingId={savingId}
            onMemberUpdate={handleMemberUpdate}
          />

          <TeamSection
            title="Active Team"
            subtitle="Current operators inside this workspace."
            members={activeMembers}
            canManageTeam={canManageTeam}
            canAssignOwner={canAssignOwner}
            savingId={savingId}
            onMemberUpdate={handleMemberUpdate}
          />
        </div>
      </div>
    </AdminShell>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] border border-line bg-card p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-text">{value}</p>
    </div>
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
    <div className="rounded-2xl border border-line bg-card2 p-4">
      <p className="text-sm font-bold capitalize text-text">{role}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{description}</p>
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
    <div className="rounded-[28px] border border-line bg-card p-6">
      <h2 className="text-xl font-extrabold text-text">{title}</h2>
      <p className="mt-2 text-sm text-sub">{subtitle}</p>

      <div className="mt-5 space-y-4">
        {members.map((member) => (
          <div key={member.id} className="rounded-[24px] border border-line bg-card2 p-5">
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
                    className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
                  >
                    {ROLE_OPTIONS.filter((option) => canAssignOwner || option !== "owner").map(
                      (option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      )
                    )}
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
                    className="rounded-2xl border border-line bg-card px-4 py-3 outline-none"
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
          <p className="text-sm text-sub">No members in this section yet.</p>
        ) : null}
      </div>
    </div>
  );
}
