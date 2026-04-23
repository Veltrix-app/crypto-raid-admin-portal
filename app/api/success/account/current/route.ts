import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  loadSuccessAccountDetail,
  resolvePrimaryAccountIdForUser,
} from "@/lib/success/success-overview";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "You must be signed in to load account activation.",
        },
        { status: 401 }
      );
    }

    const accountId = await resolvePrimaryAccountIdForUser(user.id);
    if (!accountId) {
      return NextResponse.json(
        {
          ok: true,
          summary: null,
          detail: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const detail = await loadSuccessAccountDetail(accountId);

    return NextResponse.json(
      {
        ok: true,
        summary: detail,
        detail,
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
        error: error instanceof Error ? error.message : "Failed to load account activation.",
      },
      { status: 500 }
    );
  }
}
