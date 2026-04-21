import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { createClient } from "@/lib/supabase/server";
import { loadProjectMetricSummary } from "@/lib/analytics/project-metrics";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing projectId." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "You must be signed in." }, { status: 401 });
    }

    const serviceSupabase = getServiceSupabaseClient();
    const { data: adminUser, error: adminError } = await serviceSupabase
      .from("admin_users")
      .select("role, status")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (adminError) {
      return NextResponse.json({ ok: false, error: adminError.message }, { status: 500 });
    }

    if (!adminUser || adminUser.status !== "active") {
      return NextResponse.json(
        { ok: false, error: "Analytics is limited to Veltrix operators." },
        { status: 403 }
      );
    }

    const summary = await loadProjectMetricSummary(projectId);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load project analytics summary.",
      },
      { status: 500 }
    );
  }
}
