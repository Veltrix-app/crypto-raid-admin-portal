import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  assertProjectOnchainAccess,
  canManageProjectOnchainPermissions,
  createOnchainAccessErrorResponse,
  OnchainAccessError,
} from "@/lib/onchain/project-onchain-auth";
import {
  normalizeOnchainActionPermissions,
  normalizeOnchainVisibilityPermissions,
} from "@/lib/onchain/onchain-config";
import {
  listProjectOnchainPermissionAssignments,
  saveProjectOnchainPermissionAssignments,
  type ProjectOnchainPermissionSaveInput,
} from "@/lib/onchain/onchain-permissions";

async function writeOnchainPermissionAudit(params: {
  projectId: string;
  authUserId: string;
  assignmentCount: number;
  assignments: unknown;
}) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("admin_audit_logs").insert({
    auth_user_id: params.authUserId,
    project_id: params.projectId,
    source_table: "project_onchain_permissions",
    source_id: params.projectId,
    action: "project_onchain_permissions_updated",
    summary: `Updated on-chain permissions for ${params.assignmentCount} teammate${params.assignmentCount === 1 ? "" : "s"}.`,
    metadata: {
      assignments: params.assignments,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message || "Failed to write on-chain permission audit log.");
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectOnchainAccess(id);

    if (!canManageProjectOnchainPermissions(access)) {
      throw new OnchainAccessError(403, "Only project owners can manage on-chain grants.");
    }

    const assignments = await listProjectOnchainPermissionAssignments(access.projectId);
    return NextResponse.json({ ok: true, assignments });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to load project on-chain permissions.");
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectOnchainAccess(id);

    if (!canManageProjectOnchainPermissions(access)) {
      throw new OnchainAccessError(403, "Only project owners can manage on-chain grants.");
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

    const assignments: ProjectOnchainPermissionSaveInput[] = (body?.assignments ?? [])
      .filter((assignment) => assignment?.subjectAuthUserId?.trim())
      .map((assignment) => ({
        subjectAuthUserId: assignment.subjectAuthUserId!.trim(),
        visibilityPermissions: normalizeOnchainVisibilityPermissions(
          assignment.visibilityPermissions
        ),
        actionPermissions: normalizeOnchainActionPermissions(assignment.actionPermissions),
        presetKey: assignment.presetKey ?? null,
        status: assignment.status === "revoked" ? "revoked" : "active",
        notes: assignment.notes ?? null,
      }));

    const savedAssignments = await saveProjectOnchainPermissionAssignments({
      projectId: access.projectId,
      grantedByAuthUserId: access.authUserId,
      assignments,
    });

    await writeOnchainPermissionAudit({
      projectId: access.projectId,
      authUserId: access.authUserId,
      assignmentCount: assignments.length,
      assignments,
    });

    return NextResponse.json({
      ok: true,
      assignments: savedAssignments,
      message: "Project on-chain permissions saved.",
    });
  } catch (error) {
    return createOnchainAccessErrorResponse(error, "Failed to save project on-chain permissions.");
  }
}
