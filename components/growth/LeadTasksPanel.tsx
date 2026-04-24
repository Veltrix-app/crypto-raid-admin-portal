"use client";

import { useState } from "react";
import {
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import {
  commercialTaskTypeOptions,
  humanizeCommercialLabel,
} from "@/lib/growth/growth-contract";
import type { AdminCommercialFollowUpTask } from "@/types/entities/growth-sales";

export function LeadTasksPanel({
  tasks,
  onCreate,
  onResolve,
  saving,
}: {
  tasks: AdminCommercialFollowUpTask[];
  onCreate: (input: {
    taskType: string;
    title: string;
    summary: string;
    dueAt?: string | null;
  }) => Promise<void>;
  onResolve: (taskId: string) => Promise<void>;
  saving: boolean;
}) {
  const [taskType, setTaskType] = useState("follow_up");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [dueDate, setDueDate] = useState("");

  return (
    <OpsPanel
      eyebrow="Follow-up tasks"
      title="Commercial next moves"
      description="Use structured tasks instead of remembering who to reply to next."
    >
      <div className="rounded-[22px] border border-line bg-card2 p-4">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_180px]">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Task type
            <select
              value={taskType}
              onChange={(event) => setTaskType(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-primary/35"
            >
              {commercialTaskTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-primary/35"
              placeholder="Follow-up title"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-primary/35"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-sub">
          Summary
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-[22px] border border-line bg-card px-3 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary/35"
            placeholder="What should happen next?"
          />
        </label>
        <button
          type="button"
          onClick={() =>
            void onCreate({
              taskType,
              title,
              summary,
              dueAt: dueDate ? `${dueDate}T09:00:00.000Z` : null,
            }).then(() => {
              setTaskType("follow_up");
              setTitle("");
              setSummary("");
              setDueDate("");
            })
          }
          disabled={saving}
          className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add task"}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {tasks.length ? (
          tasks.map((task) => (
            <div key={task.id} className="rounded-[22px] border border-line bg-card2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-text">{task.title}</p>
                    <OpsStatusPill tone={task.dueState === "overdue" ? "danger" : task.dueState === "due_now" ? "warning" : "default"}>
                      {humanizeCommercialLabel(task.dueState)}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-sub">{task.summary}</p>
                </div>
                {task.status !== "resolved" && task.status !== "canceled" ? (
                  <button
                    type="button"
                    onClick={() => void onResolve(task.id)}
                    className="inline-flex rounded-full border border-line px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-primary"
                  >
                    Resolve
                  </button>
                ) : (
                  <OpsStatusPill tone="success">resolved</OpsStatusPill>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-line bg-card2 px-4 py-4 text-sm text-sub">
            No tasks yet.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}
