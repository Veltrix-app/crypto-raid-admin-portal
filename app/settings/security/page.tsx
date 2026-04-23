"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import WorkspaceSettingsFrame from "@/components/layout/shell/WorkspaceSettingsFrame";
import { StatePanel, LoadingState } from "@/components/layout/state/StatePrimitives";
import { useAccountEntryGuard } from "@/components/accounts/AccountEntryGuard";
import { SecuritySettingsCard } from "@/components/security/SecuritySettingsCard";
import { SessionReviewPanel } from "@/components/security/SessionReviewPanel";
import { DataRequestPanel } from "@/components/security/DataRequestPanel";
import { SsoConfigurationPanel } from "@/components/security/SsoConfigurationPanel";
import {
  createPortalDataRequest,
  fetchCurrentPortalSecurityAccount,
  revokePortalSecuritySession,
  updatePortalSecurityPolicy,
} from "@/lib/security/security-actions";
import { createClient } from "@/lib/supabase/client";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import type { PortalSecurityCurrentAccount } from "@/types/entities/security";

type PendingTwoFactorSetup = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

function TwoFactorSetupPanel({
  current,
  onRefreshed,
}: {
  current: PortalSecurityCurrentAccount;
  onRefreshed: () => Promise<void>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [pendingSetup, setPendingSetup] = useState<PendingTwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleStartSetup() {
    try {
      setLoading(true);
      setError(null);
      setFeedback(null);

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Veltrix Portal",
        issuer: "Veltrix",
      });

      if (enrollError || !data?.id || !("totp" in data) || !data.totp?.qr_code) {
        throw new Error(enrollError?.message || "Two-factor setup could not be started.");
      }

      setPendingSetup({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      });
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Two-factor setup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySetup() {
    if (!pendingSetup || !verificationCode.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setFeedback(null);

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: pendingSetup.factorId,
      });

      if (challengeError || !challenge?.id) {
        throw new Error(challengeError?.message || "Two-factor challenge could not be created.");
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: pendingSetup.factorId,
        challengeId: challenge.id,
        code: verificationCode.trim(),
      });

      if (verifyError) {
        throw new Error(verifyError.message);
      }

      setPendingSetup(null);
      setVerificationCode("");
      setFeedback("Two-factor authentication is now enabled for this portal account.");
      await onRefreshed();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Two-factor verification failed.");
    } finally {
      setLoading(false);
    }
  }

  const qrImageUrl = pendingSetup?.qrCode
    ? `data:image/svg+xml;utf-8,${encodeURIComponent(pendingSetup.qrCode)}`
    : null;

  return (
    <OpsPanel
      eyebrow="Two-factor authentication"
      title="Protect portal access with TOTP"
      description="Owners and admins can satisfy enterprise 2FA policy here. Enabling TOTP also raises the current session to `aal2` once verified."
      tone="accent"
    >
      <div className="flex flex-wrap gap-2">
        <OpsStatusPill tone={current.userPosture?.twoFactorEnabled ? "success" : "warning"}>
          {current.userPosture?.twoFactorEnabled ? "2FA enabled" : "2FA not enabled"}
        </OpsStatusPill>
        <OpsStatusPill>{current.userPosture?.currentAal ?? "aal1"}</OpsStatusPill>
      </div>

      {!current.userPosture?.twoFactorEnabled ? (
        <div className="mt-5 space-y-4">
          {!pendingSetup ? (
            <button
              type="button"
              onClick={() => void handleStartSetup()}
              disabled={loading}
              className="rounded-[18px] bg-primary px-4 py-3 text-sm font-black text-black transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? "Preparing..." : "Start TOTP setup"}
            </button>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
              <div className="rounded-[22px] border border-line bg-card2 p-4">
                {qrImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrImageUrl} alt="Veltrix TOTP QR code" className="w-full rounded-[18px] bg-white p-3" />
                ) : null}
              </div>
              <div className="space-y-4 rounded-[22px] border border-line bg-card2 p-4">
                <p className="text-sm leading-6 text-sub">
                  Scan this QR code in your authenticator app, or use the manual secret below.
                </p>
                <div className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">Manual secret</p>
                  <p className="mt-2 break-all text-sm font-semibold text-text">{pendingSetup.secret}</p>
                </div>
                <input
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  placeholder="Enter the 6-digit code"
                  className="w-full rounded-[18px] border border-line bg-black/20 px-4 py-3 text-sm text-text placeholder:text-sub/70 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleVerifySetup()}
                    disabled={loading}
                    className="rounded-[18px] bg-primary px-4 py-3 text-sm font-black text-black transition hover:brightness-105 disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify and enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingSetup(null);
                      setVerificationCode("");
                    }}
                    className="rounded-[18px] border border-white/12 px-4 py-3 text-sm font-semibold text-text transition hover:border-primary/30 hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-sub">
          Two-factor authentication is already enabled. Keep at least one active authenticator app available for future step-up prompts.
        </p>
      )}

      {feedback ? <p className="mt-4 text-sm text-emerald-300">{feedback}</p> : null}
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </OpsPanel>
  );
}

