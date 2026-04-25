"use client";

import Link from "next/link";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { formatSecurityLabel } from "@/lib/security/security-contract";
import type { AdminSecurityAccountSummary } from "@/types/entities/security";

export function SecurityQueueTable({
  title,
  description,
  accounts,
}: {
  title: string;
  description: string;
  accounts: AdminSecurityAccountSummary[];
}) {
  return (
    <OpsPanel eyebrow="Queue" title={title} description={description}>
      {accounts.length ? (
        <div className="space-y-2.5">
          {accounts.map((account) => (
            <Link
              key={account.customerAccountId}
              href={`/security/accounts/${account.customerAccountId}`}
              className="block rounded-[16px] border border-white/[0.025] bg-white/[0.014] p-3 transition hover:border-white/[0.08]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-text">{account.accountName}</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-sub">
                    {account.teamMemberCount} members | {account.activeSessionCount} active sessions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone="default">
                    {account.weakPosture ? "Needs review" : "Healthy"}
                  </OpsStatusPill>
                  <OpsStatusPill>{formatSecurityLabel(account.policyStatus)}</OpsStatusPill>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <InlineEmptyNotice title="Queue is clear" description="No accounts are currently sitting in this security queue." />
      )}
    </OpsPanel>
  );
}
