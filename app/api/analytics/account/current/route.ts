import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadCurrentCustomerGrowthSummaryForUser } from "@/lib/analytics/growth-dashboard";

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
          error: "You must be signed in to load customer analytics.",
        },
        { status: 401 }
      );
    }

    const summary = await loadCurrentCustomerGrowthSummaryForUser(user.id);

    return NextResponse.json(
      {
        ok: true,
        summary,
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
        error:
          error instanceof Error ? error.message : "Failed to load customer analytics summary.",
      },
      { status: 500 }
    );
  }
}
