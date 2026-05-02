"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptPortalAccountInvite } from "@/lib/accounts/account-onboarding";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

export default function ReceivedWorkspaceInvitesCard() {
  const router = useRouter();
  const { overview, refresh } = useAccountEntryGuard();
  const [loadingInviteId, setLoadingInviteId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const invites = overview?.invites ?? [];

  if (!invites.length) {
    return null;
  }

  async function handleAccept(inviteId: string) {
    try {
      setLoadingInviteId(inviteId);
      setError("");
      await acceptPortalAccountInvite(inviteId);
      await refresh();
      router.refresh();
    } catch (acceptError) {
      setError(
        acceptError instanceof Error ? acceptError.message : "Invite acceptance failed."
      );
    } finally {
      setLoadingInviteId(null);
    }
  }

  return (
    <OpsPanel
      eyebrow="Workspace invites"
      title="Accept an existing workspace instead of bootstrapping a new one"
      description="This session already has pending workspace invites. Accept one of them to enter the right account context immediately, or ignore them and create a separate workspace if that is the intended path."
      tone="accent"
    >
      <div className="space-y-4">
        {error ? (
          <div className="rounded-[18px] border border-rose-400/20 bg-rose-500/[0.055] px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {invites.map((invite) => (
          <div
            key={invite.id}
            className="rounded-[16px] border border-white/[0.026] bg-white/[0.014] px-4 py-3.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-text">{invite.accountName}</p>
                <p className="mt-2 text-[12px] leading-5 text-sub">
                  {invite.role} access is waiting for {invite.email}. This invite expires on{" "}
                  {new Date(invite.expiresAt).toLocaleDateString()}.
                </p>
              </div>
              <OpsStatusPill tone={invite.status === "pending" ? "warning" : "default"}>
                {invite.status}
              </OpsStatusPill>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleAccept(invite.id)}
                disabled={loadingInviteId === invite.id || invite.status !== "pending"}
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingInviteId === invite.id ? "Accepting..." : "Accept invite"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </OpsPanel>
  );
}
