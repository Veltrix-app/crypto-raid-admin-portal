"use client";

import { useEffect, useMemo, useState } from "react";
import {
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { PortalBillingBlockNotice } from "@/components/billing/PortalBillingBlockNotice";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import {
  createPortalWorkspaceInvite,
  updatePortalWorkspaceInvite,
} from "@/lib/accounts/account-onboarding";
import {
  isBillingLimitError,
  type BillingLimitBlock,
} from "@/lib/billing/entitlement-blocks";

type TeamMember = {
  id: string;
  authUserId: string;
  email: string | null;
  label: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: string;
  joinedAt: string | null;
};

type TeamInvite = {
  id: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: string;
  expiresAt: string;
  createdAt: string | null;
};

function getInviteTone(status: string) {
  if (status === "accepted") return "success";
  if (status === "pending") return "warning";
  if (status === "expired" || status === "revoked") return "default";
  return "default";
}

export default function AccountInvitePanel({
  accountId,
  onStateChange,
}: {
  accountId: string;
  onStateChange?: (state: { memberCount: number; pendingInviteCount: number }) => void;
}) {
  const { refresh } = useAccountEntryGuard();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actioningInviteId, setActioningInviteId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamInvite["role"]>("member");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [inviteBlock, setInviteBlock] = useState<BillingLimitBlock | null>(null);

  const pendingInviteCount = useMemo(
    () => invites.filter((invite) => invite.status === "pending").length,
    [invites]
  );

  async function loadState() {
    try {
      setLoading(true);
      setError("");
      setInviteBlock(null);
      const response = await fetch(`/api/accounts/${accountId}/invites`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Could not load team state.");
      }

      const nextMembers = Array.isArray(payload.members) ? (payload.members as TeamMember[]) : [];
      const nextInvites = Array.isArray(payload.invites) ? (payload.invites as TeamInvite[]) : [];
      setMembers(nextMembers);
      setInvites(nextInvites);
      onStateChange?.({
        memberCount: nextMembers.length,
        pendingInviteCount: nextInvites.filter((invite: TeamInvite) => invite.status === "pending")
          .length,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load team state.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadState();
  }, [accountId]);

  async function handleInvite() {
    if (!email.trim()) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setNotice("");
      setInviteBlock(null);
      const payload = await createPortalWorkspaceInvite({
        accountId,
        email: email.trim(),
        role,
      });

      const nextMembers = Array.isArray(payload.members) ? (payload.members as TeamMember[]) : [];
      const nextInvites = Array.isArray(payload.invites) ? (payload.invites as TeamInvite[]) : [];
      setMembers(nextMembers);
      setInvites(nextInvites);
      setNotice(
        payload.created === false
          ? "A pending invite already exists for this email."
          : "Invite created."
      );
      setEmail("");
      setRole("member");
      onStateChange?.({
        memberCount: nextMembers.length,
        pendingInviteCount: nextInvites.filter((invite: TeamInvite) => invite.status === "pending")
          .length,
      });
      await refresh();
    } catch (inviteError) {
      if (isBillingLimitError(inviteError)) {
        setInviteBlock(inviteError.block);
        return;
      }

      setError(inviteError instanceof Error ? inviteError.message : "Invite creation failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleInviteAction(inviteId: string, action: "resend" | "revoke") {
    try {
      setActioningInviteId(inviteId);
      setError("");
      setNotice("");
      setInviteBlock(null);
      const payload = await updatePortalWorkspaceInvite({
        accountId,
        inviteId,
        action,
      });

      const nextMembers = Array.isArray(payload.members) ? (payload.members as TeamMember[]) : [];
      const nextInvites = Array.isArray(payload.invites) ? (payload.invites as TeamInvite[]) : [];
      setMembers(nextMembers);
      setInvites(nextInvites);
      setNotice(action === "resend" ? "Invite resent." : "Invite revoked.");
      onStateChange?.({
        memberCount: nextMembers.length,
        pendingInviteCount: nextInvites.filter((invite) => invite.status === "pending").length,
      });
      await refresh();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Invite action failed.");
    } finally {
      setActioningInviteId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <OpsPanel
        eyebrow="Invite teammates"
        title="Create workspace invites"
        description="Workspace roles stay intentionally simple in this phase. This rail handles creation, resend, revoke and acceptance posture without burying the flow inside project-only settings."
        tone="accent"
      >
        <div className="space-y-4">
          {inviteBlock ? (
            <PortalBillingBlockNotice
              block={inviteBlock}
              title="Adding another billable teammate needs a plan upgrade"
            />
          ) : null}

          <label className="block space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
              Invite email
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@workspace.com"
              className="w-full rounded-[20px] border border-white/[0.026] bg-black/20 px-4 py-4 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
              Workspace role
            </span>
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as TeamInvite["role"]);
                setInviteBlock(null);
              }}
              className="w-full rounded-[20px] border border-white/[0.026] bg-black/20 px-4 py-4 text-sm text-text outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
              <option value="viewer">viewer</option>
              <option value="owner">owner</option>
            </select>
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <OpsSnapshotRow label="Current members" value={String(members.length)} />
            <OpsSnapshotRow label="Pending invites" value={String(pendingInviteCount)} />
          </div>

          {error ? (
            <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/[0.055] px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-[18px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {notice}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleInvite()}
              disabled={saving || !email.trim()}
              className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Sending invite..." : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => void loadState()}
              className="rounded-full border border-white/[0.028] bg-white/[0.014] px-5 py-3 text-sm font-semibold text-text"
            >
              Refresh
            </button>
          </div>
        </div>
      </OpsPanel>

      <div className="space-y-6">
        <OpsPanel
          eyebrow="Members"
          title="Current workspace members"
          description="Workspace membership now exists above projects, so the team rail stays clean even before deeper project or console grants land."
        >
          {loading ? (
            <InlineEmptyNotice
              title="Loading team"
              description="VYNTRO is reading current members and pending invites for this workspace."
            />
          ) : members.length ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-text">{member.label}</p>
                      <p className="mt-2 text-sm text-sub">
                        {member.email ?? `auth:${member.authUserId.slice(0, 8)}`}
                      </p>
                    </div>
                    <OpsStatusPill tone={member.status === "active" ? "success" : "warning"}>
                      {member.role}
                    </OpsStatusPill>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <InlineEmptyNotice
              title="Only the owner is linked right now"
              description="Send the first invite to move this workspace from solo setup into team operations."
            />
          )}
        </OpsPanel>

        <OpsPanel
          eyebrow="Invite queue"
          title="Pending, accepted and expired invites"
          description="Pending invites stay actionable, while accepted or expired rows remain visible so the owner can see how the workspace team formed."
        >
          {loading ? (
            <InlineEmptyNotice
              title="Loading invites"
              description="VYNTRO is reading the invite queue for this workspace."
            />
          ) : invites.length ? (
            <div className="space-y-3">
              {invites.map((invite) => {
                const canResend = invite.status === "pending" || invite.status === "expired" || invite.status === "revoked";
                const canRevoke = invite.status === "pending";

                return (
                  <div
                    key={invite.id}
                    className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-text">{invite.email}</p>
                        <p className="text-sm text-sub">
                          {invite.role} access · {invite.status} until{" "}
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <OpsStatusPill tone={getInviteTone(invite.status)}>{invite.status}</OpsStatusPill>
                    </div>

                    {canResend || canRevoke ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {canResend ? (
                          <button
                            type="button"
                            onClick={() => void handleInviteAction(invite.id, "resend")}
                            disabled={actioningInviteId === invite.id}
                            className="rounded-full border border-white/[0.026] bg-black/20 px-4 py-2 text-sm font-semibold text-text transition hover:border-primary/20 hover:bg-primary/[0.055]"
                          >
                            {actioningInviteId === invite.id ? "Working..." : "Resend"}
                          </button>
                        ) : null}

                        {canRevoke ? (
                          <button
                            type="button"
                            onClick={() => void handleInviteAction(invite.id, "revoke")}
                            disabled={actioningInviteId === invite.id}
                            className="rounded-full border border-white/[0.026] bg-black/20 px-4 py-2 text-sm font-semibold text-text transition hover:border-rose-400/20 hover:bg-rose-500/[0.055]"
                          >
                            {actioningInviteId === invite.id ? "Working..." : "Revoke"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <InlineEmptyNotice
              title="No invite history yet"
              description="Once invites are sent, this queue shows pending, accepted, expired and revoked posture in one place."
            />
          )}
        </OpsPanel>
      </div>
    </div>
  );
}
