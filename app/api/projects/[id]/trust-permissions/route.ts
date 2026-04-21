import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectTrustAccess,
  canManageProjectTrustPermissions,
  createTrustAccessErrorResponse,
  TrustAccessError,
} from "@/lib/trust/project-trust-auth";
import {
  listProjectTrustPermissionAssignments,
  type ProjectTrustPermissionSaveInput,
  saveProjectTrustPermissionAssignments,
} from "@/lib/trust/trust-permissions";
import {
  normalizeTrustActionPermissions,
  normalizeTrustVisibilityPermissions,
} from "@/lib/trust/trust-config";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

async function writeTrustPermissionAudit(params: {
  projectId: string;
  authUserId: string;
  assignmentCount: number;
  assignments: unknown;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("admin_audit_logs").insert({
    auth_user_id: params.authUserId,
    project_id: params.projectId,
    source_table: "project_trust_permissions",
    source_id: params.projectId,
    action: "project_trust_permissions_updated",
    summary: `Updated trust permissions for ${params.assignmentCount} teammate${params.assignmentCount === 1 ? "" : "s"}.`,
    metadata: {
      assignments: params.assignments,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || "Failed to write trust permission audit log.");
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectTrustAccess(id);

    if (!canManageProjectTrustPermissions(access)) {
      throw new TrustAccessError(403, "Only project owners can manage trust grants.");
    }

    const assignments = await listProjectTrustPermissionAssignments(access.projectId);
    return NextResponse.json({ ok: true, assignments });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to load project trust permissions.");
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectTrustAccess(id);

    if (!canManageProjectTrustPermissions(access)) {
      throw new TrustAccessError(403, "Only project owners can manage trust grants.");
    }

    const body = (await request.json().catch(() => null)) as
      | {
          assignments?: Array<{
            subjectAuthUserId?: string;
            visibilityPermissions?: unknown;
            actionPermissions?: unknown;
            presetKey?: string | null;
            status?: "active" | "revoked";
            notes?: string | null;
          }>;
        }
      | null;

    const assignments: ProjectTrustPermissionSaveInput[] = (body?.assignments ?? [])
      .filter((assignment) => assignment?.subjectAuthUserId?.trim())
      .map((assignment) => ({
        subjectAuthUserId: assignment.subjectAuthUserId!.trim(),
        visibilityPermissions: normalizeTrustVisibilityPermissions(
          assignment.visibilityPermissions
        ),
        actionPermissions: normalizeTrustActionPermissions(assignment.actionPermissions),
        presetKey: assignment.presetKey ?? null,
        status: assignment.status === "revoked" ? "revoked" : "active",
        notes: assignment.notes ?? null,
      }));

    const savedAssignments = await saveProjectTrustPermissionAssignments({
      projectId: access.projectId,
      grantedByAuthUserId: access.authUserId,
      assignments,
    });

    await writeTrustPermissionAudit({
      projectId: access.projectId,
      authUserId: access.authUserId,
      assignmentCount: assignments.length,
      assignments,
    });

    return NextResponse.json({
      ok: true,
      assignments: savedAssignments,
      message: "Project trust permissions saved.",
    });
  } catch (error) {
    return createTrustAccessErrorResponse(error, "Failed to save project trust permissions.");
  }
}
