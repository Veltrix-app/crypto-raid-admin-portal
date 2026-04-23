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
        <div className="space-y-3">
          {accounts.map((account) => (
            <Link
              key={account.customerAccountId}
              href={`/security/accounts/${account.customerAccountId}`}
              className="block rounded-[22px] border border-line bg-card2 p-4 transition hover:border-primary/30"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-text">{account.accountName}</p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    {account.teamMemberCount} members | {account.activeSessionCount} active sessions
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OpsStatusPill tone={account.weakPosture ? "warning" : "success"}>
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
