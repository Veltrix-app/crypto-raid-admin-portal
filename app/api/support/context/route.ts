import { NextRequest, NextResponse } from "next/server";
import { assertInternalSupportAccess } from "@/lib/support/escalations";
import { listSurfaceSupportContext } from "@/lib/support/support-queue";
import type { AdminSupportHandoffType } from "@/types/entities/support";

export async function GET(request: NextRequest) {
  try {
    await assertInternalSupportAccess();
    const searchParams = request.nextUrl.searchParams;
    const handoffType = searchParams.get("handoffType")?.trim() as AdminSupportHandoffType | undefined;

    if (!handoffType) {
      return NextResponse.json(
        {
          ok: false,
          error: "Choose a support handoff type.",
        },
        { status: 400 }
      );
    }

    const rows = await listSurfaceSupportContext({
      handoffType,
      customerAccountId: searchParams.get("customerAccountId")?.trim() || undefined,
      targetProjectId: searchParams.get("targetProjectId")?.trim() || undefined,
      targetRecordId: searchParams.get("targetRecordId")?.trim() || undefined,
      includeResolved: searchParams.get("includeResolved") === "true",
    });

    return NextResponse.json(
      {
        ok: true,
        rows,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load support surface context.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}
