"use client";

import { PauseCircle, RotateCcw, ShieldCheck, VolumeX } from "lucide-react";
import type {
  ProjectOperationOverrideRecord,
  ProjectOperationOverrideStatus,
  ProjectOperationOverrideType,
} from "@/lib/platform/core-ops";
import { InlineEmptyNotice } from "@/components/layout/state/StatePrimitives";
import { OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";

type QuickOverrideAction = {
  label: string;
  description: string;
  overrideType: ProjectOperationOverrideType;
  objectType: ProjectOperationOverrideRecord["object_type"];
  objectId: string;
  reason: string;
};

function toneForOverride(type: ProjectOperationOverrideType) {
  if (type === "pause") return "warning" as const;
  if (type === "manual_retry" || type === "manual_complete") return "success" as const;
  return "default" as const;
}

function labelForOverride(type: ProjectOperationOverrideType) {
  return type.replace(/_/g, " ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function OpsOverridePanel({
  overrides,
  quickActions = [],
  emptyTitle = "No active overrides",
  emptyDescription = "No pause, retry or mute overrides are currently active here.",
  creatingOverride = false,
  workingOverrideId,
  onCreateOverride,
  onResolveOverride,
}: {
  overrides: ProjectOperationOverrideRecord[];
  quickActions?: QuickOverrideAction[];
  emptyTitle?: string;
  emptyDescription?: string;
  creatingOverride?: boolean;
  workingOverrideId?: string | null;
  onCreateOverride?: (action: QuickOverrideAction) => void | Promise<void>;
  onResolveOverride?: (
    overrideId: string,
    status?: Extract<ProjectOperationOverrideStatus, "resolved" | "canceled">
  ) => void | Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {quickActions.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {quickActions.map((action) => (
            <button
              key={`${action.objectType}:${action.objectId}:${action.overrideType}`}
              type="button"
              disabled={creatingOverride}
              onClick={() => (onCreateOverride ? void onCreateOverride(action) : undefined)}
              className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,23,35,0.98),rgba(10,14,22,0.96))] p-4 text-left transition hover:border-primary/25 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[16px] border border-white/10 bg-black/20 text-primary">
                  {action.overrideType === "pause" ? (
                    <PauseCircle size={16} />
                  ) : action.overrideType === "manual_retry" ? (
                    <RotateCcw size={16} />
                  ) : action.overrideType === "mute" ? (
                    <VolumeX size={16} />
                  ) : (
                    <ShieldCheck size={16} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-text">{action.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-sub">
                    {labelForOverride(action.overrideType)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-sub">{action.description}</p>
            </button>
          ))}
        </div>
      ) : null}

      {overrides.length === 0 ? (
        <InlineEmptyNotice title={emptyTitle} description={emptyDescription} />
      ) : (
        overrides.map((override) => {
          const busy = workingOverrideId === override.id;

          return (
            <div
              key={override.id}
              className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,31,0.98),rgba(10,14,22,0.98))] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <OpsStatusPill tone={toneForOverride(override.override_type)}>
                      {labelForOverride(override.override_type)}
                    </OpsStatusPill>
                    <OpsStatusPill>{override.object_type}</OpsStatusPill>
                    <OpsStatusPill>{override.status}</OpsStatusPill>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-sub">
                    {override.reason || "No operator reason was added for this override."}
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <SignalRow label="Object ID" value={override.object_id} />
                    <SignalRow label="Created" value={formatDate(override.created_at)} />
                    <SignalRow label="Updated" value={formatDate(override.updated_at)} />
                  </div>
                </div>

                {onResolveOverride ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onResolveOverride(override.id, "resolved")}
                      className="rounded-[18px] border border-primary/30 bg-primary/12 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary transition hover:bg-primary/18 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? "Updating..." : "Resolve"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onResolveOverride(override.id, "canceled")}
                      className="rounded-[18px] border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-sub transition hover:border-white/16 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? "Updating..." : "Cancel"}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{label}</p>
      <p className="mt-2 break-all text-sm font-semibold text-text">{value}</p>
    </div>
  );
}
