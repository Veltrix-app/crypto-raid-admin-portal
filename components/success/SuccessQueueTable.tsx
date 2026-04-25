"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  OpsFilterBar,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { humanizeSuccessValue } from "@/lib/success/success-contract";
import type { AdminSuccessAccountSummary } from "@/types/entities/success";

export type SuccessQueueFilters = {
  search: string;
  workspaceHealthState: string;
  successHealthState: string;
};

export function SuccessQueueTable({
  accounts,
  filters,
  loading,
  onFiltersChange,
}: {
  accounts: AdminSuccessAccountSummary[];
  filters: SuccessQueueFilters;
  loading: boolean;
  onFiltersChange: (value: SuccessQueueFilters) => void;
}) {
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (
        filters.search &&
        ![
          account.accountName,
          account.nextBestActionLabel,
          account.workspaceHealthState,
          account.successHealthState,
        ]
          .join(" ")
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      if (filters.workspaceHealthState && account.workspaceHealthState !== filters.workspaceHealthState) {
        return false;
      }

      if (filters.successHealthState && account.successHealthState !== filters.successHealthState) {
        return false;
      }

      return true;
    });
  }, [accounts, filters]);

  return (
    <div className="space-y-5">
      <OpsFilterBar>
        <OpsSearchInput
          value={filters.search}
          onChange={(search) => onFiltersChange({ ...filters, search })}
          placeholder="Search accounts or next actions"
        />
        <OpsSelect
          ariaLabel="Filter by workspace health"
          value={filters.workspaceHealthState}
          onChange={(workspaceHealthState) => onFiltersChange({ ...filters, workspaceHealthState })}
        >
          <option value="">All workspace health</option>
          <option value="not_started">Not started</option>
          <option value="activating">Activating</option>
          <option value="live">Live</option>
          <option value="stalled">Stalled</option>
        </OpsSelect>
        <OpsSelect
          ariaLabel="Filter by success health"
          value={filters.successHealthState}
          onChange={(successHealthState) => onFiltersChange({ ...filters, successHealthState })}
        >
          <option value="">All success health</option>
          <option value="healthy">Healthy</option>
          <option value="watching">Watching</option>
          <option value="expansion_ready">Expansion ready</option>
          <option value="churn_risk">Churn risk</option>
        </OpsSelect>
      </OpsFilterBar>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-[18px] border border-white/[0.025] bg-white/[0.014] px-4 py-4 text-sm text-sub">
            Loading success queue...
          </div>
        ) : filteredAccounts.length ? (
          filteredAccounts.map((account) => (
            <Link
              key={account.accountId}
              href={`/success/accounts/${account.accountId}`}
              className="block rounded-[18px] border border-white/[0.025] bg-white/[0.014] px-4 py-4 transition hover:border-white/[0.08]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">{account.accountName}</p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    {account.blockers[0] ?? account.nextBestActionLabel ?? "No immediate blocker."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <OpsStatusPill>{humanizeSuccessValue(account.workspaceHealthState)}</OpsStatusPill>
                  <OpsStatusPill tone="default">
                    {humanizeSuccessValue(account.successHealthState)}
                  </OpsStatusPill>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[18px] border border-white/[0.025] bg-white/[0.014] px-4 py-4 text-sm text-sub">
            No accounts match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
