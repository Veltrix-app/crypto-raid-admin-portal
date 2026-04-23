import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { loadProjectGrowthSummary } from "@/lib/analytics/growth-dashboard";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId")?.trim();
    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "projectId is required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        {
          ok: false,
          error: "You must be signed in to load project analytics.",
        },
        { status: 401 }
      );
    }

    const serviceSupabase = getAccountsServiceClient();
    const [{ data: project, error: projectError }, { data: adminUser, error: adminError }] =
      await Promise.all([
        serviceSupabase
          .from("projects")
          .select("id, customer_account_id")
          .eq("id", projectId)
          .maybeSingle(),
        serviceSupabase
          .from("admin_users")
          .select("role, status")
          .eq("auth_user_id", user.id)
          .maybeSingle(),
      ]);

    if (projectError) {
      throw new Error(projectError.message || "Failed to validate project analytics access.");
    }
    if (adminError) {
      throw new Error(adminError.message || "Failed to validate project analytics access.");
    }

    if (!project?.id) {
      return NextResponse.json({ ok: true, summary: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const isSuperAdmin = adminUser?.status === "active" && adminUser.role === "super_admin";

    if (!isSuperAdmin && project.customer_account_id) {
      const { data: membership, error: membershipError } = await serviceSupabase
        .from("customer_account_memberships")
        .select("customer_account_id")
        .eq("customer_account_id", project.customer_account_id)
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (membershipError) {
        throw new Error(
          membershipError.message || "Failed to validate project analytics membership."
        );
      }

      if (!membership?.customer_account_id) {
        return NextResponse.json(
          {
            ok: false,
            error: "Project analytics access denied.",
          },
          { status: 403 }
        );
      }
    }

    const summary = await loadProjectGrowthSummary(projectId);

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
          error instanceof Error ? error.message : "Failed to load project analytics summary.",
      },
      { status: 500 }
    );
  }
}
