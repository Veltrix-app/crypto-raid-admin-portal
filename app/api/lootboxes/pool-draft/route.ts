import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import { buildLootboxPoolPersistencePayload } from "@/lib/lootboxes/lootbox-pool-persistence";
import { buildLootboxStockSafetyRead } from "@/lib/lootboxes/lootbox-stock-safety";
import {
  LOOTBOX_STUDIO_TIERS,
  type LootboxStudioTierId,
} from "@/lib/lootboxes/lootbox-studio-catalog";
import { createClient } from "@/lib/supabase/server";
import type { LootboxPoolDraftRow } from "@/lib/lootboxes/lootbox-pool-draft";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ExistingPoolRow = {
  id: string;
  label: string;
  item_type: string;
};

type PoolStockRow = {
  active: boolean | null;
  unlimited_stock: boolean | null;
  stock: number | null;
};

function isLootboxStudioTierId(value: unknown): value is LootboxStudioTierId {
  return typeof value === "string" && LOOTBOX_STUDIO_TIERS.some((tier) => tier.id === value);
}

function isMissingLootboxSchema(error: { message?: string } | null | undefined) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    message.includes("lootbox_pool_items") ||
    message.includes("lootbox_tiers") ||
    message.includes("could not find the table")
  );
}

function getPoolRowKey(row: Pick<ExistingPoolRow, "label" | "item_type">) {
  return `${row.label}::${row.item_type}`;
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
        { ok: false, error: "Lootbox pool controls are limited to Veltrix super admins." },
        { status: 403 }
      );
    }

    const poolRowsResponse = await serviceSupabase
      .from("lootbox_pool_items")
      .select("active, unlimited_stock, stock");

    if (poolRowsResponse.error) {
      const status = isMissingLootboxSchema(poolRowsResponse.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: poolRowsResponse.error.message }, { status });
    }

    const [reserveRpcReady, restoreRpcReady] = await Promise.all([
      checkPoolStockRpc(serviceSupabase, "reserve_lootbox_pool_item_stock"),
      checkPoolStockRpc(serviceSupabase, "restore_lootbox_pool_item_stock"),
    ]);
    const rows = (poolRowsResponse.data ?? []) as PoolStockRow[];
    const finiteRows = rows.filter(
      (row) => row.unlimited_stock === false && row.stock !== null
    );
    const stockSafety = buildLootboxStockSafetyRead({
      reserveRpcReady,
      restoreRpcReady,
      totalOutcomes: rows.length,
      activeOutcomes: rows.filter((row) => row.active === true).length,
      finiteStockOutcomes: finiteRows.length,
      finiteActiveOutcomes: finiteRows.filter((row) => row.active === true).length,
    });

    return NextResponse.json({ ok: true, stockSafety });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Lootbox stock safety read failed.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { ok: false, error: "Lootbox pool controls are limited to Veltrix super admins." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { tierId?: unknown; rows?: unknown }
      | null;

    if (!isLootboxStudioTierId(body?.tierId)) {
      return NextResponse.json({ ok: false, error: "Unsupported lootbox tier." }, { status: 400 });
    }

    if (!Array.isArray(body?.rows)) {
      return NextResponse.json({ ok: false, error: "Missing lootbox pool rows." }, { status: 400 });
    }

    const payload = buildLootboxPoolPersistencePayload({
      tierId: body.tierId,
      rows: body.rows as LootboxPoolDraftRow[],
    });

    const existingRowsResponse = await serviceSupabase
      .from("lootbox_pool_items")
      .select("id, label, item_type")
      .eq("tier_id", payload.tierId);

    if (existingRowsResponse.error) {
      const status = isMissingLootboxSchema(existingRowsResponse.error) ? 409 : 500;
      return NextResponse.json(
        { ok: false, error: existingRowsResponse.error.message },
        { status }
      );
    }

    const existingRows = (existingRowsResponse.data ?? []) as ExistingPoolRow[];
    const existingKeys = new Set(existingRows.map(getPoolRowKey));
    const missingRows = payload.rows.filter(
      (row) => !existingKeys.has(`${row.label}::${row.itemType}`)
    );

    if (missingRows.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Some reward outcomes are not seeded in Supabase yet.",
          missingRows: missingRows.map((row) => ({
            label: row.label,
            itemType: row.itemType,
          })),
        },
        { status: 409 }
      );
    }

    const timestamp = new Date().toISOString();
    const tierUpdate = await serviceSupabase
      .from("lootbox_tiers")
      .update({
        odds: payload.odds,
        updated_at: timestamp,
      })
      .eq("id", payload.tierId);

    if (tierUpdate.error) {
      const status = isMissingLootboxSchema(tierUpdate.error) ? 409 : 500;
      return NextResponse.json({ ok: false, error: tierUpdate.error.message }, { status });
    }

    const rowUpdates = await Promise.all(
      payload.rows.map((row) =>
        serviceSupabase
          .from("lootbox_pool_items")
          .update({
            rarity: row.rarity,
            weight: row.weight,
            active: row.active,
            unlimited_stock: row.unlimitedStock,
            stock: row.stock,
            updated_at: timestamp,
          })
          .eq("tier_id", row.tierId)
          .eq("label", row.label)
          .eq("item_type", row.itemType)
      )
    );
    const failedUpdate = rowUpdates.find((result) => result.error);

    if (failedUpdate?.error) {
      return NextResponse.json({ ok: false, error: failedUpdate.error.message }, { status: 500 });
    }

    const auditResult = await serviceSupabase.from("admin_audit_logs").insert({
      auth_user_id: user.id,
      project_id: null,
      source_table: "lootbox_pool_items",
      source_id: payload.tierId,
      action: "pool_draft_saved",
      summary: `Saved ${payload.tierId} lootbox reward pool controls.`,
      metadata: {
        tierId: payload.tierId,
        odds: payload.odds,
        rows: payload.rows.map((row) => ({
          label: row.label,
          itemType: row.itemType,
          rarity: row.rarity,
          weight: row.weight,
          active: row.active,
          unlimitedStock: row.unlimitedStock,
          stock: row.stock,
        })),
      },
    });

    if (auditResult.error) {
      console.error("Lootbox pool audit log skipped:", auditResult.error.message);
    }

    return NextResponse.json({
      ok: true,
      tierId: payload.tierId,
      updatedRows: payload.rows.length,
      odds: payload.odds,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Lootbox pool draft save failed.",
      },
      { status: 500 }
    );
  }
}

async function checkPoolStockRpc(
  serviceSupabase: ReturnType<typeof getServiceSupabaseClient>,
  rpcName: "reserve_lootbox_pool_item_stock" | "restore_lootbox_pool_item_stock"
) {
  const { error } = await serviceSupabase.rpc(rpcName, {
    p_pool_item_id: crypto.randomUUID(),
  });

  return !error;
}
