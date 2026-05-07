import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxSponsorPackageAuditPayload,
  buildLootboxSponsorPackageNoteInsertRow,
  isMissingLootboxSponsorPackageSchema,
  parseLootboxSponsorPackageNoteBody,
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const parsed = parseLootboxSponsorPackageNoteBody(body);

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
      .select("id, project_id, campaign_id, package_tier, status")
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
    const noteResponse = await admin.serviceSupabase
      .from("lootbox_sponsor_package_notes")
      .insert(
        buildLootboxSponsorPackageNoteInsertRow({
          sponsorPackageId: existing.id,
          adminAuthUserId: admin.authUserId,
          payload: parsed.payload,
        })
      )
      .select("id, sponsor_package_id, note_type, note, metadata, follow_up_at, created_by_auth_user_id, created_at")
      .single();

    if (noteResponse.error) {
      const status = isMissingLootboxSponsorPackageSchema(noteResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: noteResponse.error.message }, { status });
    }

    const auditResult = await admin.serviceSupabase
      .from("admin_audit_logs")
      .insert(
        buildLootboxSponsorPackageAuditPayload({
          adminAuthUserId: admin.authUserId,
          projectId: existing.project_id,
          sponsorPackageId: existing.id,
          action: "lootbox_sponsor_package_note_added",
          summary: `Added ${parsed.payload.noteType.replace(/_/g, " ")} note.`,
          metadata: {
            campaignId: existing.campaign_id,
            packageTier: existing.package_tier,
            packageStatus: existing.status,
            noteId: noteResponse.data.id,
            noteType: parsed.payload.noteType,
            followUpAt: parsed.payload.followUpAt,
          },
        })
      );

    if (auditResult.error) {
      console.error("Sponsor package note audit log skipped:", auditResult.error.message);
    }

    return NextResponse.json({
      ok: true,
      note: noteResponse.data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sponsor package note failed.",
      },
      { status: 500 }
    );
  }
}
