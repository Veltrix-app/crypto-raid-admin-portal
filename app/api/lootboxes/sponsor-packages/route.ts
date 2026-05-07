import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxSponsorPackageAuditPayload,
  buildLootboxSponsorPackageInsertRow,
  isMissingLootboxSponsorPackageSchema,
  parseLootboxSponsorPackageCreateBody,
} from "@/lib/lootboxes/lootbox-sponsored-package-persistence";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SponsorPackageAdminResult =
  | {
      ok: true;
      authUserId: string;
      serviceSupabase: ReturnType<typeof getServiceSupabaseClient>;
    }
  | { ok: false; response: NextResponse };

async function getSponsorPackageAdmin(): Promise<SponsorPackageAdminResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "You must be signed in." }, { status: 401 }),
    };
  }

  const serviceSupabase = getServiceSupabaseClient();
  const { data: adminUser, error: adminError } = await serviceSupabase
    .from("admin_users")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: adminError.message }, { status: 500 }),
    };
  }

  if (!adminUser || adminUser.status !== "active" || adminUser.role !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Sponsor package controls are limited to Veltrix super admins." },
        { status: 403 }
      ),
    };
  }

  return { ok: true, authUserId: user.id, serviceSupabase };
}

export async function GET() {
  try {
    const admin = await getSponsorPackageAdmin();
    if (!admin.ok) {
      return admin.response;
    }

    const packagesResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_packages")
      .select(
        [
          "id",
          "project_id",
          "campaign_id",
          "package_tier",
          "status",
          "sponsor_name",
          "sponsor_contact",
          "sponsor_budget",
          "currency",
          "owner_auth_user_id",
          "follow_up_at",
          "last_contacted_at",
          "package_snapshot",
          "metadata",
          "created_by_auth_user_id",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .order("updated_at", { ascending: false })
      .limit(100);

    if (packagesResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(packagesResponse.error) ? 409 : 500;
      return NextResponse.json(
        { ok: false, error: packagesResponse.error.message },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      sponsorPackages: packagesResponse.data ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sponsor package read failed.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const parsed = parseLootboxSponsorPackageCreateBody(body);

    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const admin = await getSponsorPackageAdmin();
    if (!admin.ok) {
      return admin.response;
    }

    const insertResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_packages")
      .insert(
        buildLootboxSponsorPackageInsertRow({
          payload: parsed.payload,
          createdByAuthUserId: admin.authUserId,
        })
      )
      .select(
        [
          "id",
          "project_id",
          "campaign_id",
          "package_tier",
          "status",
          "sponsor_name",
          "sponsor_contact",
          "sponsor_budget",
          "currency",
          "owner_auth_user_id",
          "follow_up_at",
          "last_contacted_at",
          "package_snapshot",
          "metadata",
          "created_by_auth_user_id",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .single();

    if (insertResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(insertResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: insertResponse.error.message }, { status });
    }

    const sponsorPackage = insertResponse.data as unknown as { id: string };
    const auditResult = await admin.serviceSupabase
      .from("admin_audit_logs")
      .insert(
        buildLootboxSponsorPackageAuditPayload({
          adminAuthUserId: admin.authUserId,
          projectId: parsed.payload.projectId,
          sponsorPackageId: sponsorPackage.id,
          action: "lootbox_sponsor_package_created",
          summary: `Created ${parsed.payload.packageTier} sponsor package.`,
          metadata: {
            campaignId: parsed.payload.campaignId,
            packageTier: parsed.payload.packageTier,
            status: parsed.payload.status,
          },
        })
      );

    if (auditResult.error) {
      console.error("Sponsor package audit log skipped:", auditResult.error.message);
    }

    return NextResponse.json({
      ok: true,
      sponsorPackage,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sponsor package create failed.",
      },
      { status: 500 }
    );
  }
}
