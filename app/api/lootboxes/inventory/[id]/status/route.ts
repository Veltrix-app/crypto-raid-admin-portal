import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxInventoryStatusPatch,
  getLootboxInventoryStatusActionLabel,
  isLootboxInventoryStatus,
} from "@/lib/lootboxes/lootbox-inventory-actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type InventoryRow = {
  id: string;
  auth_user_id: string;
  label: string;
  status: string | null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing inventory item id." }, { status: 400 });
    }

    if (!isLootboxInventoryStatus(body?.status)) {
      return NextResponse.json({ ok: false, error: "Invalid inventory status." }, { status: 400 });
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
        { ok: false, error: "Lootbox inventory actions are limited to Veltrix super admins." },
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

    const existing = existingResponse.data as InventoryRow;
    const patch = buildLootboxInventoryStatusPatch({ status: body.status });
    const updateResponse = await serviceSupabase
      .from("user_inventory")
      .update(patch)
      .eq("id", existing.id)
      .select("id, auth_user_id, item_type, rarity, label, payload, status, created_at, updated_at")
      .single();

    if (updateResponse.error) {
      return NextResponse.json({ ok: false, error: updateResponse.error.message }, { status: 500 });
    }

    const auditResult = await serviceSupabase.from("admin_audit_logs").insert({
      auth_user_id: user.id,
      project_id: null,
      source_table: "user_inventory",
      source_id: existing.id,
      action: "lootbox_inventory_status_changed",
      summary: `${getLootboxInventoryStatusActionLabel(body.status)} for ${existing.label}.`,
      metadata: {
        inventoryItemId: existing.id,
        targetAuthUserId: existing.auth_user_id,
        previousStatus: existing.status,
        nextStatus: body.status,
      },
    });

    if (auditResult.error) {
      console.error("Lootbox inventory audit log skipped:", auditResult.error.message);
    }

    return NextResponse.json({
      ok: true,
      inventoryItem: updateResponse.data,
      previousStatus: existing.status,
      nextStatus: body.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Lootbox inventory action failed.",
      },
      { status: 500 }
    );
  }
}
