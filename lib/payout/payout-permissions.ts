import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbProjectPayoutPermission } from "@/types/database";
import {
  getDefaultProjectPayoutPermissions,
  normalizePayoutActionPermissions,
  normalizePayoutVisibilityPermissions,
  type PayoutActionPermission,
  type PayoutVisibilityPermission,
} from "./payout-config";

export type ProjectPayoutPermissionAssignment = {
  id: string;
  subjectAuthUserId: string;
  visibilityPermissions: PayoutVisibilityPermission[];
  actionPermissions: PayoutActionPermission[];
  presetKey: string | null;
  status: "active" | "revoked";
  notes: string | null;
  grantedByAuthUserId: string | null;
  updatedByAuthUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectPayoutPermissionSaveInput = {
  subjectAuthUserId: string;
  visibilityPermissions: PayoutVisibilityPermission[];
  actionPermissions: PayoutActionPermission[];
  presetKey?: string | null;
  status?: "active" | "revoked";
  notes?: string | null;
};

function shapeAssignment(row: DbProjectPayoutPermission): ProjectPayoutPermissionAssignment {
  return {
    id: row.id,
    subjectAuthUserId: row.subject_auth_user_id,
    visibilityPermissions: normalizePayoutVisibilityPermissions(row.visibility_permissions),
    actionPermissions: normalizePayoutActionPermissions(row.action_permissions),
    presetKey: row.preset_key,
    status: row.status === "revoked" ? "revoked" : "active",
    notes: row.notes,
    grantedByAuthUserId: row.granted_by_auth_user_id,
    updatedByAuthUserId: row.updated_by_auth_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectPayoutPermissionAssignments(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_payout_permissions")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load project payout permissions.");
  }

  return ((data ?? []) as DbProjectPayoutPermission[]).map(shapeAssignment);
}

export async function saveProjectPayoutPermissionAssignments(input: {
  projectId: string;
  grantedByAuthUserId: string;
  assignments: ProjectPayoutPermissionSaveInput[];
}) {
  const supabase = getServiceSupabaseClient();
  const timestamp = new Date().toISOString();
  const normalizedAssignments = input.assignments
    .filter((assignment) => assignment.subjectAuthUserId.trim())
    .map((assignment) => {
      const normalizedVisibility = normalizePayoutVisibilityPermissions(
        assignment.visibilityPermissions
      );
      const normalizedActions = normalizePayoutActionPermissions(assignment.actionPermissions);
      const defaults = getDefaultProjectPayoutPermissions();
      const shouldRevoke =
        assignment.status === "revoked" ||
        (normalizedVisibility.length === defaults.visibilityPermissions.length &&
          normalizedVisibility.every((permission) =>
            defaults.visibilityPermissions.includes(permission)
          ) &&
          normalizedActions.length === 0);

      return {
        project_id: input.projectId,
        subject_auth_user_id: assignment.subjectAuthUserId,
        visibility_permissions: shouldRevoke ? [] : normalizedVisibility,
        action_permissions: shouldRevoke ? [] : normalizedActions,
        preset_key: shouldRevoke ? null : assignment.presetKey ?? null,
        status: shouldRevoke ? "revoked" : "active",
        notes: assignment.notes?.trim() || null,
        granted_by_auth_user_id: input.grantedByAuthUserId,
        updated_by_auth_user_id: input.grantedByAuthUserId,
        updated_at: timestamp,
      };
    });

  if (normalizedAssignments.length > 0) {
    const { error } = await supabase.from("project_payout_permissions").upsert(normalizedAssignments, {
      onConflict: "project_id,subject_auth_user_id",
    });

    if (error) {
      throw new Error(error.message || "Failed to save project payout permissions.");
    }
  }

  return listProjectPayoutPermissionAssignments(input.projectId);
}
