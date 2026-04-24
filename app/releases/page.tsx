"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/shell/AdminShell";
import PortalPageFrame from "@/components/layout/shell/PortalPageFrame";
import { LoadingState, StatePanel } from "@/components/layout/state/StatePrimitives";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import { ReleaseOverviewPanel } from "@/components/releases/ReleaseOverviewPanel";
import {
  createDraftPortalRelease,
  fetchReleaseOverview,
} from "@/lib/release/release-dashboard";
import type { AdminReleaseOverview } from "@/types/entities/release";
import { useAdminAuthStore } from "@/store/auth/useAdminAuthStore";

export default function ReleasesPage() {
  const router = useRouter();
  const role = useAdminAuthStore((state) => state.role);
  const [overview, setOverview] = useState<AdminReleaseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        setLoading(true);
        setError(null);
        const nextOverview = await fetchReleaseOverview();
        if (!cancelled) {
          setOverview(nextOverview);
        }
      } catch (loadError) {
        if (!cancelled) {
          setOverview(null);
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load release overview."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (role === "super_admin") {
      void loadOverview();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [refreshNonce, role]);

  async function handleCreateDraft() {
    try {
      setCreating(true);
      const detail = await createDraftPortalRelease({});
      router.push(`/releases/${detail.release.id}`);
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Failed to create draft release."
      );
    } finally {
      setCreating(false);
    }
  }

  if (role !== "super_admin") {
    return (
      <AdminShell>
        <StatePanel
          title="Release control is internal-only"
          description="Only Veltrix super admins can operate the release machine, gate posture and go/no-go state."
          tone="warning"
          actions={
            <Link
              href="/overview"
              className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-black text-black transition hover:brightness-105"
            >
              Back to overview
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
          title="Loading release machine"
          description="Veltrix is pulling release candidates, gate pressure, smoke posture and environment audits into one workspace."
        />
      </AdminShell>
    );
  }

  if (error || !overview) {
    return (
      <AdminShell>
        <StatePanel
          title="Release machine could not load"
          description={error ?? "The release workspace did not return a valid overview payload."}
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
        eyebrow="Release control"
        title="Releases"
        description="Run the whole-stack release machine from one internal workspace: scope, migrations, environments, smoke and go/no-go posture."
        actions={
          <div className="space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-sub">Veltrix internal</p>
            <div className="flex flex-wrap gap-2">
              <OpsStatusPill tone={overview.counts.blockingFailures > 0 ? "warning" : "success"}>
                {overview.counts.blockingFailures} blocking failures
              </OpsStatusPill>
              <OpsStatusPill tone={overview.counts.smokePending > 0 ? "warning" : "default"}>
                {overview.counts.smokePending} smoke pending
              </OpsStatusPill>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateDraft()}
              disabled={creating}
              className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-black transition hover:brightness-105 disabled:opacity-60"
            >
              {creating ? "Creating..." : "Draft release"}
            </button>
          </div>
        }
      >
        <ReleaseOverviewPanel overview={overview} />
      </PortalPageFrame>
    </AdminShell>
  );
}
