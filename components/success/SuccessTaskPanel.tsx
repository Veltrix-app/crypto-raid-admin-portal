"use client";

import { useState } from "react";
import {
  OpsPanel,
  OpsStatusPill,
} from "@/components/layout/ops/OpsPrimitives";
import { humanizeSuccessValue } from "@/lib/success/success-contract";
import type { AdminSuccessTask } from "@/types/entities/success";

export function SuccessTaskPanel({
  accountId,
  tasks,
  onTaskChanged,
}: {
  accountId: string;
  tasks: AdminSuccessTask[];
  onTaskChanged: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTask() {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/success/accounts/${accountId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          title,
          summary,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to create success task.");
      }

      setTitle("");
      setSummary("");
      await onTaskChanged();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create success task.");
    } finally {
      setSaving(false);
    }
  }

  async function resolveTask(taskId: string) {
    try {
      setSaving(true);
      setError(null);
      const response = await fetch(`/api/success/accounts/${accountId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "resolve",
          taskId,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to resolve success task.");
      }

      await onTaskChanged();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to resolve success task.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OpsPanel
      eyebrow="Follow-up tasks"
      title="Customer success actions"
      description="Keep the follow-up layer inside the product so activation work does not drift into memory."
    >
      <div className="grid gap-2.5">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          className="rounded-[18px] border border-line bg-card2 px-3.5 py-2.5 text-[13px] text-text outline-none transition focus:border-primary/40"
        />
        <textarea
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Task summary"
          rows={3}
          className="rounded-[18px] border border-line bg-card2 px-3.5 py-2.5 text-[13px] leading-5 text-text outline-none transition focus:border-primary/40"
        />
        <button
          type="button"
          onClick={() => void createTask()}
          disabled={saving || !title.trim() || !summary.trim()}
          className="inline-flex w-fit items-center rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add task"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-[22px] border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="mt-4 space-y-2.5">
        {tasks.length ? (
          tasks.map((task) => (
            <div key={task.id} className="rounded-[20px] border border-line bg-card2 px-3.5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] font-semibold text-text">{task.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <OpsStatusPill>{humanizeSuccessValue(task.status)}</OpsStatusPill>
                  <OpsStatusPill tone={task.dueState === "overdue" ? "warning" : "default"}>
                    {humanizeSuccessValue(task.dueState)}
                  </OpsStatusPill>
                </div>
              </div>
              <p className="mt-2.5 text-[13px] leading-5 text-sub">{task.summary}</p>
              {task.status !== "resolved" && task.status !== "canceled" ? (
                <button
                  type="button"
                  onClick={() => void resolveTask(task.id)}
                  className="mt-3 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary transition hover:border-primary/30 hover:bg-primary/15"
                >
                  Resolve
                </button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-[20px] border border-line bg-card2 px-3.5 py-3.5 text-[13px] text-sub">
            No follow-up tasks yet.
          </div>
        )}
      </div>
    </OpsPanel>
  );
}
