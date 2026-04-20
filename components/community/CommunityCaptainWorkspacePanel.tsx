"use client";

import type {
  CommunityCaptainActionRecord,
  CommunityCaptainPermission,
  CommunityCaptainQueueItem,
} from "@/components/community/community-config";
import {
  COMMUNITY_CAPTAIN_DUE_STATE_LABELS,
  COMMUNITY_CAPTAIN_RESOLUTION_LABELS,
} from "@/components/community/community-config";
import { OpsMetricCard, OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type Viewer = {
  authUserId: string;
  role: "owner" | "captain" | "observer";
  isOwner: boolean;
  isCaptain: boolean;
  activeAssignmentCount: number;
  permissions: CommunityCaptainPermission[];
};

type Summary = {
  activeAssignments: number;
  queueItemCount: number;
  blockedCount: number;
  dueSoonCount: number;
  escalatedCount: number;
  overdueCount: number;
  highPriorityCount: number;
  unassignedCount: number;
};

type Props = {
  mode: "owner" | "captain";
  viewer: Viewer;
  summary: Summary;
  queue: CommunityCaptainQueueItem[];
  priorities: CommunityCaptainQueueItem[];
  blockedItems: CommunityCaptainQueueItem[];
  recentResults: CommunityCaptainActionRecord[];
  runningActionId: string | null;
  notice: string;
  noticeTone: "success" | "error";
  onRunAction: (actionId: string) => void;
};

function formatTimestamp(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "No due time";
}

function getQueueTone(item: CommunityCaptainQueueItem) {
  if (
    item.status === "blocked" ||
    item.status === "escalated" ||
    item.dueState === "overdue"
  ) {
    return "warning" as const;
  }

  if (item.status === "in_progress" || item.resolutionState === "resolved") {
    return "success" as const;
  }

  return "default" as const;
}

export function CommunityCaptainWorkspacePanel({
  mode,
  viewer,
  summary,
  queue,
  priorities,
  blockedItems,
  recentResults,
  runningActionId,
  notice,
  noticeTone,
  onRunAction,
}: Props) {
  const canRunActions = viewer.isOwner || viewer.isCaptain;

  return (
    <OpsPanel
      eyebrow={mode === "captain" ? "Captain mode" : "Captain workspace"}
      title={
        mode === "captain"
          ? "Today's captain execution rail"
          : "Captain queue, due states and accountability"
      }
      description={
        mode === "captain"
          ? "This workspace stays scoped to the current project and keeps captains on their most urgent work without turning the portal into a member CRM."
          : "Owners can see why work is in the captain queue, what is overdue, and how execution is resolving over time."
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <OpsStatusPill tone={viewer.isOwner ? "success" : "default"}>
            Viewer role {viewer.role}
          </OpsStatusPill>
          <OpsStatusPill tone={viewer.isCaptain ? "success" : "default"}>
            {viewer.activeAssignmentCount} active assignment
            {viewer.activeAssignmentCount === 1 ? "" : "s"}
          </OpsStatusPill>
          <OpsStatusPill tone={canRunActions ? "success" : "warning"}>
            {canRunActions ? "Run now enabled" : "Observer only"}
          </OpsStatusPill>
          <OpsStatusPill tone={viewer.permissions.length > 0 ? "success" : "default"}>
            {viewer.permissions.length} bounded permission
            {viewer.permissions.length === 1 ? "" : "s"}
          </OpsStatusPill>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <OpsMetricCard
            label="Queue items"
            value={summary.queueItemCount}
            sub="Project-scoped actionable queue volume."
            emphasis={summary.queueItemCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="High priority"
            value={summary.highPriorityCount}
            sub="Actions currently marked high or urgent."
            emphasis={summary.highPriorityCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Due soon"
            value={summary.dueSoonCount}
            sub="Work that should be handled before it tips into overdue."
            emphasis={summary.dueSoonCount > 0 ? "primary" : "default"}
          />
          <OpsMetricCard
            label="Overdue"
            value={summary.overdueCount}
            sub="Captain work that has already slipped past its due window."
            emphasis={summary.overdueCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Blocked"
            value={summary.blockedCount}
            sub="Queue items that need an unblock or owner decision."
            emphasis={summary.blockedCount > 0 ? "warning" : "default"}
          />
          <OpsMetricCard
            label="Unassigned seats"
            value={summary.unassignedCount}
            sub="Captain work with no active owner seat attached yet."
            emphasis={summary.unassignedCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-3">
            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Today's priorities</p>
              <p className="mt-2 text-sm text-sub">
                These are the highest-value actions this viewer can take inside the current project scope.
              </p>
              <div className="mt-4 space-y-3">
                {priorities.length > 0 ? (
                  priorities.map((item) => (
                    <div key={item.id} className="rounded-[20px] border border-line bg-card px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-xl">
                          <p className="font-bold text-text">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">{item.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <OpsStatusPill
                            tone={
                              item.priority === "urgent" || item.priority === "high"
                                ? "warning"
                                : "default"
                            }
                          >
                            {item.priority}
                          </OpsStatusPill>
                          <OpsStatusPill tone={getQueueTone(item)}>{item.status}</OpsStatusPill>
                          {item.dueState ? (
                            <OpsStatusPill tone={item.dueState === "overdue" ? "warning" : "default"}>
                              {COMMUNITY_CAPTAIN_DUE_STATE_LABELS[item.dueState]}
                            </OpsStatusPill>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-sub">
                        <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                          source {item.source}
                        </span>
                        {item.seatKey ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            seat {item.seatKey}
                          </span>
                        ) : null}
                        {item.actionType ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            action {item.actionType.replaceAll("_", " ")}
                          </span>
                        ) : null}
                        {item.targetType ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            target {item.targetType.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1 text-sm text-sub">
                          <p>Due: {formatTimestamp(item.dueAt)}</p>
                          <p>
                            Resolution:{" "}
                            <span className="font-semibold text-text">
                              {item.resolutionState
                                ? COMMUNITY_CAPTAIN_RESOLUTION_LABELS[item.resolutionState]
                                : "Open"}
                            </span>
                          </p>
                          {item.lastActorAuthUserId ? (
                            <p>Last actor: {item.lastActorAuthUserId}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRunAction(item.id)}
                          disabled={!canRunActions || runningActionId === item.id}
                          className="rounded-[18px] border border-line bg-card2 px-4 py-3 text-sm font-bold text-text transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {runningActionId === item.id ? "Running..." : item.actionLabel}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                    No live captain priorities are available for this project scope yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Queue rail</p>
              <p className="mt-2 text-sm text-sub">
                A compact execution view of the current project queue, including due and resolution posture.
              </p>
              <div className="mt-4 space-y-3">
                {queue.length > 0 ? (
                  queue.map((item) => (
                    <div key={item.id} className="rounded-[20px] border border-line bg-card px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-xl">
                          <p className="font-bold text-text">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">{item.summary}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <OpsStatusPill tone={getQueueTone(item)}>{item.status}</OpsStatusPill>
                          {item.dueState ? (
                            <OpsStatusPill tone={item.dueState === "overdue" ? "warning" : "default"}>
                              {COMMUNITY_CAPTAIN_DUE_STATE_LABELS[item.dueState]}
                            </OpsStatusPill>
                          ) : null}
                          {item.resolutionState ? (
                            <OpsStatusPill tone={item.resolutionState === "resolved" ? "success" : "default"}>
                              {COMMUNITY_CAPTAIN_RESOLUTION_LABELS[item.resolutionState]}
                            </OpsStatusPill>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-sub">
                        <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                          {item.source}
                        </span>
                        {item.seatKey ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            seat {item.seatKey}
                          </span>
                        ) : null}
                        {item.blockedReason.code ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            {item.blockedReason.label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                    The current viewer has no queue items in scope yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Blocked and escalated</p>
              <p className="mt-2 text-sm text-sub">
                These items need an unblock or owner-level decision before the queue can move.
              </p>
              <div className="mt-4 space-y-3">
                {blockedItems.length > 0 ? (
                  blockedItems.map((item) => (
                    <div key={item.id} className="rounded-[20px] border border-line bg-card px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-xl">
                          <p className="font-bold text-text">{item.title}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">
                            {item.blockedReason.summary || item.summary}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <OpsStatusPill tone="warning">{item.blockedReason.label}</OpsStatusPill>
                          {item.dueState ? (
                            <OpsStatusPill tone={item.dueState === "overdue" ? "warning" : "default"}>
                              {COMMUNITY_CAPTAIN_DUE_STATE_LABELS[item.dueState]}
                            </OpsStatusPill>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-sub">
                        {item.seatKey ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            seat {item.seatKey}
                          </span>
                        ) : null}
                        {item.targetType ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            target {item.targetType.replaceAll("_", " ")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                    No blocked or escalated captain actions are active right now.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-line bg-card2 p-5">
              <p className="text-sm font-bold text-text">Recent results</p>
              <p className="mt-2 text-sm text-sub">
                The latest captain-triggered outcomes visible to this viewer, including attribution and resolution posture.
              </p>
              <div className="mt-4 space-y-3">
                {recentResults.length > 0 ? (
                  recentResults.map((result) => (
                    <div key={result.id} className="rounded-[20px] border border-line bg-card px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-xl">
                          <p className="font-bold text-text">{result.actionType.replaceAll("_", " ")}</p>
                          <p className="mt-2 text-sm leading-6 text-sub">{result.summary}</p>
                        </div>
                        <OpsStatusPill
                          tone={
                            result.status === "success"
                              ? "success"
                              : result.status === "failed"
                                ? "warning"
                                : "default"
                          }
                        >
                          {result.status}
                        </OpsStatusPill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-sub">
                        <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                          {result.actorScope || "captain"}
                        </span>
                        <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                          {result.captainRole || "captain"}
                        </span>
                        {result.dueState ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            {COMMUNITY_CAPTAIN_DUE_STATE_LABELS[result.dueState]}
                          </span>
                        ) : null}
                        {result.resolutionState ? (
                          <span className="rounded-full border border-white/8 bg-card2 px-3 py-1">
                            {COMMUNITY_CAPTAIN_RESOLUTION_LABELS[result.resolutionState]}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-sub">
                        {new Date(result.createdAt).toLocaleString()}
                        {result.resolvedAt ? ` · resolved ${formatTimestamp(result.resolvedAt)}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-line bg-card px-4 py-5 text-sm text-sub">
                    No captain actions have been logged for this view yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {notice ? (
          <div
            className={`rounded-[20px] border px-4 py-3 text-sm ${
              noticeTone === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
            }`}
          >
            {notice}
          </div>
        ) : null}
      </div>
    </OpsPanel>
  );
}
