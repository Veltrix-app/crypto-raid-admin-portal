import { NextRequest, NextResponse } from "next/server";
import {
  assertProjectPayoutAccess,
  canManageProjectPayoutPermissions,
  createPayoutAccessErrorResponse,
  PayoutAccessError,
} from "@/lib/payout/project-payout-auth";
import {
  listProjectPayoutPermissionAssignments,
  type ProjectPayoutPermissionSaveInput,
  saveProjectPayoutPermissionAssignments,
} from "@/lib/payout/payout-permissions";
import {
  normalizePayoutActionPermissions,
  normalizePayoutVisibilityPermissions,
} from "@/lib/payout/payout-config";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

async function writePayoutPermissionAudit(params: {
  projectId: string;
  authUserId: string;
  assignmentCount: number;
  assignments: unknown;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("admin_audit_logs").insert({
    auth_user_id: params.authUserId,
    project_id: params.projectId,
    source_table: "project_payout_permissions",
    source_id: params.projectId,
    action: "project_payout_permissions_updated",
    summary: `Updated payout permissions for ${params.assignmentCount} teammate${params.assignmentCount === 1 ? "" : "s"}.`,
    metadata: {
      assignments: params.assignments,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || "Failed to write payout permission audit log.");
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectPayoutAccess(id);

    if (!canManageProjectPayoutPermissions(access)) {
      throw new PayoutAccessError(403, "Only project owners can manage payout grants.");
    }

    const assignments = await listProjectPayoutPermissionAssignments(access.projectId);
    return NextResponse.json({ ok: true, assignments });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to load project payout permissions.");
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectPayoutAccess(id);

    if (!canManageProjectPayoutPermissions(access)) {
      throw new PayoutAccessError(403, "Only project owners can manage payout grants.");
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

    const assignments: ProjectPayoutPermissionSaveInput[] = (body?.assignments ?? [])
      .filter((assignment) => assignment?.subjectAuthUserId?.trim())
      .map((assignment) => ({
        subjectAuthUserId: assignment.subjectAuthUserId!.trim(),
        visibilityPermissions: normalizePayoutVisibilityPermissions(
          assignment.visibilityPermissions
        ),
        actionPermissions: normalizePayoutActionPermissions(assignment.actionPermissions),
        presetKey: assignment.presetKey ?? null,
        status: assignment.status === "revoked" ? "revoked" : "active",
        notes: assignment.notes ?? null,
      }));

    const savedAssignments = await saveProjectPayoutPermissionAssignments({
      projectId: access.projectId,
      grantedByAuthUserId: access.authUserId,
      assignments,
    });

    await writePayoutPermissionAudit({
      projectId: access.projectId,
      authUserId: access.authUserId,
      assignmentCount: assignments.length,
      assignments,
    });

    return NextResponse.json({
      ok: true,
      assignments: savedAssignments,
      message: "Project payout permissions saved.",
    });
  } catch (error) {
    return createPayoutAccessErrorResponse(error, "Failed to save project payout permissions.");
  }
}
