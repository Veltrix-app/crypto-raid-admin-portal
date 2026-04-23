"use client";

import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsPanel, OpsSnapshotRow, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
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
        eyebrow="Security account"
        title="Policy, incidents and access posture"
        description="Use this drilldown to inspect how the account is configured, who is missing security posture, and which lifecycle items still need action."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <OpsSnapshotRow label="Policy status" value={formatSecurityLabel(detail.account.policyStatus)} />
          <OpsSnapshotRow label="Billing status" value={detail.account.billingStatus ?? "Unknown"} />
          <OpsSnapshotRow label="Open requests" value={String(detail.account.openDataRequestCount)} />
          <OpsSnapshotRow label="Active incidents" value={String(detail.account.activeSecurityIncidentCount)} />
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
