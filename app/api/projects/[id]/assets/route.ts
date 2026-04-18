import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for project asset onboarding.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeAddress(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("project_assets")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, assets: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not load project assets.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const body = (await request.json().catch(() => null)) as
      | {
          chain?: string;
          contractAddress?: string;
          assetType?: string;
          symbol?: string;
          decimals?: number;
          isActive?: boolean;
          metadata?: Record<string, unknown>;
        }
      | null;

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const contractAddress = normalizeAddress(body?.contractAddress ?? "");
    const chain = (body?.chain ?? "evm").trim().toLowerCase();
    const assetType = (body?.assetType ?? "token").trim().toLowerCase();
    const symbol = (body?.symbol ?? "").trim().toUpperCase();

    if (!contractAddress || !symbol) {
      return NextResponse.json(
        { ok: false, error: "Contract address and symbol are required." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("project_assets")
      .upsert(
        {
          project_id: projectId,
          chain,
          contract_address: contractAddress,
          asset_type: assetType,
          symbol,
          decimals:
            typeof body?.decimals === "number" && Number.isFinite(body.decimals)
              ? body.decimals
              : 18,
          is_active: body?.isActive !== false,
          metadata: body?.metadata ?? {},
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "project_id,chain,contract_address",
        }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, asset: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not save project asset.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();
    const assetId = request.nextUrl.searchParams.get("assetId")?.trim();

    if (!projectId || !assetId) {
      return NextResponse.json(
        { ok: false, error: "Project id and assetId are required." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();
    const { error } = await supabase
      .from("project_assets")
      .delete()
      .eq("project_id", projectId)
      .eq("id", assetId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not delete project asset.",
      },
      { status: 500 }
    );
  }
}
