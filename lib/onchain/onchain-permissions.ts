import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbProjectOnchainPermission } from "@/types/database";
import {
  getDefaultProjectOnchainPermissions,
  normalizeOnchainActionPermissions,
  normalizeOnchainVisibilityPermissions,
  type OnchainActionPermission,
  type OnchainVisibilityPermission,
} from "./onchain-config";

export type ProjectOnchainPermissionAssignment = {
  id: string;
  subjectAuthUserId: string;
  visibilityPermissions: OnchainVisibilityPermission[];
  actionPermissions: OnchainActionPermission[];
  presetKey: string | null;
  status: "active" | "revoked";
  notes: string | null;
  grantedByAuthUserId: string | null;
  updatedByAuthUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectOnchainPermissionSaveInput = {
  subjectAuthUserId: string;
  visibilityPermissions: OnchainVisibilityPermission[];
  actionPermissions: OnchainActionPermission[];
  presetKey?: string | null;
  status?: "active" | "revoked";
  notes?: string | null;
};

function shapeAssignment(row: DbProjectOnchainPermission): ProjectOnchainPermissionAssignment {
  return {
    id: row.id,
    subjectAuthUserId: row.subject_auth_user_id,
    visibilityPermissions: normalizeOnchainVisibilityPermissions(row.visibility_permissions),
    actionPermissions: normalizeOnchainActionPermissions(row.action_permissions),
    presetKey: row.preset_key,
    status: row.status === "revoked" ? "revoked" : "active",
    notes: row.notes,
    grantedByAuthUserId: row.granted_by_auth_user_id,
    updatedByAuthUserId: row.updated_by_auth_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectOnchainPermissionAssignments(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_onchain_permissions")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load project on-chain permissions.");
  }

  return ((data ?? []) as DbProjectOnchainPermission[]).map(shapeAssignment);
}

export async function saveProjectOnchainPermissionAssignments(input: {
  projectId: string;
  grantedByAuthUserId: string;
  assignments: ProjectOnchainPermissionSaveInput[];
}) {
  const supabase = getServiceSupabaseClient();
  const timestamp = new Date().toISOString();
  const normalizedAssignments = input.assignments
    .filter((assignment) => assignment.subjectAuthUserId.trim())
    .map((assignment) => {
      const normalizedVisibility = normalizeOnchainVisibilityPermissions(
        assignment.visibilityPermissions
      );
      const normalizedActions = normalizeOnchainActionPermissions(assignment.actionPermissions);
      const defaults = getDefaultProjectOnchainPermissions();
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
    const { error } = await supabase
      .from("project_onchain_permissions")
      .upsert(normalizedAssignments, {
        onConflict: "project_id,subject_auth_user_id",
      });

    if (error) {
      throw new Error(error.message || "Failed to save project on-chain permissions.");
    }
  }

  return listProjectOnchainPermissionAssignments(input.projectId);
}
