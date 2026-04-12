"use client";

import { useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function SettingsTeamPage() {
  const teamMembers = useAdminPortalStore((s) => s.teamMembers);
  const inviteTeamMember = useAdminPortalStore((s) => s.inviteTeamMember);
  const activeProject = useAdminAuthStore((s) =>
    s.memberships.find((item) => item.projectId === s.activeProjectId)
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "reviewer" | "analyst">("reviewer");

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
              Managing workspace access for {activeProject?.projectName || "this project"}.
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-line bg-card p-6">
          <h2 className="text-xl font-extrabold text-text">Invite Team Member</h2>

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
                setRole(e.target.value as "owner" | "admin" | "reviewer" | "analyst")
              }
              className="rounded-2xl border border-line bg-card2 px-4 py-3 outline-none"
            >
              <option value="reviewer">reviewer</option>
              <option value="analyst">analyst</option>
              <option value="admin">admin</option>
              <option value="owner">owner</option>
            </select>
            <button className="rounded-2xl bg-primary px-4 py-3 font-bold text-black">
              Invite
            </button>
          </form>
        </div>

        <div className="grid gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-[24px] border border-line bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-text">{member.name}</h2>
                  <p className="mt-2 text-sm text-sub">{member.email}</p>
                  {member.joinedAt ? (
                    <p className="mt-2 text-xs text-sub">
                      Joined {new Date(member.joinedAt).toLocaleString()}
                    </p>
                  ) : null}
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold capitalize text-primary">
                    {member.role}
                  </p>
                  <p className="mt-2 text-sm capitalize text-sub">{member.status}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
