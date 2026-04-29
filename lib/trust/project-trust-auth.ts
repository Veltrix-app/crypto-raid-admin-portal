import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  getDefaultProjectTrustPermissions,
  getFullProjectTrustPermissions,
  normalizeTrustActionPermissions,
  normalizeTrustVisibilityPermissions,
  type TrustActionPermission,
  type TrustVisibilityPermission,
} from "./trust-config";

export class TrustAccessError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ProjectTrustAccessResult = {
  authUserId: string;
  projectId: string;
  isSuperAdmin: boolean;
  membershipRole: "owner" | "admin" | "reviewer" | "analyst" | null;
  visibilityPermissions: TrustVisibilityPermission[];
  actionPermissions: TrustActionPermission[];
};

export async function assertInternalTrustAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new TrustAccessError(401, "You must be signed in to access trust operations.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const { data: adminUser, error } = await serviceSupabase
    .from("admin_users")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new TrustAccessError(500, error.message);
  }

  if (!adminUser || adminUser.status !== "active") {
    throw new TrustAccessError(403, "Internal trust operations are limited to VYNTRO operators.");
  }

  return {
    authUserId: user.id,
    adminRole: adminUser.role ?? "operator",
    isSuperAdmin: adminUser.role === "super_admin",
  };
}

export async function assertProjectTrustAccess(projectId: string): Promise<ProjectTrustAccessResult> {
  const normalizedProjectId = projectId.trim();
  if (!normalizedProjectId) {
    throw new TrustAccessError(400, "Missing project id.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new TrustAccessError(401, "You must be signed in to access this trust console.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const [
    { data: adminUser, error: adminError },
    { data: membership, error: membershipError },
    { data: ownedProject, error: projectError },
    { data: trustPermissionRow, error: permissionsError },
  ] = await Promise.all([
    serviceSupabase.from("admin_users").select("role, status").eq("auth_user_id", user.id).maybeSingle(),
    serviceSupabase
      .from("team_members")
      .select("role, status")
      .eq("project_id", normalizedProjectId)
      .eq("auth_user_id", user.id)
      .maybeSingle(),
    serviceSupabase
      .from("projects")
      .select("id")
      .eq("id", normalizedProjectId)
      .eq("owner_user_id", user.id)
      .maybeSingle(),
    serviceSupabase
      .from("project_trust_permissions")
      .select("visibility_permissions, action_permissions, status")
      .eq("project_id", normalizedProjectId)
      .eq("subject_auth_user_id", user.id)
      .maybeSingle(),
  ]);

  if (adminError) throw new TrustAccessError(500, adminError.message);
  if (membershipError) throw new TrustAccessError(500, membershipError.message);
  if (projectError) throw new TrustAccessError(500, projectError.message);
  if (permissionsError) throw new TrustAccessError(500, permissionsError.message);

  const isSuperAdmin = adminUser?.status === "active" && adminUser.role === "super_admin";
  const ownsProject = Boolean(ownedProject?.id);
  const membershipRole =
    ownsProject ? "owner" : ((membership?.status === "active" ? membership.role : null) as
      | "owner"
      | "admin"
      | "reviewer"
      | "analyst"
      | null);

  if (!isSuperAdmin && !membershipRole) {
    throw new TrustAccessError(403, "This trust console is private to the current project team.");
  }

  if (isSuperAdmin || membershipRole === "owner") {
    const full = getFullProjectTrustPermissions();
    return {
      authUserId: user.id,
      projectId: normalizedProjectId,
      isSuperAdmin,
      membershipRole,
      visibilityPermissions: full.visibilityPermissions,
      actionPermissions: full.actionPermissions,
    };
  }

  if (trustPermissionRow?.status === "active") {
    return {
      authUserId: user.id,
      projectId: normalizedProjectId,
      isSuperAdmin,
      membershipRole,
      visibilityPermissions: normalizeTrustVisibilityPermissions(
        trustPermissionRow.visibility_permissions
      ),
      actionPermissions: normalizeTrustActionPermissions(trustPermissionRow.action_permissions),
    };
  }

  const defaults = getDefaultProjectTrustPermissions();
  return {
    authUserId: user.id,
    projectId: normalizedProjectId,
    isSuperAdmin,
    membershipRole,
    visibilityPermissions: defaults.visibilityPermissions,
    actionPermissions: defaults.actionPermissions,
  };
}

export function createTrustAccessErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof TrustAccessError) {
    return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
  }

  return NextResponse.json(
    {
      ok: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    },
    { status: 500 }
  );
}

export function hasTrustVisibilityPermission(
  access: Pick<ProjectTrustAccessResult, "isSuperAdmin" | "membershipRole" | "visibilityPermissions">,
  permission: TrustVisibilityPermission
) {
  return (
    access.isSuperAdmin ||
    access.membershipRole === "owner" ||
    access.visibilityPermissions.includes(permission)
  );
}

export function hasTrustActionPermission(
  access: Pick<ProjectTrustAccessResult, "isSuperAdmin" | "membershipRole" | "actionPermissions">,
  permission: TrustActionPermission
) {
  return (
    access.isSuperAdmin ||
    access.membershipRole === "owner" ||
    access.actionPermissions.includes(permission)
  );
}

export function canManageProjectTrustPermissions(
  access: Pick<ProjectTrustAccessResult, "isSuperAdmin" | "membershipRole">
) {
  return access.isSuperAdmin || access.membershipRole === "owner";
}
