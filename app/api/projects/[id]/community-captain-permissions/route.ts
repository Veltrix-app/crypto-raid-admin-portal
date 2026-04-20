import { NextRequest, NextResponse } from "next/server";
import {
  type CommunityCaptainPermission,
  type CommunityCaptainSeatScope,
} from "@/components/community/community-config";
import {
  assertProjectCommunityAccess,
  ProjectCommunityAccessError,
} from "@/lib/community/project-community-auth";
import { loadProjectCommunityExecution, saveProjectCaptainPermissions } from "@/lib/community/project-community-execution";
import { writeProjectCommunityAuditLog } from "@/lib/community/project-community-ops";

function sanitizeCaptainPermissionMap(input: unknown) {
  if (!input || typeof input !== "object") {
    return {} as Record<string, CommunityCaptainPermission[]>;
  }

  const result: Record<string, CommunityCaptainPermission[]> = {};
  for (const [authUserId, permissions] of Object.entries(input as Record<string, unknown>)) {
    if (!authUserId.trim()) {
      continue;
    }

    result[authUserId] = Array.isArray(permissions)
      ? permissions.filter((value): value is CommunityCaptainPermission => typeof value === "string")
      : [];
  }

  return result;
}

function sanitizeCaptainSeatScopeMap(input: unknown) {
  if (!input || typeof input !== "object") {
    return {} as Record<string, CommunityCaptainSeatScope>;
  }

  const result: Record<string, CommunityCaptainSeatScope> = {};
  for (const [seatKey, scope] of Object.entries(input as Record<string, unknown>)) {
    if (!seatKey.trim()) {
      continue;
    }

    result[seatKey] =
      scope === "project_only" || scope === "community_only" || scope === "project_and_community"
        ? scope
        : "project_and_community";
  }

  return result;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectCommunityAccess(id?.trim() ?? "");
    const payload = await loadProjectCommunityExecution(access.projectId);

    return NextResponse.json({
      ok: true,
      captainPermissions: payload.captainPermissions,
      captainSeatScopes: payload.captainSeatScopes,
      captainActions: payload.captainActions,
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to load captain permissions.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectCommunityAccess(id?.trim() ?? "");
    const body = (await request.json().catch(() => null)) as
      | {
          captainPermissions?: Record<string, CommunityCaptainPermission[]>;
          captainSeatScopes?: Record<string, CommunityCaptainSeatScope>;
        }
      | null;

    const captainPermissions = sanitizeCaptainPermissionMap(body?.captainPermissions);
    const captainSeatScopes = sanitizeCaptainSeatScopeMap(body?.captainSeatScopes);
    const payload = await saveProjectCaptainPermissions({
      projectId: access.projectId,
      permissionMap: captainPermissions,
      seatScopeMap: captainSeatScopes,
    });

    await writeProjectCommunityAuditLog({
      projectId: access.projectId,
      sourceTable: "community_bot_settings",
      sourceId: access.projectId,
      action: "community_captain_permissions_updated",
      summary: `Updated captain permissions for ${Object.keys(captainPermissions).length} seat${Object.keys(captainPermissions).length === 1 ? "" : "s"}.`,
      metadata: {
        updatedBy: access.authUserId,
        captainPermissions,
        captainSeatScopes,
      },
    });

    return NextResponse.json({
      ok: true,
      captainPermissions: payload.captainPermissions,
      captainSeatScopes: payload.captainSeatScopes,
      captainActions: payload.captainActions,
      message: "Captain permissions saved.",
    });
  } catch (error) {
    if (error instanceof ProjectCommunityAccessError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to save captain permissions.",
      },
      { status: 500 }
    );
  }
}
