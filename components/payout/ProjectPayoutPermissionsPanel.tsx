"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminTeamMember } from "@/types/entities/team-member";
import { OpsPanel, OpsStatusPill } from "@/components/layout/ops/OpsPrimitives";
import {
  PAYOUT_ACTION_LABELS,
  PAYOUT_PERMISSION_PRESETS,
  PAYOUT_VISIBILITY_LABELS,
} from "@/lib/payout/payout-config";
import type { ProjectPayoutPermissionAssignmentRecord } from "./types";

type PermissionPresetKey = "view_only" | "summary_viewer" | "claim_reviewer" | "project_payout_lead";

type EditableAssignment = {
  subjectAuthUserId: string;
  presetKey: PermissionPresetKey;
  visibilityPermissions: string[];
  actionPermissions: string[];
  status: "active" | "revoked";
};

const PRESET_OPTIONS = [
  { key: "view_only", label: "View only", description: "Summary-only default with no extra actions." },
  ...PAYOUT_PERMISSION_PRESETS.map((preset) => ({
    key: preset.key,
    label: preset.label,
    description: preset.description,
  })),
] as const;

function getAssignmentFromPreset(subjectAuthUserId: string, presetKey: PermissionPresetKey): EditableAssignment {
  const preset = PAYOUT_PERMISSION_PRESETS.find((item) => item.key === presetKey);
  if (!preset) {
    return {
      subjectAuthUserId,
      presetKey,
      visibilityPermissions: [],
      actionPermissions: [],
      status: "revoked",
    };
  }

  return {
    subjectAuthUserId,
    presetKey,
    visibilityPermissions: [...preset.visibilityPermissions],
    actionPermissions: [...preset.actionPermissions],
    status: "active",
  };
}

