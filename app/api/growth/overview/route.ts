import { NextRequest, NextResponse } from "next/server";
import {
  assertInternalGrowthAccess,
  loadGrowthOverview,
} from "@/lib/growth/growth-overview";

export async function GET(request: NextRequest) {
  try {
    await assertInternalGrowthAccess(request);
    const overview = await loadGrowthOverview();

    return NextResponse.json(
      { ok: true, overview },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load growth overview.";
    const status =
      message === "Missing bearer token." || message === "Invalid session."
        ? 401
        : message === "Admin access denied."
          ? 403
          : 500;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
