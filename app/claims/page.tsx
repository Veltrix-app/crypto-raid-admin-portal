"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { createClient } from "@/lib/supabase/client";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";
import { DbAuditLog } from "@/types/database";

export default function ClaimsPage() {
  const claims = useAdminPortalStore((s) => s.claims);
  const users = useAdminPortalStore((s) => s.users);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);
  const reviewFlags = useAdminPortalStore((s) => s.reviewFlags);
  const reviewClaim = useAdminPortalStore((s) => s.reviewClaim);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [rewardFinalizationLogs, setRewardFinalizationLogs] = useState<DbAuditLog[]>([]);
  const [retryingCampaignId, setRetryingCampaignId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<{
    tone: "default" | "error" | "success";
    text: string;
  } | null>(null);
  const [claimsView, setClaimsView] = useState<"queue" | "finalization">("queue");

  const usersByAuthId = new Map(
    users.filter((user) => !!user.authUserId).map((user) => [user.authUserId as string, user])
  );
  const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const flagsByClaimId = reviewFlags.reduce((acc, flag) => {
    if (flag.sourceTable !== "reward_claims") return acc;
    const existing = acc.get(flag.sourceId) ?? [];
    existing.push(flag);
    acc.set(flag.sourceId, existing);
    return acc;
  }, new Map<string, typeof reviewFlags>());

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const term = search.toLowerCase();
      const matchesSearch =
        claim.username.toLowerCase().includes(term) ||
        claim.rewardTitle.toLowerCase().includes(term) ||
        (claim.projectName || "").toLowerCase().includes(term) ||
        (claim.campaignTitle || "").toLowerCase().includes(term);

      const matchesStatus = status === "all" || claim.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [claims, search, status]);

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const processingCount = claims.filter((c) => c.status === "processing").length;
  const fulfilledCount = claims.filter((c) => c.status === "fulfilled").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;
  const highPriorityCount = claims.filter((claim) => {
    const user = usersByAuthId.get(claim.authUserId);
    return user?.status === "flagged" || (claim.rewardCost ?? 0) >= 500;
  }).length;
  const manualClaims = claims.filter((claim) => claim.claimMethod === "manual_fulfillment");
  const highValueClaims = claims.filter((claim) => (claim.rewardCost ?? 0) >= 500);
  const highPriorityClaims = filteredClaims.filter((claim) => {
    const user = usersByAuthId.get(claim.authUserId);
    const linkedFlags = flagsByClaimId.get(claim.id) ?? [];
    return user?.status === "flagged" || linkedFlags.length > 0 || (claim.rewardCost ?? 0) >= 500;
  });
  const latestFinalizationSignals = useMemo(() => {
    const latestByCampaign = new Map<string, DbAuditLog>();

    for (const log of rewardFinalizationLogs) {
      if (!latestByCampaign.has(log.source_id)) {
        latestByCampaign.set(log.source_id, log);
      }
    }

    return Array.from(latestByCampaign.values());
  }, [rewardFinalizationLogs]);
  const openFinalizationIncidents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return latestFinalizationSignals
      .filter((log) => log.action === "reward_finalization_failed")
      .map((log) => {
        const campaign = campaignsById.get(log.source_id);
        const project = campaign?.projectId ? projectsById.get(campaign.projectId) : undefined;

        return {
          log,
          campaignId: log.source_id,
          campaignTitle: campaign?.title ?? "Campaign pool",
          projectName: project?.name ?? "Unknown project",
        };
      })
      .filter((incident) => {
        if (!term) return true;
        return [incident.campaignTitle, incident.projectName, incident.log.summary]
          .some((value) => value.toLowerCase().includes(term));
      });
  }, [campaignsById, latestFinalizationSignals, projectsById, search]);
  const completedFinalizationSignals = latestFinalizationSignals.filter(
    (log) => log.action === "reward_finalization_completed"
  ).length;
  const failedFinalizationAttempts = rewardFinalizationLogs.filter(
    (log) => log.action === "reward_finalization_failed"
  ).length;

  async function loadRewardFinalizationLogs() {
    const supabase = createClient();
    const { data } = await supabase
      .from("admin_audit_logs")
      .select("*")
      .in("action", ["reward_finalization_failed", "reward_finalization_completed"])
      .order("created_at", { ascending: false })
      .limit(120);

    setRewardFinalizationLogs((data ?? []) as DbAuditLog[]);
  }

  async function handleQuickStatus(claimId: string, nextStatus: "processing" | "fulfilled") {
    try {
      setWorkingId(claimId);
      await reviewClaim(claimId, nextStatus);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleRetryFinalization(campaignId: string) {
    try {
      setRetryingCampaignId(campaignId);
      setRetryMessage({
        tone: "default",
        text: "Retrying reward finalization against the live campaign pool.",
      });

      const response = await fetch(`/api/campaigns/${campaignId}/finalize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Reward finalization failed.");
      }

      await loadRewardFinalizationLogs();
      setRetryMessage({
        tone: "success",
        text: "Reward finalization retried successfully. Open incidents should clear if the latest run completed.",
      });
    } catch (error) {
      setRetryMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Reward finalization retry failed.",
      });
    } finally {
      setRetryingCampaignId(null);
    }
  }

  useEffect(() => {
    void loadRewardFinalizationLogs();
  }, []);

  return (
    <AdminShell>
      <div className="space-y-6">
        <PortalPageFrame
          eyebrow="Reward claim management"
          title="Claims"
          description="Monitor payout pressure, prioritize risky requests and keep campaign pool incidents separate from the normal fulfillment lane."
          statusBand={
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <OpsMetricCard
                  label="Pending"
                  value={pendingCount}
                  emphasis={pendingCount > 0 ? "warning" : "default"}
                />
                <OpsMetricCard
                  label="Processing"
                  value={processingCount}
                  emphasis={processingCount > 0 ? "primary" : "default"}
                />
                <OpsMetricCard label="Fulfilled" value={fulfilledCount} />
                <OpsMetricCard label="Rejected" value={rejectedCount} />
              </div>

              <div className="rounded-[28px] border border-line bg-card p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      Workspace focus
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text">
                      Switch between fulfillment and payout incidents
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-sub">
                      Queue mode is for everyday claim handling. Finalization mode isolates campaign
                      pool failures and retries so they stop fighting for attention with the
                      standard claim flow.
                    </p>
                  </div>

                  <SegmentToggle
                    value={claimsView}
                    options={[
                      { value: "queue", label: "Fulfillment queue" },
                      { value: "finalization", label: "Finalization ops" },
                    ]}
                    onChange={setClaimsView}
                  />
                </div>
              </div>
            </div>
          }
        >
          {claimsView === "queue" ? (
            <>
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <OpsPanel
                  eyebrow="Operations focus"
                  title="Claims that deserve hands-on attention first"
                  description="Flagged users, high-value rewards and manual fulfillment routes get surfaced ahead of the normal queue."
                  tone="accent"
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <FocusCard
                      label="High priority"
                      value={highPriorityClaims.length}
                      hint="Flagged users, high-value rewards or explicit review flags."
                    />
                    <FocusCard
                      label="Manual queue"
                      value={manualClaims.filter((claim) => claim.status !== "fulfilled").length}
                      hint="Claims that still need human delivery or confirmation."
                    />
                    <FocusCard
                      label="Ready to fulfill"
                      value={claims.filter((claim) => claim.status === "processing").length}
                      hint="Claims already triaged and ready for final delivery."
                    />
                  </div>
                </OpsPanel>

                <OpsPanel
                  eyebrow="Volume mix"
                  title="Reward pressure by route"
                  description="A compact read on expensive and manual claim inventory."
                >
                  <div className="grid gap-4">
                    <OpsMetricCard
                      label="High priority"
                      value={highPriorityCount}
                      emphasis={highPriorityCount > 0 ? "warning" : "default"}
                    />
                    <OpsMetricCard label="Manual fulfillment" value={manualClaims.length} />
                    <OpsMetricCard
                      label="High value"
                      value={highValueClaims.length}
                      emphasis={highValueClaims.length > 0 ? "warning" : "default"}
                    />
                  </div>
                </OpsPanel>
              </div>

              <OpsFilterBar>
                <OpsSearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search user, reward, project or campaign..."
                  ariaLabel="Search claims"
                  name="claim-search"
                />
                <OpsSelect
                  value={status}
                  onChange={setStatus}
                  ariaLabel="Filter claims by status"
                  name="claim-status"
                >
                  <option value="all">all statuses</option>
                  <option value="pending">pending</option>
                  <option value="processing">processing</option>
                  <option value="fulfilled">fulfilled</option>
                  <option value="rejected">rejected</option>
                </OpsSelect>
                <div className="rounded-[20px] border border-line bg-card2 px-4 py-3 text-sm text-sub">
                  {filteredClaims.length} claims in view
                </div>
              </OpsFilterBar>

              <OpsPanel
                eyebrow="Fulfillment queue"
                title="Claim operations"
                description="Every claim includes risk context, the current decision route and a quick action when it is safe to move forward."
              >
                <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
                  <div className="grid grid-cols-9 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
                    <div>User</div>
                    <div>Reward</div>
                    <div>Project</div>
                    <div>Campaign</div>
                    <div>Risk</div>
                    <div>Status</div>
                    <div>Created</div>
                    <div>Quick action</div>
                    <div>Open</div>
                  </div>

                  {filteredClaims.map((claim) => {
                    const user = usersByAuthId.get(claim.authUserId);
                    const linkedFlags = flagsByClaimId.get(claim.id) ?? [];
                    const riskLabel =
                      user?.status === "flagged"
                        ? `Watch • Sybil ${user.sybilScore}`
                        : `Trust ${user?.trustScore ?? 50}`;
                    const priorityLabel =
                      linkedFlags.length > 0
                        ? linkedFlags[0].flagType.replace(/_/g, " ")
                        : (claim.rewardCost ?? 0) >= 500
                          ? "High value"
                          : claim.claimMethod === "manual_fulfillment"
                            ? "Manual"
                            : "Normal";
                    const decisionReason =
                      linkedFlags[0]?.reason ??
                      ((claim.rewardCost ?? 0) >= 500
                        ? "This reward is valuable enough to deserve an extra fulfillment checkpoint."
                        : claim.claimMethod === "manual_fulfillment"
                          ? "This claim depends on a manual delivery step from the project team."
                          : "This claim can move through the standard fulfillment flow.");

                    return (
                      <div
                        key={claim.id}
                        className="grid grid-cols-9 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                      >
                        <div className="font-semibold">{claim.username}</div>
                        <div>{claim.rewardTitle}</div>
                        <div>{claim.projectName || "-"}</div>
                        <div>{claim.campaignTitle || "-"}</div>
                        <div>
                          <div className="space-y-2">
                            <OpsStatusPill tone={user?.status === "flagged" ? "danger" : "default"}>
                              {riskLabel}
                            </OpsStatusPill>
                            <span className="block text-xs text-sub capitalize">{priorityLabel}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="capitalize text-primary">{claim.status}</p>
                          <p className="line-clamp-2 text-xs text-sub">{decisionReason}</p>
                        </div>
                        <div>{formatDate(claim.createdAt)}</div>
                        <div>
                          {claim.status === "pending" ? (
                            <button
                              onClick={() => handleQuickStatus(claim.id, "processing")}
                              disabled={workingId === claim.id}
                              className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                            >
                              {workingId === claim.id ? "Working..." : "Start"}
                            </button>
                          ) : claim.status === "processing" ? (
                            <button
                              onClick={() => handleQuickStatus(claim.id, "fulfilled")}
                              disabled={workingId === claim.id}
                              className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                            >
                              {workingId === claim.id ? "Working..." : "Fulfill"}
                            </button>
                          ) : (
                            <span className="text-xs text-sub">-</span>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/claims/${claim.id}`}
                            className="rounded-xl border border-line bg-card px-3 py-2 font-semibold"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    );
                  })}

                  {filteredClaims.length === 0 ? (
                    <div className="px-5 py-8 text-sm text-sub">No claims match your filters.</div>
                  ) : null}
                </div>
              </OpsPanel>
            </>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <OpsPanel
                  eyebrow="Campaign pool ops"
                  title="Reward finalization incidents"
                  description="These are campaigns where the latest reward distribution run failed and still need an operator retry."
                  tone="accent"
                >
                  {retryMessage ? (
                    <div
                      className={`mb-4 rounded-[18px] px-4 py-3 text-sm ${
                        retryMessage.tone === "error"
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-200"
                          : retryMessage.tone === "success"
                            ? "border border-primary/30 bg-primary/10 text-primary"
                            : "border border-line bg-card2 text-sub"
                      }`}
                    >
                      {retryMessage.text}
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    {openFinalizationIncidents.length > 0 ? (
                      openFinalizationIncidents.map((incident) => (
                        <div
                          key={incident.log.id}
                          className="rounded-[24px] border border-line bg-card2 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-text">
                                {incident.campaignTitle}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-sub">
                                {incident.projectName}
                              </p>
                            </div>
                            <OpsStatusPill tone="danger">Needs retry</OpsStatusPill>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-sub">{incident.log.summary}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-sub">
                            Last failed {formatDate(incident.log.created_at)}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              onClick={() => void handleRetryFinalization(incident.campaignId)}
                              disabled={retryingCampaignId === incident.campaignId}
                              className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"
                            >
                              {retryingCampaignId === incident.campaignId
                                ? "Retrying..."
                                : "Retry finalization"}
                            </button>
                            <Link
                              href={`/campaigns/${incident.campaignId}`}
                              className="rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold"
                            >
                              Open campaign
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[24px] border border-line bg-card2 px-4 py-5 text-sm text-sub">
                        No open reward finalization incidents are waiting on an operator retry.
                      </div>
                    )}
                  </div>
                </OpsPanel>

                <OpsPanel
                  eyebrow="Finalization read"
                  title="Campaign payout signal"
                  description="Track whether campaign pools are resolving cleanly or stacking up failed payout attempts."
                >
                  <div className="grid gap-4">
                    <OpsMetricCard
                      label="Open incidents"
                      value={openFinalizationIncidents.length}
                      emphasis={openFinalizationIncidents.length > 0 ? "warning" : "default"}
                    />
                    <OpsMetricCard
                      label="Recovered campaigns"
                      value={completedFinalizationSignals}
                    />
                    <OpsMetricCard
                      label="Failed attempts"
                      value={failedFinalizationAttempts}
                      emphasis={failedFinalizationAttempts > 0 ? "warning" : "default"}
                    />
                  </div>
                </OpsPanel>
              </div>

              <OpsPanel
                eyebrow="Finalization context"
                title="What this mode is isolating"
                description="Keep campaign pool failures separate from everyday claim handling so operators can resolve payout incidents without losing the fulfillment queue."
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <FocusCard
                    label="Open incidents"
                    value={openFinalizationIncidents.length}
                    hint="Campaigns whose latest distribution run still needs an operator retry."
                  />
                  <FocusCard
                    label="Recovered campaigns"
                    value={completedFinalizationSignals}
                    hint="Pools that completed successfully after the most recent recovery path."
                  />
                  <FocusCard
                    label="Failed attempts"
                    value={failedFinalizationAttempts}
                    hint="Recent payout runs that still signal operator follow-through is needed."
                  />
                </div>
              </OpsPanel>
            </div>
          )}
        </PortalPageFrame>
      </div>
    </AdminShell>
  );
}

function FocusCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-[24px] border border-line bg-card2 p-5">
      <p className="text-sm text-sub">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-text">{value}</p>
      <p className="mt-2 text-sm leading-6 text-sub">{hint}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
