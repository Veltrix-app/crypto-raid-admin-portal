"use client";

import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsMetricCard, OpsPanel, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { AdminSecurityAccountDetail } from "@/types/entities/security";

export function SecurityAccountDetail({
  detail,
}: {
  detail: AdminSecurityAccountDetail;
}) {
  return (
    <div className="space-y-6">
      <OpsPanel
        eyebrow="Account command read"
        title="Pressure and next move"
        description="Use this short read before moving into member cleanup or lifecycle requests so the account security story is obvious at a glance."
        tone="accent"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <OpsSnapshotRow
            label="Now"
            value={detail.account.weakPosture ? "Account posture still needs cleanup" : "Account posture looks healthy"}
          />
          <OpsSnapshotRow
            label="Next"
            value={
              detail.requests.length > 0
                ? `Review ${detail.requests.length} open lifecycle request${detail.requests.length === 1 ? "" : "s"}`
                : "Check member posture and SSO configuration"
            }
          />
          <OpsSnapshotRow
            label="Watch"
            value={
              detail.members.some((member) => !member.security?.twoFactorEnabled)
                ? "At least one member still needs 2FA"
                : "Admin 2FA posture is currently calm"
            }
          />
        </div>
      </OpsPanel>

      <OpsPanel
        eyebrow="Security account"
        title="Policy, incidents and access posture"
        description="Use this drilldown to inspect how the account is configured, who is missing security posture, and which lifecycle items still need action."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OpsMetricCard label="Policy status" value={formatSecurityLabel(detail.account.policyStatus)} emphasis="primary" />
          <OpsMetricCard label="Billing status" value={detail.account.billingStatus ?? "Unknown"} />
          <OpsMetricCard label="Open requests" value={detail.account.openDataRequestCount} emphasis={detail.account.openDataRequestCount > 0 ? "warning" : "default"} />
          <OpsMetricCard label="Active incidents" value={detail.account.activeSecurityIncidentCount} emphasis={detail.account.activeSecurityIncidentCount > 0 ? "warning" : "default"} />
        </div>
      </OpsPanel>

      <OpsPanel eyebrow="Members" title="Who still needs security work" description="Owners and admins should be the first place you look when 2FA or SSO posture is weak.">
        {detail.members.length ? (
          <div className="space-y-3">
            {detail.members.map((member) => (
              <div key={member.authUserId} className="rounded-[22px] border border-line bg-card2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-text">{member.email}</p>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      {member.role} | {member.security?.currentAal ?? "aal1"} | {member.security?.twoFactorEnabled ? "2FA enabled" : "2FA missing"}
                    </p>
                  </div>
                  <OpsStatusPill tone={member.security?.twoFactorEnabled ? "success" : "warning"}>
                    {member.security?.twoFactorEnabled ? "Ready" : "Needs 2FA"}
                  </OpsStatusPill>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <InlineEmptyNotice title="No members found" description="This account does not currently have active memberships attached." />
        )}
      </OpsPanel>
    </div>
  );
}
