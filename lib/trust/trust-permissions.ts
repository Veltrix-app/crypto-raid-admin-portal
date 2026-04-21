import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type { DbProjectTrustPermission } from "@/types/database";
import {
  getDefaultProjectTrustPermissions,
  normalizeTrustActionPermissions,
  normalizeTrustVisibilityPermissions,
  type TrustActionPermission,
  type TrustVisibilityPermission,
} from "./trust-config";

export type ProjectTrustPermissionAssignment = {
  id: string;
  subjectAuthUserId: string;
  visibilityPermissions: TrustVisibilityPermission[];
  actionPermissions: TrustActionPermission[];
  presetKey: string | null;
  status: "active" | "revoked";
  notes: string | null;
  grantedByAuthUserId: string | null;
  updatedByAuthUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTrustPermissionSaveInput = {
  subjectAuthUserId: string;
  visibilityPermissions: TrustVisibilityPermission[];
  actionPermissions: TrustActionPermission[];
  presetKey?: string | null;
  status?: "active" | "revoked";
  notes?: string | null;
};

function shapeAssignment(row: DbProjectTrustPermission): ProjectTrustPermissionAssignment {
  return {
    id: row.id,
    subjectAuthUserId: row.subject_auth_user_id,
    visibilityPermissions: normalizeTrustVisibilityPermissions(row.visibility_permissions),
    actionPermissions: normalizeTrustActionPermissions(row.action_permissions),
    presetKey: row.preset_key,
    status: row.status === "revoked" ? "revoked" : "active",
    notes: row.notes,
    grantedByAuthUserId: row.granted_by_auth_user_id,
    updatedByAuthUserId: row.updated_by_auth_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listProjectTrustPermissionAssignments(projectId: string) {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from("project_trust_permissions")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load project trust permissions.");
  }

  return ((data ?? []) as DbProjectTrustPermission[]).map(shapeAssignment);
}

export async function saveProjectTrustPermissionAssignments(input: {
  projectId: string;
  grantedByAuthUserId: string;
  assignments: ProjectTrustPermissionSaveInput[];
}) {
  const supabase = getServiceSupabaseClient();
  const timestamp = new Date().toISOString();
  const normalizedAssignments = input.assignments
    .filter((assignment) => assignment.subjectAuthUserId.trim())
    .map((assignment) => {
      const normalizedVisibility = normalizeTrustVisibilityPermissions(
        assignment.visibilityPermissions
      );
      const normalizedActions = normalizeTrustActionPermissions(assignment.actionPermissions);
      const defaults = getDefaultProjectTrustPermissions();
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
    const { error } = await supabase.from("project_trust_permissions").upsert(normalizedAssignments, {
      onConflict: "project_id,subject_auth_user_id",
    });

    if (error) {
      throw new Error(error.message || "Failed to save project trust permissions.");
    }
  }

  return listProjectTrustPermissionAssignments(input.projectId);
}
