import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import {
  buildLootboxActivityRead,
  type LootboxInventoryAuditRow,
  type LootboxInventoryRow,
  type LootboxOpenRow,
} from "@/lib/lootboxes/lootbox-activity";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isMissingLootboxSchema(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("lootbox_opens") ||
    message.includes("user_inventory") ||
    message.includes("could not find the table")
  );
}

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

    if (!adminUser || adminUser.status !== "active" || adminUser.role !== "super_admin") {
      return NextResponse.json(
        { ok: false, error: "Lootbox activity is limited to Veltrix super admins." },
        { status: 403 }
      );
    }

    const [opensResponse, inventoryResponse] = await Promise.all([
      serviceSupabase
        .from("lootbox_opens")
        .select(
          "id, auth_user_id, tier_id, shard_spend, pool_item_id, status, result_snapshot, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(75),
      serviceSupabase
        .from("user_inventory")
        .select(
          "id, auth_user_id, lootbox_open_id, item_type, rarity, label, payload, status, created_at, updated_at"
        )
        .order("created_at", { ascending: false })
        .limit(75),
    ]);

    if (opensResponse.error || inventoryResponse.error) {
      const error = opensResponse.error ?? inventoryResponse.error;
      const status = isMissingLootboxSchema(error) ? 409 : 500;
      return NextResponse.json(
        { ok: false, error: error?.message ?? "Lootbox activity read failed." },
        { status }
      );
    }

    const inventoryRows = (inventoryResponse.data ?? []) as LootboxInventoryRow[];
    const inventoryIds = inventoryRows.map((row) => row.id).filter(Boolean);
    let auditRows: LootboxInventoryAuditRow[] = [];

    if (inventoryIds.length > 0) {
      const auditResponse = await serviceSupabase
        .from("admin_audit_logs")
        .select("id, auth_user_id, source_table, source_id, action, summary, metadata, created_at")
        .eq("source_table", "user_inventory")
        .in("source_id", inventoryIds)
        .order("created_at", { ascending: false })
        .limit(150);

      if (auditResponse.error) {
        console.error("Lootbox inventory audit read skipped:", auditResponse.error.message);
      } else {
        auditRows = (auditResponse.data ?? []) as LootboxInventoryAuditRow[];
      }
    }

    const activity = buildLootboxActivityRead({
      openRows: (opensResponse.data ?? []) as LootboxOpenRow[],
      inventoryRows,
      auditRows,
    });

    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Lootbox activity read failed.",
      },
      { status: 500 }
    );
  }
}
