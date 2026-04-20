import { NextResponse } from "next/server";
import {
  assertProjectAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";
import {
  listProjectOperationOverrides,
  resolveProjectOperationOverride,
  type ProjectOperationObjectType,
  type ProjectOperationOverrideType,
  upsertProjectOperationOverride,
} from "@/lib/platform/core-ops";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await assertProjectAccess(id);
    const overrides = await listProjectOperationOverrides(id);
    return NextResponse.json({ ok: true, overrides });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to load overrides.");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectAccess(id);
    const body = (await request.json().catch(() => null)) as
      | {
          objectType?: ProjectOperationObjectType;
          objectId?: string;
          overrideType?: ProjectOperationOverrideType;
          reason?: string;
          metadata?: Record<string, unknown>;
        }
      | null;

    const objectType = body?.objectType;
    const objectId = typeof body?.objectId === "string" ? body.objectId.trim() : "";
    const overrideType = body?.overrideType;

    if (!objectType || !objectId || !overrideType) {
      return NextResponse.json(
        { ok: false, error: "Missing objectType, objectId, or overrideType." },
        { status: 400 }
      );
    }

    const override = await upsertProjectOperationOverride({
      projectId: id,
      objectType,
      objectId,
      overrideType,
      reason: typeof body?.reason === "string" ? body.reason.trim() : null,
      actorAuthUserId: access.authUserId,
      metadata: body?.metadata ?? {},
    });

    return NextResponse.json({ ok: true, override });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to save override.");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const access = await assertProjectAccess(id);
    const body = (await request.json().catch(() => null)) as
      | { overrideId?: string; status?: "resolved" | "canceled" }
      | null;

    const overrideId = typeof body?.overrideId === "string" ? body.overrideId.trim() : "";
    if (!overrideId || !body?.status) {
      return NextResponse.json(
        { ok: false, error: "Missing overrideId or status." },
        { status: 400 }
      );
    }

    const override = await resolveProjectOperationOverride({
      overrideId,
      actorAuthUserId: access.authUserId,
      status: body.status,
    });

    return NextResponse.json({ ok: true, override });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(error, "Failed to update override.");
  }
}
