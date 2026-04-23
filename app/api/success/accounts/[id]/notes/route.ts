import { NextRequest, NextResponse } from "next/server";
import { addSuccessNote } from "@/lib/success/success-actions";
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
      | { noteType?: string; title?: string; body?: string; projectId?: string | null }
      | null;

    const note = await addSuccessNote({
      customerAccountId: id,
      actorAuthUserId: access.authUserId,
      noteType: body?.noteType,
      title: body?.title ?? "",
      body: body?.body ?? "",
      projectId: body?.projectId ?? null,
    });

    return NextResponse.json({ ok: true, note });
  } catch (error) {
    const status =
      error instanceof Error && "status" in error ? Number((error as { status?: number }).status) || 500 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to add success note.",
      },
      { status }
    );
  }
}
