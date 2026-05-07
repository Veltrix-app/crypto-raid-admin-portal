import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxSponsorPackageAuditPayload,
  buildLootboxSponsorPackagePatchRow,
  isMissingLootboxSponsorPackageSchema,
  parseLootboxSponsorPackagePatchBody,
} from "@/lib/lootboxes/lootbox-sponsored-package-persistence";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SponsorPackageRow = {
  id: string;
  project_id: string | null;
  campaign_id: string | null;
  package_tier: string | null;
  status: string | null;
  owner_auth_user_id: string | null;
  follow_up_at: string | null;
};

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const parsed = parseLootboxSponsorPackagePatchBody(body);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing sponsor package id." }, { status: 400 });
    }

    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
    }

    const admin = await getSponsorPackageAdmin();
    if (!admin.ok) {
      return admin.response;
    }

    const existingResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_packages")
      .select("id, project_id, campaign_id, package_tier, status, owner_auth_user_id, follow_up_at")
      .eq("id", id)
      .maybeSingle();

    if (existingResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(existingResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: existingResponse.error.message }, { status });
    }

    if (!existingResponse.data) {
      return NextResponse.json({ ok: false, error: "Sponsor package not found." }, { status: 404 });
    }

    const existing = existingResponse.data as SponsorPackageRow;
    const updateResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_packages")
      .update(buildLootboxSponsorPackagePatchRow(parsed.payload))
      .eq("id", existing.id)
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

    if (updateResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(updateResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: updateResponse.error.message }, { status });
    }

    const changedFields = Object.keys(parsed.payload);
    const auditResult = await admin.serviceSupabase
      .from("admin_audit_logs")
      .insert(
        buildLootboxSponsorPackageAuditPayload({
          adminAuthUserId: admin.authUserId,
          projectId: existing.project_id,
          sponsorPackageId: existing.id,
          action: "lootbox_sponsor_package_updated",
          summary: `Updated sponsor package ${changedFields.join(", ")}.`,
          metadata: {
            campaignId: existing.campaign_id,
            packageTier: existing.package_tier,
            changedFields,
            previousStatus: existing.status,
            nextStatus: parsed.payload.status ?? existing.status,
            previousOwnerAuthUserId: existing.owner_auth_user_id,
            nextOwnerAuthUserId: hasPatchField(parsed.payload, "ownerAuthUserId")
              ? parsed.payload.ownerAuthUserId
              : existing.owner_auth_user_id,
            previousFollowUpAt: existing.follow_up_at,
            nextFollowUpAt: hasPatchField(parsed.payload, "followUpAt")
              ? parsed.payload.followUpAt
              : existing.follow_up_at,
          },
        })
      );

    if (auditResult.error) {
      console.error("Sponsor package audit log skipped:", auditResult.error.message);
    }

    return NextResponse.json({
      ok: true,
      sponsorPackage: updateResponse.data,
      changedFields,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sponsor package update failed.",
      },
      { status: 500 }
    );
  }
}

function hasPatchField(payload: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(payload, key);
}
