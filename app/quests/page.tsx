"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
  OpsMetricCard,
  OpsPanel,
  OpsSearchInput,
  OpsSelect,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { useAdminPortalStore } from "@/store/ui/useAdminPortalStore";

export default function QuestsPage() {
  const quests = useAdminPortalStore((s) => s.quests);
  const campaigns = useAdminPortalStore((s) => s.campaigns);
  const projects = useAdminPortalStore((s) => s.projects);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [questType, setQuestType] = useState("all");
  const [questsView, setQuestsView] = useState<"board" | "verification">("board");

  const filteredQuests = useMemo(() => {
    return quests.filter((quest) => {
      const campaign = campaigns.find((c) => c.id === quest.campaignId);
      const project = projects.find((p) => p.id === quest.projectId);
      const term = search.toLowerCase();

      const matchesSearch =
        quest.title.toLowerCase().includes(term) ||
        quest.description.toLowerCase().includes(term) ||
        (campaign?.title || "").toLowerCase().includes(term) ||
        (project?.name || "").toLowerCase().includes(term);

      const matchesStatus = status === "all" || quest.status === status;
      const matchesQuestType = questType === "all" || quest.questType === questType;

      return matchesSearch && matchesStatus && matchesQuestType;
    });
  }, [campaigns, projects, questType, quests, search, status]);

  const activeCount = quests.filter((quest) => quest.status === "active").length;
  const draftCount = quests.filter((quest) => quest.status === "draft").length;
  const manualCount = quests.filter((quest) => quest.verificationType === "manual_review").length;
  const autoApproveCount = quests.filter((quest) => quest.autoApprove).length;
  const avgXp = quests.length
    ? Math.round(quests.reduce((sum, quest) => sum + quest.xp, 0) / quests.length)
    : 0;

  const verificationHeavyQuests = useMemo(
    () =>
      [...filteredQuests]
        .filter((quest) => quest.verificationType !== "manual_review" || quest.autoApprove)
        .sort((a, b) => Number(b.autoApprove) - Number(a.autoApprove) || b.xp - a.xp)
        .slice(0, 8),
    [filteredQuests]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Quest management"
        title="Quests"
        description="Split the quest surface between content inventory and verification posture so operators can move faster."
        actions={
          <Link
            href="/quests/new"
            className="rounded-2xl bg-primary px-4 py-3 font-bold text-black"
          >
            New Quest
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <OpsMetricCard label="Total quests" value={quests.length} />
              <OpsMetricCard
                label="Active"
                value={activeCount}
                emphasis={activeCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard
                label="Drafts"
                value={draftCount}
                emphasis={draftCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Manual review"
                value={manualCount}
                emphasis={manualCount > 0 ? "warning" : "default"}
              />
              <OpsMetricCard
                label="Auto approve"
                value={autoApproveCount}
                emphasis={autoApproveCount > 0 ? "primary" : "default"}
              />
              <OpsMetricCard label="Avg XP" value={avgXp} />
            </div>

            <OpsPanel
              title="Quest work modes"
              description="Use board mode for quest inventory and verification mode when you want to inspect how quests are expected to clear."
              action={
                <SegmentToggle
                  value={questsView}
                  onChange={setQuestsView}
                  options={[
                    { value: "board", label: "Board" },
                    { value: "verification", label: "Verification" },
                  ]}
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Board
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Scan quest inventory by project, campaign, type and XP value.
                  </p>
                </div>
                <div className="rounded-[22px] border border-line bg-card2 px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                    Verification
                  </p>
                  <p className="mt-2 text-sm leading-6 text-sub">
                    Pull verification-heavy and auto-approve quests into their own operating lane.
                  </p>
                </div>
              </div>
            </OpsPanel>

            <OpsFilterBar>
              <OpsSearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search quests..."
                ariaLabel="Search quests"
                name="quest-search"
              />
              <OpsSelect
                value={status}
                onChange={setStatus}
                ariaLabel="Filter quests by status"
                name="quest-status"
              >
                <option value="all">all statuses</option>
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="archived">archived</option>
              </OpsSelect>
              <OpsSelect
                value={questType}
                onChange={setQuestType}
                ariaLabel="Filter quests by type"
                name="quest-type"
              >
                <option value="all">all quest types</option>
                <option value="social_follow">social follow</option>
                <option value="social_like">social like</option>
                <option value="social_repost">social repost</option>
                <option value="social_comment">social comment</option>
                <option value="telegram_join">telegram join</option>
                <option value="discord_join">discord join</option>
                <option value="wallet_connect">wallet connect</option>
                <option value="token_hold">token hold</option>
                <option value="nft_hold">nft hold</option>
                <option value="onchain_tx">on-chain tx</option>
                <option value="url_visit">url visit</option>
                <option value="referral">referral</option>
                <option value="manual_proof">manual proof</option>
                <option value="custom">custom</option>
              </OpsSelect>
            </OpsFilterBar>
          </div>
        }
      >
        {questsView === "board" ? (
          <OpsPanel
            eyebrow="Quest roster"
            title="Quest stream"
            description="The current quest list with project context, campaign alignment and a fast route into detail."
          >
            <div className="overflow-hidden rounded-[24px] border border-line bg-card2">
              <div className="grid grid-cols-8 border-b border-line px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-sub">
                <div>Quest</div>
                <div>Project</div>
                <div>Campaign</div>
                <div>Quest Type</div>
                <div>Status</div>
                <div>XP</div>
                <div>Auto</div>
                <div>Open</div>
              </div>

              {filteredQuests.map((quest) => {
                const campaign = campaigns.find((c) => c.id === quest.campaignId);
                const project = projects.find((p) => p.id === quest.projectId);

                return (
                  <div
                    key={quest.id}
                    className="grid grid-cols-8 items-center border-b border-line/60 px-5 py-4 text-sm text-text last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold">{quest.title}</p>
                      <p className="mt-1 text-xs text-sub">{quest.actionLabel}</p>
                    </div>
                    <div>{project?.name || "-"}</div>
                    <div>{campaign?.title || "-"}</div>
                    <div className="capitalize">{quest.questType.replace(/_/g, " ")}</div>
                    <div>
                      <OpsStatusPill
                        tone={
                          quest.status === "active"
                            ? "success"
                            : quest.status === "draft"
                              ? "warning"
                              : "default"
                        }
                      >
                        {quest.status}
                      </OpsStatusPill>
                    </div>
                    <div>{quest.xp}</div>
                    <div>{quest.autoApprove ? "Yes" : "No"}</div>
                    <div>
                      <Link
                        href={`/quests/${quest.id}`}
                        className="rounded-xl border border-line bg-card px-3 py-2 font-semibold"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}

              {filteredQuests.length === 0 ? (
                <div className="px-5 py-8 text-sm text-sub">No quests match your filters.</div>
              ) : null}
            </div>
          </OpsPanel>
        ) : null}

        {questsView === "verification" ? (
          <OpsPanel
            eyebrow="Verification lane"
            title="Verification-heavy quests"
            description="This lane highlights quests where verification config and auto-approval have the most operational impact."
            tone="accent"
          >
            <div className="grid gap-4">
              {verificationHeavyQuests.map((quest) => {
                const campaign = campaigns.find((c) => c.id === quest.campaignId);
                const project = projects.find((p) => p.id === quest.projectId);
                return (
                  <div key={quest.id} className="rounded-[24px] border border-line bg-card2 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-lg font-extrabold text-text">{quest.title}</p>
                          <OpsStatusPill tone="default">
                            {quest.verificationType.replace(/_/g, " ")}
                          </OpsStatusPill>
                          {quest.autoApprove ? (
                            <OpsStatusPill tone="success">auto approve</OpsStatusPill>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-sub">{quest.description}</p>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <VerificationStat label="Project" value={project?.name || "-"} />
                          <VerificationStat label="Campaign" value={campaign?.title || "-"} />
                          <VerificationStat label="Quest type" value={quest.questType.replace(/_/g, " ")} />
                          <VerificationStat label="XP" value={quest.xp} />
                        </div>
                      </div>
                      <Link
                        href={`/quests/${quest.id}`}
                        className="rounded-2xl border border-line bg-card px-4 py-3 font-bold text-sub"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                );
              })}

              {verificationHeavyQuests.length === 0 ? (
                <div className="rounded-[24px] border border-line bg-card p-6 text-sm text-sub">
                  No verification-heavy quests match the current filters.
                </div>
              ) : null}
            </div>
          </OpsPanel>
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function VerificationStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
