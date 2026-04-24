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
  OpsSnapshotRow,
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
      const campaign = campaigns.find((item) => item.id === quest.campaignId);
      const project = projects.find((item) => item.id === quest.projectId);
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
  const pausedCount = quests.filter((quest) => quest.status === "paused").length;
  const manualCount = quests.filter((quest) => quest.verificationType === "manual_review").length;
  const autoApproveCount = quests.filter((quest) => quest.autoApprove).length;
  const avgXp = quests.length
    ? Math.round(quests.reduce((sum, quest) => sum + quest.xp, 0) / quests.length)
    : 0;
  const campaignCoverage = new Set(quests.map((quest) => quest.campaignId)).size;

  const verificationHeavyQuests = useMemo(
    () =>
      [...filteredQuests]
        .filter((quest) => quest.verificationType !== "manual_review" || quest.autoApprove)
        .sort((a, b) => Number(b.autoApprove) - Number(a.autoApprove) || b.xp - a.xp),
    [filteredQuests]
  );

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Quest management"
        title="Quests"
        description="Keep quests readable as one system: a quiet inventory lane for the content itself, and a verification lane for moderation pressure and auto-clear posture."
        actions={
          <Link
            href="/quests/new"
            className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black"
          >
            New Quest
          </Link>
        }
        statusBand={
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
              <OpsPanel
                eyebrow="Current lane"
                title={
                  questsView === "board"
                    ? "Read the quest inventory"
                    : "Read verification pressure"
                }
                description={
                  questsView === "board"
                    ? "Stay in this lane when the goal is to understand the quest mix, campaign coverage and where progression value is concentrated."
                    : "Switch here when the team needs to reason about proof flow, auto-approval and what will create moderation load."
                }
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
                <div className="grid gap-3 md:grid-cols-3">
                  <OpsSnapshotRow
                    label="In view"
                    value={`${filteredQuests.length} quests match the current filters.`}
                  />
                  <OpsSnapshotRow
                    label="Campaign coverage"
                    value={`${campaignCoverage} campaign${campaignCoverage === 1 ? "" : "s"} currently rely on quest mechanics.`}
                  />
                  <OpsSnapshotRow
                    label="Next read"
                    value={
                      questsView === "board"
                        ? "Scan title, campaign and XP first, then open the quest that shapes the journey."
                        : "Look at route, auto-approval and proof intensity before you judge raw volume."
                    }
                  />
                </div>
              </OpsPanel>

              <div className="grid gap-4 sm:grid-cols-2">
                <OpsMetricCard label="Active" value={activeCount} emphasis="primary" />
                <OpsMetricCard label="Drafts" value={draftCount} emphasis="warning" />
                <OpsMetricCard
                  label="Manual review"
                  value={manualCount}
                  emphasis={manualCount > 0 ? "warning" : "default"}
                />
                <OpsMetricCard label="Avg XP" value={avgXp} />
              </div>
            </div>

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
          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <OpsPanel
              eyebrow="Quest posture"
              title="What the quest system is holding"
              description="Use this side to understand where proof intensity is building and whether the quest board still feels balanced."
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Auto-approval"
                  value={`${autoApproveCount} quest${autoApproveCount === 1 ? "" : "s"} can clear low-risk traffic automatically.`}
                />
                <OpsSnapshotRow
                  label="Paused"
                  value={`${pausedCount} quest${pausedCount === 1 ? "" : "s"} are waiting for manual intervention or a publish decision.`}
                />
                <OpsSnapshotRow
                  label="Verification drag"
                  value={`${manualCount} quest${manualCount === 1 ? "" : "s"} still depend on manual review as the primary route.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Quest roster"
              title="Read the quest stream"
              description="Start with quest and campaign context, then check type, status and XP before opening the detail workspace."
            >
              <div className="overflow-hidden rounded-[24px] border border-white/6 bg-white/[0.025]">
                <div className="grid grid-cols-8 border-b border-white/6 px-5 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-sub">
                  <div>Quest</div>
                  <div>Project</div>
                  <div>Campaign</div>
                  <div>Quest type</div>
                  <div>Status</div>
                  <div>XP</div>
                  <div>Auto</div>
                  <div>Open</div>
                </div>

                {filteredQuests.map((quest) => {
                  const campaign = campaigns.find((item) => item.id === quest.campaignId);
                  const project = projects.find((item) => item.id === quest.projectId);

                  return (
                    <div
                      key={quest.id}
                      className="grid grid-cols-8 items-center border-b border-white/6 px-5 py-4 text-sm text-text last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold">{quest.title}</p>
                        <p className="mt-1 text-xs text-sub">{quest.actionLabel}</p>
                      </div>
                      <div>{project?.name || "-"}</div>
                      <div>{campaign?.title || "-"}</div>
                      <div className="capitalize">{quest.questType.replace(/_/g, " ")}</div>
                      <div>
                        <OpsStatusPill tone={questStatusTone(quest.status)}>{quest.status}</OpsStatusPill>
                      </div>
                      <div>{quest.xp}</div>
                      <div>{quest.autoApprove ? "Yes" : "No"}</div>
                      <div>
                        <Link
                          href={`/quests/${quest.id}`}
                          className="rounded-full border border-white/6 bg-white/[0.025] px-3 py-2 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
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
          </div>
        ) : null}

        {questsView === "verification" ? (
          <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
            <OpsPanel
              eyebrow="Verification pressure"
              title="What can create moderation load"
              description="This lane is about route quality, proof friction and which quests are safe to let run hot."
              tone="accent"
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Manual first"
                  value={`${manualCount} quest${manualCount === 1 ? "" : "s"} still need an operator to clear incoming proofs.`}
                />
                <OpsSnapshotRow
                  label="Auto-clear"
                  value={`${autoApproveCount} quest${autoApproveCount === 1 ? "" : "s"} already have some lower-friction verification posture.`}
                />
                <OpsSnapshotRow
                  label="What to open next"
                  value="Prioritize high-XP quests with auto-clear or non-manual verification, because those change throughput fastest."
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Verification board"
              title="Open the quests that shape review posture"
              description="These quests create the most operational leverage because they change how proof flows are cleared."
            >
              <div className="grid gap-3">
                {verificationHeavyQuests.map((quest) => {
                  const campaign = campaigns.find((item) => item.id === quest.campaignId);
                  const project = projects.find((item) => item.id === quest.projectId);
                  return (
                    <QuestVerificationCard
                      key={quest.id}
                      title={quest.title}
                      description={quest.description}
                      href={`/quests/${quest.id}`}
                      route={quest.verificationType.replace(/_/g, " ")}
                      autoApprove={quest.autoApprove}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Campaign", value: campaign?.title || "-" },
                        { label: "Quest type", value: quest.questType.replace(/_/g, " ") },
                        { label: "XP", value: quest.xp },
                      ]}
                    />
                  );
                })}

                {verificationHeavyQuests.length === 0 ? (
                  <div className="rounded-[24px] border border-white/6 bg-white/[0.025] px-5 py-6 text-sm text-sub">
                    No verification-heavy quests match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}
      </PortalPageFrame>
    </AdminShell>
  );
}

function questStatusTone(status: string): "default" | "success" | "warning" {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "default";
}

function QuestVerificationCard({
  title,
  description,
  href,
  route,
  autoApprove,
  stats,
}: {
  title: string;
  description: string;
  href: string;
  route: string;
  autoApprove: boolean;
  stats: Array<{ label: string; value: string | number }>;
}) {
  return (
    <div className="rounded-[24px] border border-white/6 bg-white/[0.025] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-extrabold text-text">{title}</p>
            <OpsStatusPill tone="default">{route}</OpsStatusPill>
            {autoApprove ? <OpsStatusPill tone="success">auto approve</OpsStatusPill> : null}
          </div>
          <p className="mt-3 text-sm leading-6 text-sub">{description}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[20px] border border-white/6 bg-white/[0.02] px-4 py-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-text">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={href}
          className="rounded-full border border-white/6 bg-white/[0.025] px-4 py-3 text-sm font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          Open
        </Link>
      </div>
    </div>
  );
}