function SettingsSecurityContent() {
  const { accessState } = useAccountEntryGuard();
  const [current, setCurrent] = useState<PortalSecurityCurrentAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);

  async function loadCurrentSecurity() {
    try {
      setLoading(true);
      setError(null);
      const nextCurrent = await fetchCurrentPortalSecurityAccount();
      setCurrent(nextCurrent);
    } catch (loadError) {
      setCurrent(null);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load workspace security."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCurrentSecurity();
  }, []);

  const workspaceName = accessState?.primaryAccount?.name ?? current?.accountName ?? "Workspace";
  const canManagePolicy = ["owner", "admin"].includes(current?.membershipRole ?? "");

  async function handleRevokeSession(sessionId: string) {
    try {
      setRevokingSessionId(sessionId);
      setFeedback(null);
      await revokePortalSecuritySession(sessionId);
      await loadCurrentSecurity();
      setFeedback("Session revoked.");
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "Failed to revoke session.");
    } finally {
      setRevokingSessionId(null);
    }
  }

  async function handleCreateRequest(input: { requestType: "export" | "delete"; summary: string }) {
    if (!current?.customerAccountId) {
      return;
    }

    try {
      setFeedback(null);
      await createPortalDataRequest({
        accountId: current.customerAccountId,
        requestType: input.requestType,
        summary: input.summary,
      });
      await loadCurrentSecurity();
      setFeedback("Data request submitted.");
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to create data request."
      );
    }
  }

  async function handleSavePolicy(
    input: Omit<Parameters<typeof updatePortalSecurityPolicy>[0], "accountId">
  ) {
    if (!current?.customerAccountId) {
      return;
    }

    try {
      setSavingPolicy(true);
      setFeedback(null);
      await updatePortalSecurityPolicy({
        accountId: current.customerAccountId,
        ...input,
      });
      await loadCurrentSecurity();
      setFeedback("Security policy updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save policy.");
    } finally {
      setSavingPolicy(false);
    }
  }

  if (loading) {
    return (
      <LoadingState
        title="Loading security controls"
        description="Veltrix is resolving session posture, workspace policy and enterprise access controls."
      />
    );
  }

  if (error && !current) {
    return (
      <StatePanel
        title="Security settings could not load"
        description={error}
        tone="warning"
        actions={
          <button
            type="button"
            onClick={() => void loadCurrentSecurity()}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!current) {
    return (
      <StatePanel
        title="No security posture is available yet"
        description="Create or join a workspace account first, then return here to manage access security."
        tone="warning"
      />
    );
  }

  return (
    <WorkspaceSettingsFrame
      title="Security"
      description="Manage 2FA, session posture, data lifecycle requests and enterprise identity controls from one settings rail."
      workspaceName={workspaceName}
      healthPills={[
        {
          label: current.userPosture?.twoFactorEnabled ? "2FA enabled" : "2FA pending",
          tone: current.userPosture?.twoFactorEnabled ? "success" : "warning",
        },
        {
          label: current.requiresSso ? "SSO required" : "SSO optional",
          tone: current.requiresSso ? "warning" : "default",
        },
        {
          label: current.userPosture?.currentAal ?? "aal1",
          tone: current.userPosture?.currentAal === "aal2" ? "success" : "default",
        },
      ]}
    >
      {feedback ? (
        <div className="rounded-[22px] border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <SecuritySettingsCard current={current} />
        <TwoFactorSetupPanel current={current} onRefreshed={loadCurrentSecurity} />
        <SessionReviewPanel
          sessions={current.sessions}
          onRevoke={handleRevokeSession}
          revokingSessionId={revokingSessionId}
        />
        <DataRequestPanel requests={current.requests} onCreate={handleCreateRequest} />

        {current.customerAccountId && canManagePolicy ? (
          <SsoConfigurationPanel
            current={current}
            onSave={handleSavePolicy}
            saving={savingPolicy}
          />
        ) : (
          <OpsPanel
            eyebrow="Enterprise identity"
            title="Policy visibility"
            description="Only workspace owners/admins can update the enterprise security controls for this account."
          >
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={current.requiresSso ? "warning" : "default"}>
                {current.requiresSso ? "SSO required" : "SSO optional"}
              </OpsStatusPill>
              <OpsStatusPill tone={current.requiresTwoFactor ? "warning" : "default"}>
                {current.requiresTwoFactor ? "2FA enforced for your role" : "2FA optional"}
              </OpsStatusPill>
            </div>
          </OpsPanel>
        )}
      </div>
    </WorkspaceSettingsFrame>
  );
}

export default function SettingsSecurityPage() {
  return (
    <AdminShell>
      <SettingsSecurityContent />
    </AdminShell>
  );
}
