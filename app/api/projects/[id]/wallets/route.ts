import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  assertProjectCommunityAccess,
  createProjectCommunityAccessErrorResponse,
} from "@/lib/community/project-community-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing for project wallet onboarding.");
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

    await assertProjectCommunityAccess(projectId);
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("project_wallets")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, wallets: data ?? [] });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Could not load project wallets."
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
          walletAddress?: string;
          label?: string;
          walletType?: string;
          isActive?: boolean;
          metadata?: Record<string, unknown>;
        }
      | null;

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const walletAddress = normalizeAddress(body?.walletAddress ?? "");
    const chain = (body?.chain ?? "evm").trim().toLowerCase();
    const label = (body?.label ?? "").trim();
    const walletType = (body?.walletType ?? "treasury").trim().toLowerCase();

    if (!walletAddress || !label) {
      return NextResponse.json(
        { ok: false, error: "Wallet address and label are required." },
        { status: 400 }
      );
    }

    await assertProjectCommunityAccess(projectId);
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("project_wallets")
      .upsert(
        {
          project_id: projectId,
          chain,
          wallet_address: walletAddress,
          label,
          wallet_type: walletType,
          is_active: body?.isActive !== false,
          metadata: body?.metadata ?? {},
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "project_id,chain,wallet_address",
        }
      )
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, wallet: data });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Could not save project wallet."
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
    const walletId = request.nextUrl.searchParams.get("walletId")?.trim();

    if (!projectId || !walletId) {
      return NextResponse.json(
        { ok: false, error: "Project id and walletId are required." },
        { status: 400 }
      );
    }

    await assertProjectCommunityAccess(projectId);
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase
      .from("project_wallets")
      .delete()
      .eq("project_id", projectId)
      .eq("id", walletId);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return createProjectCommunityAccessErrorResponse(
      error,
      "Could not delete project wallet."
    );
  }
}
