"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { LeadDetailPanel } from "@/components/growth/LeadDetailPanel";
import { LeadNotesPanel } from "@/components/growth/LeadNotesPanel";
import { LeadTasksPanel } from "@/components/growth/LeadTasksPanel";
import { LoadingState, StatePanel } from "@/components/layout/state/StatePrimitives";
import { OpsMetricCard } from "@/components/layout/ops/OpsPrimitives";
import type { AdminGrowthLeadDetail } from "@/types/entities/growth-sales";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function GrowthLeadDetailPage() {
  const params = useParams<{ id: string }>();
  const role = useAdminAuthStore((s) => s.role);
  const [detail, setDetail] = useState<AdminGrowthLeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingLead, setSavingLead] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!params?.id || role !== "super_admin") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/growth/leads/${params.id}`, { cache: "no-store" });
        const payload = (await response.json().catch(() => null)) as
          | { ok?: boolean; detail?: AdminGrowthLeadDetail; error?: string }
          | null;

        if (!response.ok || !payload?.ok || !payload.detail) {
          throw new Error(payload?.error ?? "Failed to load lead detail.");
        }

        if (!cancelled) {
          setDetail(payload.detail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDetail(null);
          setError(loadError instanceof Error ? loadError.message : "Failed to load lead detail.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [params?.id, refreshNonce, role]);

  async function saveLead(input: {
    leadState: string;
    qualificationSummary: string;
    intentSummary: string;
  }) {
    if (!params?.id) {
      return;
    }

    setSavingLead(true);
    try {
      const response = await fetch(`/api/growth/leads/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to save lead posture.");
      }

      setRefreshNonce((value) => value + 1);
    } finally {
      setSavingLead(false);
    }
  }

  async function createNote(input: { noteType: string; title: string; body: string }) {
    if (!params?.id) {
      return;
    }

    setSavingNote(true);
    try {
      const response = await fetch(`/api/growth/leads/${params.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to add note.");
      }

      setRefreshNonce((value) => value + 1);
    } finally {
      setSavingNote(false);
    }
  }

  async function createTask(input: {
    taskType: string;
    title: string;
    summary: string;
    dueAt?: string | null;
  }) {
    if (!params?.id) {
      return;
    }

    setSavingTask(true);
    try {
      const response = await fetch(`/api/growth/leads/${params.id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to add task.");
      }

      setRefreshNonce((value) => value + 1);
    } finally {
      setSavingTask(false);
    }
  }

  async function resolveTask(taskId: string) {
    if (!params?.id) {
      return;
    }

    const response = await fetch(`/api/growth/leads/${params.id}/tasks`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ taskId }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error ?? "Failed to resolve task.");
    }

    setRefreshNonce((value) => value + 1);
  }

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Lead detail is internal-only"
          description="Only Veltrix super admins can inspect the commercial lead timeline at this depth."
          tone="warning"
          actions={
            <Link
              href="/growth"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Back to growth
            </Link>
          }
        />
      </AdminShell>
    );
  }

  if (loading) {
    return (
      <AdminShell>
        <LoadingState
          title="Loading lead detail"
          description="Veltrix is resolving the commercial lead timeline, notes and follow-up."
        />
      </AdminShell>
    );
  }

  if (error || !detail) {
    return (
      <AdminShell>
        <StatePanel
          title="Lead detail could not load"
          description={error ?? "This lead did not return a valid detail payload."}
          tone="warning"
          actions={
            <button
              type="button"
              onClick={() => setRefreshNonce((value) => value + 1)}
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Retry
            </button>
          }
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <PortalPageFrame
        eyebrow="Commercial lead"
        title={detail.companyName || detail.contactName || detail.contactEmail}
        description="Run the conversation, qualification and next commercial move without leaving the lead timeline."
        actions={
          <Link
            href="/growth"
            className="inline-flex items-center rounded-full border border-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-text transition hover:border-primary/35 hover:text-primary"
          >
            Back to growth
          </Link>
        }
        statusBand={
          <div className="grid gap-4 md:grid-cols-4">
            <OpsMetricCard label="State" value={detail.leadState} emphasis="primary" />
            <OpsMetricCard label="Source" value={detail.source} />
            <OpsMetricCard label="Open tasks" value={detail.taskCounts.open} emphasis={detail.taskCounts.open > 0 ? "warning" : "default"} />
            <OpsMetricCard label="Overdue" value={detail.taskCounts.overdue} emphasis={detail.taskCounts.overdue > 0 ? "warning" : "default"} />
          </div>
        }
      >
        <LeadDetailPanel detail={detail} saving={savingLead} onSave={saveLead} />

        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <LeadNotesPanel notes={detail.notes} onCreate={createNote} saving={savingNote} />
          <LeadTasksPanel
            tasks={detail.tasks}
            onCreate={createTask}
            onResolve={resolveTask}
            saving={savingTask}
          />
        </div>
      </PortalPageFrame>
    </AdminShell>
  );
}
