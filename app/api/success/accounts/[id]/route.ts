import { NextResponse } from "next/server";
import {
  assertSuccessAccountAccess,
  loadSuccessAccountDetail,
} from "@/lib/success/success-overview";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    await assertSuccessAccountAccess(id);
    const detail = await loadSuccessAccountDetail(id);

    return NextResponse.json(
      { ok: true, detail },
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
        error: error instanceof Error ? error.message : "Failed to load success account detail.",
      },
      { status }
    );
  }
}
