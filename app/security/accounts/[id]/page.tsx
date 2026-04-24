"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { LoadingState, StatePanel } from "@/components/layout/state/StatePrimitives";
import { SecurityAccountDetail } from "@/components/security/SecurityAccountDetail";
import { SsoConfigurationPanel } from "@/components/security/SsoConfigurationPanel";
import {
  fetchSecurityAccountDetail,
  updatePortalDataRequest,
  updatePortalSecurityPolicy,
} from "@/lib/security/security-actions";
import type { AdminSecurityAccountDetail } from "@/types/entities/security";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";
import { OpsMetricCard, OpsPanel, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

function RequestActionButtons({
  accountId,
  requestId,
  onChanged,
}: {
  accountId: string;
  requestId: string;
  onChanged: () => Promise<void>;
}) {
  const [saving, setSaving] = useState<string | null>(null);

  async function runAction(action: "review" | "request_verification" | "approve" | "reject" | "complete") {
    try {
      setSaving(action);
      await updatePortalDataRequest({
        accountId,
        requestId,
        action,
      });
      await onChanged();
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(["review", "request_verification", "approve", "reject", "complete"] as const).map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => void runAction(action)}
          disabled={saving === action}
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold text-text transition hover:border-primary/30 hover:text-primary disabled:opacity-60"
        >
          {saving === action ? "Saving..." : action.replaceAll("_", " ")}
        </button>
      ))}
    </div>
  );
}

export default function SecurityAccountDetailPage() {
  const params = useParams<{ id: string }>();
  const role = useAdminAuthStore((s) => s.role);
  const [detail, setDetail] = useState<AdminSecurityAccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [savingPolicy, setSavingPolicy] = useState(false);

  async function loadDetail() {
    if (!params?.id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextDetail = await fetchSecurityAccountDetail(params.id);
      setDetail(nextDetail);
    } catch (loadError) {
      setDetail(null);
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load security account detail."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === "super_admin") {
      void loadDetail();
    } else {
      setLoading(false);
    }
  }, [params?.id, refreshNonce, role]);

  async function handleSavePolicy(
    input: Omit<Parameters<typeof updatePortalSecurityPolicy>[0], "accountId">
  ) {
    if (!params?.id) {
      return;
    }

    try {
      setSavingPolicy(true);
      await updatePortalSecurityPolicy({
        accountId: params.id,
        ...input,
      });
      setRefreshNonce((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save security policy.");
    } finally {
      setSavingPolicy(false);
    }
  }

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Security account detail is internal-only"
          description="Only Veltrix super admins can inspect cross-account security posture and request lifecycle data."
          tone="warning"
          actions={
            <Link
              href="/security"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Back to security
            </Link>
          }
        />
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading security account detail"
          description="Veltrix is resolving account policy, session posture and lifecycle requests."
        />
      </AdminShell>
    );
  }

  if (error || !detail) {
    return (
      <AdminShell>
        <StatePanel
          title="Security account detail could not load"
          description={error ?? "This account did not return a valid security payload."}
          tone="warning"
          actions={
            <button
              type="button"
              onClick={() => setRefreshNonce((value) => value + 1)}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Retry
            </button>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Security account"
        title={detail.account.accountName}
        description="Inspect and operate the security posture of this workspace account."
        actions={
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">Security state</p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={detail.account.weakPosture ? "warning" : "success"}>
                {detail.account.weakPosture ? "Needs review" : "Healthy"}
              </OpsStatusPill>
              <OpsStatusPill>{detail.account.policyStatus.replaceAll("_", " ")}</OpsStatusPill>
            </div>
            <Link
              href="/security"
              className="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary"
            >
              Back to security
            </Link>
          </div>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <OpsMetricCard label="Policy" value={detail.account.policyStatus.replaceAll("_", " ")} emphasis="primary" />
              <OpsMetricCard label="Members" value={detail.members.length} />
              <OpsMetricCard label="Requests" value={detail.requests.length} emphasis={detail.requests.length > 0 ? "warning" : "default"} />
              <OpsMetricCard label="Sessions" value={detail.sessions.length} emphasis={detail.sessions.length > 0 ? "primary" : "default"} />
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(18,24,36,0.84),rgba(12,16,24,0.92))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    Account command read
                  </p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
                    Read weak posture and lifecycle pressure first, then decide whether the next move is policy tightening, SSO cleanup, or request handling.
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    This drilldown should keep trust posture, open requests and the next operator move visible before you drop into member-level cleanup.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <OpsSnapshotRow label="Now" value={detail.account.weakPosture ? "Account posture still needs cleanup" : "Account posture looks healthy"} />
                <OpsSnapshotRow label="Next" value={detail.requests.length > 0 ? `Review ${detail.requests.length} lifecycle request${detail.requests.length === 1 ? "" : "s"}` : "Check SSO and member posture"} />
                <OpsSnapshotRow label="Watch" value={detail.members.some((member) => !member.security?.twoFactorEnabled) ? "At least one member still needs 2FA" : "Admin 2FA posture looks calm"} />
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <SecurityAccountDetail detail={detail} />

          <OpsPanel
            eyebrow="Requests"
            title="Review export and delete requests"
            description="Move requests through review, verification and completion without leaving the security workspace."
          >
            {detail.requests.length ? (
              <div className="space-y-3">
                {detail.requests.map((request) => (
                  <div key={request.id} className="rounded-[22px] border border-line bg-card2 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-3xl">
                        <p className="text-sm font-bold text-text">
                          {request.requestType.replaceAll("_", " ")}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-sub">{request.summary}</p>
                      </div>
                      <RequestActionButtons
                        accountId={detail.account.customerAccountId}
                        requestId={request.id}
                        onChanged={loadDetail}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <StatePanel
                title="No requests open"
                description="This account does not currently have export or delete requests in the queue."
                tone="success"
              />
            )}
          </OpsPanel>

          <SsoConfigurationPanel
            current={{
              customerAccountId: detail.account.customerAccountId,
              accountName: detail.account.accountName,
              membershipRole: "owner",
              policy: detail.policy,
              userPosture: null,
              sessions: detail.sessions,
              requests: detail.requests,
              ssoConnections: detail.ssoConnections,
              requiresTwoFactor: detail.account.twoFactorRequiredForAdmins,
              requiresSso: detail.account.ssoRequired,
            }}
            onSave={handleSavePolicy}
            saving={savingPolicy}
          />
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
