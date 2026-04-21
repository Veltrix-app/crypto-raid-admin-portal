import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { createClient } from "@/lib/supabase/server";
import {
  loadPlatformHealthSummary,
  loadProjectHealthSummary,
} from "@/lib/observability/health";

export async function GET(request: NextRequest) {
  try {
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
        { ok: false, error: "Ops health is limited to Veltrix operators." },
        { status: 403 }
      );
    }

    const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
    const summary = projectId
      ? await loadProjectHealthSummary(projectId)
      : await loadPlatformHealthSummary();

    return NextResponse.json({
      ok: true,
      scope: projectId ? "project" : "platform",
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load ops health.",
      },
      { status: 500 }
    );
  }
}
