"use client";

import {
  OpsMetricCard,
  OpsPanel,
  OpsSnapshotRow,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { PortalSecurityCurrentAccount } from "@/types/entities/security";

export function SecuritySettingsCard({
  current,
}: {
  current: PortalSecurityCurrentAccount;
}) {
  const posture = current.userPosture;

  return (
    <OpsPanel
      eyebrow="Security posture"
      title="Current access security"
      description="See the live state of your session, factor posture and account-level enterprise controls."
      tone="accent"
    >
      <div className="grid gap-4 md:grid-cols-4">
        <OpsMetricCard
          label="2FA"
          value={posture?.twoFactorEnabled ? "Enabled" : "Not enabled"}
          emphasis={posture?.twoFactorEnabled ? "primary" : "warning"}
        />
        <OpsMetricCard
          label="Current AAL"
          value={posture?.currentAal ?? "aal1"}
          emphasis={posture?.currentAal === "aal2" ? "primary" : "default"}
        />
        <OpsMetricCard
          label="Auth method"
          value={formatSecurityLabel(posture?.currentAuthMethod)}
        />
        <OpsMetricCard
          label="Verified factors"
          value={posture?.verifiedFactorCount ?? 0}
          emphasis={(posture?.verifiedFactorCount ?? 0) > 0 ? "primary" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <OpsSnapshotRow
            label="Workspace account"
            value={current.accountName ?? "No primary workspace account yet"}
          />
          <OpsSnapshotRow
            label="Workspace role"
            value={current.membershipRole ?? "No active workspace membership"}
          />
          <OpsSnapshotRow
            label="Security contact"
            value={current.policy?.securityContactEmail || "Not set"}
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
              Enterprise requirements
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <OpsStatusPill tone={current.requiresTwoFactor ? "warning" : "success"}>
                {current.requiresTwoFactor ? "2FA required for your role" : "2FA optional"}
              </OpsStatusPill>
              <OpsStatusPill tone={current.requiresSso ? "warning" : "default"}>
                {current.requiresSso ? "SSO required" : "SSO optional"}
              </OpsStatusPill>
            </div>
            <p className="mt-3 text-sm leading-6 text-sub">
              Enterprise workspace controls can require 2FA for owners/admins and restrict portal access to SSO-managed sessions.
            </p>
          </div>
        </div>
      </div>
    </OpsPanel>
  );
}
