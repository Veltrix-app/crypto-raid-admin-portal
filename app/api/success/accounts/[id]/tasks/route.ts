import { NextRequest, NextResponse } from "next/server";
import {
  addSuccessTask,
  resolveSuccessTask,
} from "@/lib/success/success-actions";
import { assertSuccessAccountAccess } from "@/lib/success/success-overview";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const access = await assertSuccessAccountAccess(id);
    const body = (await request.json().catch(() => null)) as
      | {
          action?: "create" | "resolve";
          taskType?: string;
          title?: string;
          summary?: string;
          dueAt?: string | null;
          projectId?: string | null;
          taskId?: string;
        }
      | null;

    if (body?.action === "resolve") {
      if (!body.taskId) {
        return NextResponse.json({ ok: false, error: "Task id is required." }, { status: 400 });
      }

      const task = await resolveSuccessTask({
        taskId: body.taskId,
        actorAuthUserId: access.authUserId,
      });

      return NextResponse.json({ ok: true, task });
    }

    const task = await addSuccessTask({
      customerAccountId: id,
      actorAuthUserId: access.authUserId,
      taskType: body?.taskType,
      title: body?.title ?? "",
      summary: body?.summary ?? "",
      dueAt: body?.dueAt ?? null,
      projectId: body?.projectId ?? null,
    });

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error ? Number((error as { status?: number }).status) || 500 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update success task.",
      },
      { status }
    );
  }
}
