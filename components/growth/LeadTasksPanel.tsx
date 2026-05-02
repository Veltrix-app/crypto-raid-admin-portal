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
      <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] p-3.5">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_180px]">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Task type
            <select
              value={taskType}
              onChange={(event) => setTaskType(event.target.value)}
              className="mt-2 w-full rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-3 py-2 text-[13px] text-text outline-none transition focus:border-primary/35"
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
              className="mt-2 w-full rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-3 py-2 text-[13px] text-text outline-none transition focus:border-primary/35"
              placeholder="Follow-up title"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-sub">
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="mt-2 w-full rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-3 py-2 text-[13px] text-text outline-none transition focus:border-primary/35"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-bold uppercase tracking-[0.14em] text-sub">
          Summary
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-3 py-2.5 text-[13px] leading-5 text-text outline-none transition focus:border-primary/35"
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
          className="mt-3.5 inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add task"}
        </button>
      </div>

      <div className="mt-4 space-y-2.5">
        {tasks.length ? (
          tasks.map((task) => (
            <div key={task.id} className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-text">{task.title}</p>
                    <OpsStatusPill tone={task.dueState === "overdue" ? "danger" : task.dueState === "due_now" ? "warning" : "default"}>
                      {humanizeCommercialLabel(task.dueState)}
                    </OpsStatusPill>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-5 text-sub">{task.summary}</p>
                </div>
                {task.status !== "resolved" && task.status !== "canceled" ? (
                  <button
                    type="button"
                    onClick={() => void onResolve(task.id)}
                    className="inline-flex rounded-full border border-white/[0.026] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sub transition hover:border-primary/35 hover:text-primary"
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
          <div className="rounded-[20px] border border-white/[0.028] bg-white/[0.014] px-3.5 py-3.5 text-[13px] text-sub">
            No tasks yet.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}
