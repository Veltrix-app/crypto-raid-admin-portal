import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { loadDeployChecks } from "@/lib/observability/deploy-checks";

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
        { ok: false, error: "Deploy checks are limited to Veltrix operators." },
        { status: 403 }
      );
    }

    const summary = await loadDeployChecks();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load deploy checks.",
      },
      { status: 500 }
    );
  }
}
