import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxSponsorActivationRunSignoffMetadataPatch,
  buildLootboxSponsorActivationRunSignoffRequest,
  type LootboxSponsorPackageDetailPackageRow,
} from "@/lib/lootboxes/lootbox-sponsored-package-operator";
import {
  buildLootboxSponsorPackageAuditPayload,
  buildLootboxSponsorPackageNoteInsertRow,
  isMissingLootboxSponsorPackageSchema,
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing sponsor package id." }, { status: 400 });
    }

    const admin = await getSponsorPackageAdmin();
    if (!admin.ok) {
      return admin.response;
    }

    const packageResponse = await admin.serviceSupabase
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
      .eq("id", id)
      .maybeSingle();

    if (packageResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(packageResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: packageResponse.error.message }, { status });
    }

    if (!packageResponse.data) {
      return NextResponse.json({ ok: false, error: "Sponsor package not found." }, { status: 404 });
    }

    const packageRow = packageResponse.data as unknown as LootboxSponsorPackageDetailPackageRow;
    const signoffRequest = buildLootboxSponsorActivationRunSignoffRequest({
      packageRow,
      outcome: typeof body?.outcome === "string" ? body.outcome : "",
      note: typeof body?.note === "string" ? body.note : null,
      followUpAt: typeof body?.followUpAt === "string" ? body.followUpAt : null,
      adminAuthUserId: admin.authUserId,
    });

    if (!signoffRequest.ok) {
      const status = signoffRequest.error.includes("Stage an activation run") ? 409 : 400;
      return NextResponse.json({ ok: false, error: signoffRequest.error }, { status });
    }

    const noteResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_package_notes")
      .insert(
        buildLootboxSponsorPackageNoteInsertRow({
          sponsorPackageId: packageRow.id,
          adminAuthUserId: admin.authUserId,
          payload: signoffRequest.notePayload,
        })
      )
      .select("id, sponsor_package_id, note_type, note, metadata, follow_up_at, created_by_auth_user_id, created_at")
      .single();

    if (noteResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(noteResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: noteResponse.error.message }, { status });
    }

    const metadataUpdate = await admin.serviceSupabase
      .from("lootbox_sponsor_packages")
      .update({
        metadata: buildLootboxSponsorActivationRunSignoffMetadataPatch({
          existingMetadata: packageRow.metadata,
          signoff: signoffRequest.signoff,
          noteId: noteResponse.data.id,
        }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", packageRow.id);

    const auditResult = await admin.serviceSupabase
      .from("admin_audit_logs")
      .insert(
        buildLootboxSponsorPackageAuditPayload({
          adminAuthUserId: admin.authUserId,
          projectId: packageRow.project_id,
          sponsorPackageId: packageRow.id,
          action: signoffRequest.audit.action,
          summary: signoffRequest.audit.summary,
          metadata: {
            ...signoffRequest.audit.metadata,
            noteId: noteResponse.data.id,
            packageTier: packageRow.package_tier,
            packageStatus: packageRow.status,
          },
        })
      );

    if (auditResult.error) {
      console.error("Sponsor activation run signoff audit log skipped:", auditResult.error.message);
    }

    return NextResponse.json({
      ok: true,
      signoff: {
        ...signoffRequest.signoff,
        noteId: noteResponse.data.id,
      },
      note: noteResponse.data,
      metadataUpdated: !metadataUpdate.error,
      warning: metadataUpdate.error
        ? `Activation run signoff saved, but package metadata refresh failed: ${metadataUpdate.error.message}`
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sponsor activation run signoff failed.",
      },
      { status: 500 }
    );
  }
}
