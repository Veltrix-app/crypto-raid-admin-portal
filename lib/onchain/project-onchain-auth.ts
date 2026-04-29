import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  getDefaultProjectOnchainPermissions,
  getFullProjectOnchainPermissions,
  normalizeOnchainActionPermissions,
  normalizeOnchainVisibilityPermissions,
  type OnchainActionPermission,
  type OnchainVisibilityPermission,
} from "./onchain-config";

export class OnchainAccessError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ProjectOnchainAccessResult = {
  authUserId: string;
  projectId: string;
  isSuperAdmin: boolean;
  membershipRole: "owner" | "admin" | "reviewer" | "analyst" | null;
  visibilityPermissions: OnchainVisibilityPermission[];
  actionPermissions: OnchainActionPermission[];
};

export async function assertInternalOnchainAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new OnchainAccessError(401, "You must be signed in to access on-chain operations.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const { data: adminUser, error } = await serviceSupabase
    .from("admin_users")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new OnchainAccessError(500, error.message);
  }

  if (!adminUser || adminUser.status !== "active") {
    throw new OnchainAccessError(403, "Internal on-chain operations are limited to VYNTRO operators.");
  }

  return {
    authUserId: user.id,
    adminRole: adminUser.role ?? "operator",
    isSuperAdmin: adminUser.role === "super_admin",
  };
}

export async function assertProjectOnchainAccess(
  projectId: string
): Promise<ProjectOnchainAccessResult> {
  const normalizedProjectId = projectId.trim();
  if (!normalizedProjectId) {
    throw new OnchainAccessError(400, "Missing project id.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new OnchainAccessError(401, "You must be signed in to access this on-chain console.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const [
    { data: adminUser, error: adminError },
    { data: membership, error: membershipError },
    { data: ownedProject, error: projectError },
    { data: permissionRow, error: permissionsError },
  ] = await Promise.all([
    serviceSupabase
      .from("admin_users")
      .select("role, status")
      .eq("auth_user_id", user.id)
      .maybeSingle(),
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
      .from("project_onchain_permissions")
      .select("visibility_permissions, action_permissions, status")
      .eq("project_id", normalizedProjectId)
      .eq("subject_auth_user_id", user.id)
      .maybeSingle(),
  ]);

  if (adminError) throw new OnchainAccessError(500, adminError.message);
  if (membershipError) throw new OnchainAccessError(500, membershipError.message);
  if (projectError) throw new OnchainAccessError(500, projectError.message);
  if (permissionsError) throw new OnchainAccessError(500, permissionsError.message);

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
    throw new OnchainAccessError(403, "This on-chain console is private to the current project team.");
  }

  if (isSuperAdmin || membershipRole === "owner") {
    const full = getFullProjectOnchainPermissions();
    return {
      authUserId: user.id,
      projectId: normalizedProjectId,
      isSuperAdmin,
      membershipRole,
      visibilityPermissions: full.visibilityPermissions,
      actionPermissions: full.actionPermissions,
    };
  }

  if (permissionRow?.status === "active") {
    return {
      authUserId: user.id,
      projectId: normalizedProjectId,
      isSuperAdmin,
      membershipRole,
      visibilityPermissions: normalizeOnchainVisibilityPermissions(permissionRow.visibility_permissions),
      actionPermissions: normalizeOnchainActionPermissions(permissionRow.action_permissions),
    };
  }

  const defaults = getDefaultProjectOnchainPermissions();
  return {
    authUserId: user.id,
    projectId: normalizedProjectId,
    isSuperAdmin,
    membershipRole,
    visibilityPermissions: defaults.visibilityPermissions,
    actionPermissions: defaults.actionPermissions,
  };
}

export function createOnchainAccessErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof OnchainAccessError) {
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

export function hasOnchainVisibilityPermission(
  access: Pick<ProjectOnchainAccessResult, "isSuperAdmin" | "membershipRole" | "visibilityPermissions">,
  permission: OnchainVisibilityPermission
) {
  return (
    access.isSuperAdmin ||
    access.membershipRole === "owner" ||
    access.visibilityPermissions.includes(permission)
  );
}

export function hasOnchainActionPermission(
  access: Pick<ProjectOnchainAccessResult, "isSuperAdmin" | "membershipRole" | "actionPermissions">,
  permission: OnchainActionPermission
) {
  return (
    access.isSuperAdmin ||
    access.membershipRole === "owner" ||
    access.actionPermissions.includes(permission)
  );
}

export function canManageProjectOnchainPermissions(
  access: Pick<ProjectOnchainAccessResult, "isSuperAdmin" | "membershipRole">
) {
  return access.isSuperAdmin || access.membershipRole === "owner";
}