export default function ProjectPayoutPermissionsPanel({
  projectId,
  teamMembers,
  canManage,
}: {
  projectId: string;
  teamMembers: AdminTeamMember[];
  canManage: boolean;
}) {
  const [assignments, setAssignments] = useState<Record<string, EditableAssignment>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const eligibleMembers = useMemo(
    () =>
      teamMembers.filter(
        (member) =>
          member.projectId === projectId &&
          member.status === "active" &&
          member.authUserId &&
          member.role !== "owner"
      ),
    [projectId, teamMembers]
  );

  useEffect(() => {
    let active = true;

    async function loadAssignments() {
      if (!canManage) {
        setAssignments({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotice("");

      try {
        const response = await fetch(`/api/projects/${projectId}/payout-permissions`, {
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "Failed to load payout permissions.");
        }

        if (!active) {
          return;
        }

        const nextAssignments: Record<string, EditableAssignment> = {};
        for (const assignment of (payload.assignments ?? []) as ProjectPayoutPermissionAssignmentRecord[]) {
          const presetKey = (
            assignment.status === "revoked" ? "view_only" : assignment.presetKey ?? "claim_reviewer"
          ) as PermissionPresetKey;
          nextAssignments[assignment.subjectAuthUserId] = {
            subjectAuthUserId: assignment.subjectAuthUserId,
            presetKey,
            visibilityPermissions: assignment.visibilityPermissions,
            actionPermissions: assignment.actionPermissions,
            status: assignment.status,
          };
        }

        setAssignments(nextAssignments);
      } catch (error) {
        if (active) {
          setNotice(error instanceof Error ? error.message : "Failed to load payout permissions.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAssignments();

    return () => {
      active = false;
    };
  }, [canManage, projectId]);

  function updatePreset(subjectAuthUserId: string, presetKey: PermissionPresetKey) {
    setAssignments((current) => ({
      ...current,
      [subjectAuthUserId]: getAssignmentFromPreset(subjectAuthUserId, presetKey),
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setNotice("");
      const assignmentsPayload = eligibleMembers.map((member) => {
        const assignment =
          (member.authUserId ? assignments[member.authUserId] : null) ??
          getAssignmentFromPreset(member.authUserId!, "view_only");

        return {
          subjectAuthUserId: assignment.subjectAuthUserId,
          visibilityPermissions: assignment.visibilityPermissions,
          actionPermissions: assignment.actionPermissions,
          presetKey: assignment.presetKey === "view_only" ? null : assignment.presetKey,
          status: assignment.status,
        };
      });

      const response = await fetch(`/api/projects/${projectId}/payout-permissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignments: assignmentsPayload }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error ?? "Failed to save payout permissions.");
      }

      const nextAssignments: Record<string, EditableAssignment> = {};
      for (const assignment of (payload.assignments ?? []) as ProjectPayoutPermissionAssignmentRecord[]) {
        const presetKey = (
          assignment.status === "revoked" ? "view_only" : assignment.presetKey ?? "claim_reviewer"
        ) as PermissionPresetKey;
        nextAssignments[assignment.subjectAuthUserId] = {
          subjectAuthUserId: assignment.subjectAuthUserId,
          presetKey,
          visibilityPermissions: assignment.visibilityPermissions,
          actionPermissions: assignment.actionPermissions,
          status: assignment.status,
        };
      }
      setAssignments(nextAssignments);
      setNotice(payload.message ?? "Payout permissions saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to save payout permissions.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <OpsPanel
      eyebrow="Owner grants"
      title="Project payout permissions"
      description="Owners decide exactly who can inspect payout cases and who can run project-side payout actions. Everyone else stays summary-only by default."
      action={
        canManage ? (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save grants"}
          </button>
        ) : null
      }
    >
      {!canManage ? (
        <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-5 py-6 text-sm text-sub">
          Only project owners can change payout visibility and action grants.
        </div>
      ) : (
        <div className="grid gap-4">
          {notice ? (
            <div className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4 text-sm text-sub">
              {notice}
            </div>
          ) : null}

          {eligibleMembers.length === 0 ? (
            <div className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-5 py-6 text-sm text-sub">
              No active teammates with linked accounts are available for payout grants yet.
            </div>
          ) : null}

          {eligibleMembers.map((member) => {
            const assignment =
              (member.authUserId ? assignments[member.authUserId] : null) ??
              getAssignmentFromPreset(member.authUserId!, "view_only");

            return (
              <div
                key={member.id}
                className="rounded-[18px] border border-white/[0.028] bg-white/[0.014] px-5 py-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-bold text-text">{member.name}</p>
                      <OpsStatusPill>{member.role}</OpsStatusPill>
                    </div>
                    <p className="mt-2 text-sm text-sub">{member.email}</p>
                  </div>

                  <select
                    value={assignment.presetKey}
                    onChange={(event) =>
                      updatePreset(member.authUserId!, event.target.value as PermissionPresetKey)
                    }
                    className="rounded-[18px] border border-white/[0.026] bg-white/[0.012] px-4 py-3 text-sm text-text focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {PRESET_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  <PermissionList
                    title="Visibility"
                    items={assignment.visibilityPermissions.map(
                      (permission) => PAYOUT_VISIBILITY_LABELS[permission as keyof typeof PAYOUT_VISIBILITY_LABELS] ?? permission
                    )}
                    fallback="Summary-only default"
                  />
                  <PermissionList
                    title="Actions"
                    items={assignment.actionPermissions.map(
                      (permission) => PAYOUT_ACTION_LABELS[permission as keyof typeof PAYOUT_ACTION_LABELS] ?? permission
                    )}
                    fallback="No actions granted"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {loading ? <div className="mt-4 text-sm text-sub">Loading payout grants...</div> : null}
    </OpsPanel>
  );
}

function PermissionList({
  title,
  items,
  fallback,
}: {
  title: string;
  items: string[];
  fallback: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/[0.026] bg-white/[0.012] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sub">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/[0.026] px-3 py-1 text-xs font-semibold text-text"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-sub">{fallback}</span>
        )}
      </div>
    </div>
  );
}
