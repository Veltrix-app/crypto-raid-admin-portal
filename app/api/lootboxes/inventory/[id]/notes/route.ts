import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxInventoryNoteAuditPayload,
  parseLootboxInventoryNoteBody,
  type LootboxInventoryNoteInventoryItem,
} from "@/lib/lootboxes/lootbox-inventory-notes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const parsed = parseLootboxInventoryNoteBody(body);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing inventory item id." }, { status: 400 });
    }

    if (!parsed.ok) {
      return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
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

    if (!adminUser || adminUser.status !== "active" || adminUser.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: "Lootbox inventory notes are limited to Veltrix super admins." },
        { status: 403 }
      );
    }

    const existingResponse = await serviceSupabase
      .from("user_inventory")
      .select("id, auth_user_id, label, status")
      .eq("id", id)
      .maybeSingle();

    if (existingResponse.error) {
      return NextResponse.json({ ok: false, error: existingResponse.error.message }, { status: 500 });
    }

    if (!existingResponse.data) {
      return NextResponse.json({ ok: false, error: "Inventory item not found." }, { status: 404 });
    }

    const auditPayload = buildLootboxInventoryNoteAuditPayload({
      adminAuthUserId: user.id,
      inventoryItem: existingResponse.data as LootboxInventoryNoteInventoryItem,
      note: parsed.note,
      reference: parsed.reference,
    });
    const auditResponse = await serviceSupabase
      .from("admin_audit_logs")
      .insert(auditPayload)
      .select("id, auth_user_id, source_table, source_id, action, summary, metadata, created_at")
      .single();

    if (auditResponse.error) {
      return NextResponse.json({ ok: false, error: auditResponse.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, auditEvent: auditResponse.data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Lootbox inventory note failed.",
      },
      { status: 500 }
    );
  }
}
