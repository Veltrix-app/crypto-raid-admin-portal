import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { loadGrowthAnalyticsOverview } from "@/lib/analytics/growth-dashboard";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "You must be signed in." }, { status: 401 });
    }

    const serviceSupabase = getAccountsServiceClient();
    const { data: adminUser, error: adminError } = await serviceSupabase
      .from("admin_users")
      .select("role, status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json({ ok: false, error: adminError.message }, { status: 500 });
    }

    if (!adminUser || adminUser.status !== "active" || adminUser.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: "Analytics growth workspace is internal-only." },
        { status: 403 }
      );
    }

    const overview = await loadGrowthAnalyticsOverview();

    return NextResponse.json(
      { ok: true, overview },
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
          error instanceof Error ? error.message : "Failed to load growth analytics overview.",
      },
      { status: 500 }
    );
  }
}
