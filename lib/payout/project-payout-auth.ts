import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  getDefaultProjectPayoutPermissions,
  getFullProjectPayoutPermissions,
  normalizePayoutActionPermissions,
  normalizePayoutVisibilityPermissions,
  type PayoutActionPermission,
  type PayoutVisibilityPermission,
} from "./payout-config";

export class PayoutAccessError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ProjectPayoutAccessResult = {
  authUserId: string;
  projectId: string;
  isSuperAdmin: boolean;
  membershipRole: "owner" | "admin" | "reviewer" | "analyst" | null;
  visibilityPermissions: PayoutVisibilityPermission[];
  actionPermissions: PayoutActionPermission[];
};

export async function assertInternalPayoutAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new PayoutAccessError(401, "You must be signed in to access payout operations.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const { data: adminUser, error } = await serviceSupabase
    .from("admin_users")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new PayoutAccessError(500, error.message);
  }

  if (!adminUser || adminUser.status !== "active") {
    throw new PayoutAccessError(403, "Internal payout operations are limited to VYNTRO operators.");
  }

  return {
    authUserId: user.id,
    adminRole: adminUser.role ?? "operator",
    isSuperAdmin: adminUser.role === "super_admin",
  };
}

export async function assertProjectPayoutAccess(projectId: string): Promise<ProjectPayoutAccessResult> {
  const normalizedProjectId = projectId.trim();
  if (!normalizedProjectId) {
    throw new PayoutAccessError(400, "Missing project id.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new PayoutAccessError(401, "You must be signed in to access this payout console.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const [
    { data: adminUser, error: adminError },
    { data: membership, error: membershipError },
    { data: ownedProject, error: projectError },
    { data: permissionRow, error: permissionsError },
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
      .from("project_payout_permissions")
      .select("visibility_permissions, action_permissions, status")
      .eq("project_id", normalizedProjectId)
      .eq("subject_auth_user_id", user.id)
      .maybeSingle(),
  ]);

  if (adminError) throw new PayoutAccessError(500, adminError.message);
  if (membershipError) throw new PayoutAccessError(500, membershipError.message);
  if (projectError) throw new PayoutAccessError(500, projectError.message);
  if (permissionsError) throw new PayoutAccessError(500, permissionsError.message);

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
    throw new PayoutAccessError(403, "This payout console is private to the current project team.");
  }

  if (isSuperAdmin || membershipRole === "owner") {
    const full = getFullProjectPayoutPermissions();
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
      visibilityPermissions: normalizePayoutVisibilityPermissions(permissionRow.visibility_permissions),
      actionPermissions: normalizePayoutActionPermissions(permissionRow.action_permissions),
    };
  }

  const defaults = getDefaultProjectPayoutPermissions();
  return {
    authUserId: user.id,
    projectId: normalizedProjectId,
    isSuperAdmin,
    membershipRole,
    visibilityPermissions: defaults.visibilityPermissions,
    actionPermissions: defaults.actionPermissions,
  };
}

export function createPayoutAccessErrorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof PayoutAccessError) {
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

export function hasPayoutVisibilityPermission(
  access: Pick<ProjectPayoutAccessResult, "isSuperAdmin" | "membershipRole" | "visibilityPermissions">,
  permission: PayoutVisibilityPermission
) {
  return (
    access.isSuperAdmin ||
    access.membershipRole === "owner" ||
    access.visibilityPermissions.includes(permission)
  );
}

export function hasPayoutActionPermission(
  access: Pick<ProjectPayoutAccessResult, "isSuperAdmin" | "membershipRole" | "actionPermissions">,
  permission: PayoutActionPermission
) {
  return (
    access.isSuperAdmin ||
    access.membershipRole === "owner" ||
    access.actionPermissions.includes(permission)
  );
}

export function canManageProjectPayoutPermissions(
  access: Pick<ProjectPayoutAccessResult, "isSuperAdmin" | "membershipRole">
) {
  return access.isSuperAdmin || access.membershipRole === "owner";
}
