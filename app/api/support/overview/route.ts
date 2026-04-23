import { NextResponse } from "next/server";
import { assertInternalSupportAccess } from "@/lib/support/escalations";
import { loadSupportOverview } from "@/lib/support/support-queue";

export async function GET() {
  try {
    await assertInternalSupportAccess();
    const overview = await loadSupportOverview();

    return NextResponse.json(
      {
        ok: true,
        overview,
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
        error: error instanceof Error ? error.message : "Failed to load support overview.",
      },
      { status: error instanceof Error && "status" in error ? Number(error.status) || 500 : 500 }
    );
  }
}
