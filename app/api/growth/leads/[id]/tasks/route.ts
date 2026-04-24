import { NextRequest, NextResponse } from "next/server";
import {
  addCommercialLeadTask,
  resolveCommercialLeadTask,
} from "@/lib/growth/growth-actions";
import { assertInternalGrowthAccess } from "@/lib/growth/growth-overview";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authenticatedUser = await assertInternalGrowthAccess(request);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | {
          taskType?: string;
          title?: string;
          summary?: string;
          dueAt?: string | null;
        }
      | null;

    const task = await addCommercialLeadTask({
      leadId: id,
      actorAuthUserId: authenticatedUser.user.id,
      taskType: body?.taskType,
      title: body?.title ?? "",
      summary: body?.summary ?? "",
      dueAt: body?.dueAt ?? null,
    });

    return NextResponse.json(
      { ok: true, task },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add follow-up task.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authenticatedUser = await assertInternalGrowthAccess(request);
    const body = (await request.json().catch(() => null)) as
      | {
          taskId?: string;
        }
      | null;

    const taskId = body?.taskId?.trim();
    if (!taskId) {
      return NextResponse.json({ ok: false, error: "Task id is required." }, { status: 400 });
    }

    const task = await resolveCommercialLeadTask({
      taskId,
      actorAuthUserId: authenticatedUser.user.id,
    });

    return NextResponse.json(
      { ok: true, task },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve follow-up task.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
