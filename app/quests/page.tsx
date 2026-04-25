"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SegmentToggle from "@/components/layout/ops/SegmentToggle";
import {
  OpsFilterBar,
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

  const boardLeadQuests = useMemo(
    () =>
      [...filteredQuests]
        .sort(
          (a, b) =>
            Number(b.autoApprove) - Number(a.autoApprove) ||
            b.xp - a.xp ||
            Number(b.status === "active") - Number(a.status === "active")
        )
        .slice(0, 6),
    [filteredQuests]
  );

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
        description="Treat quests like a premium mission system: one calm inventory lane for the live board and one verification lane for proof friction, moderation drag and auto-clear posture."
        actions={
          <Link
            href="/quests/new"
            className="rounded-full bg-primary px-5 py-3 text-sm font-black text-black shadow-[0_18px_40px_rgba(186,255,59,0.22)]"
          >
            New Quest
          </Link>
        }
        statusBand={
          <div className="space-y-5">
            <div className="grid gap-4 xl:items-start xl:grid-cols-[1.12fr_0.88fr]">
              <OpsPanel
                eyebrow="View posture"
                title={
                  questsView === "board"
                    ? "Read the quest inventory"
                    : "Read verification pressure"
                }
                description={
                  questsView === "board"
                    ? "Stay in board mode when the goal is to understand campaign coverage, XP weight and the shape of the contributor journey."
                    : "Switch to verification mode when the team needs to reason about proof routes, automation and what could create moderation load."
                }
                tone="accent"
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
                        ? "Start with title, campaign and XP weight, then open the quest that shapes the flow most."
                        : "Start with route and auto-approval posture before you judge raw submission volume."
                    }
                  />
                </div>
              </OpsPanel>

              <div className="space-y-2.5 rounded-[16px] border border-white/[0.04] bg-[linear-gradient(180deg,rgba(11,14,20,0.98),rgba(7,9,14,0.98))] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Signal rail
                </p>
                <QuestSignal label="Active" value={`${activeCount}`} />
                <QuestSignal
                  label="Drafts"
                  value={`${draftCount}`}
                  tone={draftCount > 0 ? "warning" : "default"}
                />
                <QuestSignal
                  label="Manual review"
                  value={`${manualCount}`}
                  tone={manualCount > 0 ? "warning" : "default"}
                />
                <QuestSignal label="Avg XP" value={`${avgXp}`} />
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

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[14px] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-[12px] leading-5 text-sub">
                {questsView === "board"
                  ? "Board mode keeps the mission system readable and puts the most structurally important quests at the top."
                  : "Verification mode pushes proof route, automation and moderation posture ahead of raw inventory."}
              </div>
              <div className="rounded-[14px] border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-[12px] leading-5 text-sub">
                {autoApproveCount} quests can auto-clear low-risk traffic / {pausedCount} paused
              </div>
            </div>
          </div>
        }
      >
        {questsView === "board" ? (
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr] xl:items-start">
            <OpsPanel
              eyebrow="Quest posture"
              title="What the mission system is carrying"
              description="Use this rail to understand proof intensity, paused work and how much of the board can already clear itself."
            >
              <div className="grid gap-3">
                <OpsSnapshotRow
                  label="Auto-approval"
                  value={`${autoApproveCount} quest${autoApproveCount === 1 ? "" : "s"} can clear lower-risk traffic automatically.`}
                />
                <OpsSnapshotRow
                  label="Paused"
                  value={`${pausedCount} quest${pausedCount === 1 ? "" : "s"} are waiting for manual intervention or a publish decision.`}
                />
                <OpsSnapshotRow
                  label="Verification drag"
                  value={`${manualCount} quest${manualCount === 1 ? "" : "s"} still depend on manual review as the primary route.`}
                />
                <OpsSnapshotRow
                  label="Campaign spread"
                  value={`${campaignCoverage} campaign${campaignCoverage === 1 ? "" : "s"} currently rely on quest mechanics.`}
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Lead quests"
              title="Open the quests shaping the journey"
              description="This rail replaces the dense roster with cards so you can read type, campaign and proof posture in one glance."
            >
              <div className="grid gap-4 2xl:grid-cols-2">
                {boardLeadQuests.map((quest) => {
                  const campaign = campaigns.find((item) => item.id === quest.campaignId);
                  const project = projects.find((item) => item.id === quest.projectId);

                  return (
                    <QuestSurfaceCard
                      key={quest.id}
                      title={quest.title}
                      description={quest.description}
                      href={`/quests/${quest.id}`}
                      badges={[
                        quest.status,
                        quest.autoApprove ? "auto approve" : null,
                        campaign?.title || null,
                      ]}
                      badgeTone={questStatusTone(quest.status)}
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Quest type", value: quest.questType.replace(/_/g, " ") },
                        { label: "XP", value: quest.xp },
                      ]}
                    />
                  );
                })}

                {boardLeadQuests.length === 0 ? (
                  <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-4 py-4 text-[12px] text-sub 2xl:col-span-2">
                    No quests match the current filters.
                  </div>
                ) : null}
              </div>
            </OpsPanel>
          </div>
        ) : null}

        {questsView === "verification" ? (
          <div className="grid gap-4 xl:grid-cols-[0.76fr_1.24fr] xl:items-start">
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
                  value={`${autoApproveCount} quest${autoApproveCount === 1 ? "" : "s"} already have lower-friction verification posture.`}
                />
                <OpsSnapshotRow
                  label="What to open next"
                  value="Prioritize high-XP quests with auto-clear or non-manual verification, because those change throughput fastest."
                />
              </div>
            </OpsPanel>

            <OpsPanel
              eyebrow="Verification rail"
              title="Open the quests that shape review posture"
              description="These quests create the most operational leverage because they directly change how proof flows are cleared."
            >
              <div className="grid gap-4 2xl:grid-cols-2">
                {verificationHeavyQuests.map((quest) => {
                  const campaign = campaigns.find((item) => item.id === quest.campaignId);
                  const project = projects.find((item) => item.id === quest.projectId);

                  return (
                    <QuestSurfaceCard
                      key={quest.id}
                      title={quest.title}
                      description={quest.description}
                      href={`/quests/${quest.id}`}
                      badges={[
                        quest.verificationType.replace(/_/g, " "),
                        quest.autoApprove ? "auto approve" : null,
                        campaign?.title || null,
                      ]}
                      badgeTone="default"
                      stats={[
                        { label: "Project", value: project?.name || "-" },
                        { label: "Quest type", value: quest.questType.replace(/_/g, " ") },
                        { label: "XP", value: quest.xp },
                      ]}
                      accent={quest.autoApprove}
                    />
                  );
                })}

                {verificationHeavyQuests.length === 0 ? (
                  <div className="rounded-[16px] border border-white/[0.04] bg-white/[0.02] px-4 py-4 text-[12px] text-sub 2xl:col-span-2">
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

function QuestSignal({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-[18px] border px-3.5 py-3 ${
        tone === "warning"
          ? "border-amber-400/16 bg-amber-500/[0.07]"
          : "border-white/[0.04] bg-white/[0.02]"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sub">{label}</p>
      <p className="mt-1.5 text-[13px] font-semibold text-text">{value}</p>
    </div>
  );
}

function QuestSurfaceCard({
  title,
  description,
  href,
  badges,
  stats,
  badgeTone,
  accent = false,
}: {
  title: string;
  description: string;
  href: string;
  badges: Array<string | null>;
  stats: Array<{ label: string; value: string | number }>;
  badgeTone: "default" | "success" | "warning";
  accent?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.14)] ${
        accent
          ? "border-primary/14 bg-[radial-gradient(circle_at_top_right,rgba(186,255,59,0.1),transparent_22%),linear-gradient(180deg,rgba(18,24,35,0.96),rgba(10,14,22,0.94))]"
          : "border-white/[0.04] bg-[linear-gradient(180deg,rgba(14,18,26,0.96),rgba(9,12,18,0.94))]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,255,255,0.03),transparent_32%)]" />
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.92rem] font-semibold tracking-[-0.02em] text-text">{title}</p>
            {badges.filter(Boolean).map((badge, index) => (
              <OpsStatusPill
                key={`${title}-${badge}`}
                tone={index === 0 ? badgeTone : "default"}
              >
                {badge}
              </OpsStatusPill>
            ))}
          </div>
          <p className="mt-2 line-clamp-2 max-w-3xl text-[13px] leading-6 text-sub">{description}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={`${title}-${stat.label}`}
                className="rounded-[12px] border border-white/[0.04] bg-white/[0.02] px-3 py-2"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">
                  {stat.label}
                </p>
                <p className="mt-1 text-[12px] font-semibold text-text">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={href}
          className="rounded-full border border-white/[0.05] bg-white/[0.025] px-3.5 py-2 text-[12px] font-semibold text-text transition hover:border-primary/24 hover:text-primary"
        >
          View
        </Link>
      </div>
    </div>
  );
}
