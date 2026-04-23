import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBillingLimitError } from "@/lib/billing/entitlement-blocks";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

export class ProjectCommunityAccessError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function assertProjectCommunityAccess(projectId: string) {
  const normalizedProjectId = projectId.trim();
  if (!normalizedProjectId) {
    throw new ProjectCommunityAccessError(400, "Missing project id.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ProjectCommunityAccessError(401, "You must be signed in to manage this community.");
  }

  const serviceSupabase = getServiceSupabaseClient();
  const [{ data: adminUser, error: adminError }, { data: teamMembership, error: membershipError }, { data: ownedProject, error: projectError }] =
    await Promise.all([
      serviceSupabase
        .from("admin_users")
        .select("role, status")
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      serviceSupabase
        .from("team_members")
        .select("id, role, status")
        .eq("project_id", normalizedProjectId)
        .eq("auth_user_id", user.id)
        .maybeSingle(),
      serviceSupabase
        .from("projects")
        .select("id")
        .eq("id", normalizedProjectId)
        .eq("owner_user_id", user.id)
        .maybeSingle(),
    ]);

  if (adminError) {
    throw new ProjectCommunityAccessError(500, adminError.message);
  }
  if (membershipError) {
    throw new ProjectCommunityAccessError(500, membershipError.message);
  }
  if (projectError) {
    throw new ProjectCommunityAccessError(500, projectError.message);
  }

  const isSuperAdmin = adminUser?.status === "active" && adminUser?.role === "super_admin";
  const hasMembership = Boolean(teamMembership && teamMembership.status === "active");
  const ownsProject = Boolean(ownedProject?.id);

  if (!isSuperAdmin && !hasMembership && !ownsProject) {
    throw new ProjectCommunityAccessError(
      403,
      "This community rail is private to the current project team."
    );
  }

  return {
    authUserId: user.id,
    isSuperAdmin,
    membershipRole: teamMembership?.role ?? (ownsProject ? "owner" : null),
    projectId: normalizedProjectId,
  };
}

export async function assertProjectAccess(projectId: string) {
  return assertProjectCommunityAccess(projectId);
}

export function createProjectCommunityAccessErrorResponse(
  error: unknown,
  fallbackMessage: string
) {
  if (isBillingLimitError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        block: error.block,
      },
      { status: 409 }
    );
  }

  if (error instanceof ProjectCommunityAccessError) {
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
