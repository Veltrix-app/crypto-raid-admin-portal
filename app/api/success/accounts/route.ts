import { NextResponse } from "next/server";
import {
  assertInternalSuccessAccess,
  loadSuccessOverview,
} from "@/lib/success/success-overview";

export async function GET() {
  try {
    await assertInternalSuccessAccess();
    const overview = await loadSuccessOverview();

    return NextResponse.json(
      { ok: true, accounts: overview.accounts },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    const status =
      error instanceof Error && "status" in error ? Number((error as { status?: number }).status) || 500 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load success accounts.",
      },
      { status }
    );
  }
}
