import { NextResponse } from "next/server";
import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import { createClient } from "@/lib/supabase/server";
import {
  buildDefiXpReviewRead,
  type DefiXpReviewEventInput,
  type DefiXpReviewProfileInput,
  type DefiXpReviewReputationInput,
} from "@/lib/xp/defi-xp-review";

type XpEventRow = {
  id: string;
  auth_user_id: string | null;
  source_type: string | null;
  source_ref: string | null;
  effective_xp: number | string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

type ProfileRow = {
  auth_user_id: string | null;
  username: string | null;
  wallet: string | null;
};

type ReputationRow = {
  auth_user_id: string | null;
  total_xp: number | null;
  level: number | null;
  trust_score: number | null;
  sybil_score: number | null;
  status: string | null;
};

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "You must be signed in to review XP events." },
        { status: 401 }
      );
    }

    const serviceSupabase = getAccountsServiceClient();
    const { data: eventRows, error: eventError } = await serviceSupabase
      .from("xp_events")
      .select("id, auth_user_id, source_type, source_ref, effective_xp, metadata, created_at")
      .eq("source_type", "defi_mission")
      .order("created_at", { ascending: false })
      .limit(100);

    if (eventError) {
      throw new Error(eventError.message || "Failed to load DeFi XP events.");
    }

    const events = ((eventRows ?? []) as XpEventRow[]).map(
      (row): DefiXpReviewEventInput => ({
        id: row.id,
        authUserId: row.auth_user_id,
        sourceType: row.source_type,
        sourceRef: row.source_ref,
        effectiveXp: Number(row.effective_xp ?? 0),
        metadata: row.metadata ?? {},
        createdAt: row.created_at,
      })
    );
    const authUserIds = Array.from(
      new Set(events.map((event) => event.authUserId).filter((id): id is string => Boolean(id)))
    );

    const [profilesResponse, reputationsResponse] =
      authUserIds.length > 0
        ? await Promise.all([
            serviceSupabase
              .from("user_profiles")
              .select("auth_user_id, username, wallet")
              .in("auth_user_id", authUserIds),
            serviceSupabase
              .from("user_global_reputation")
              .select("auth_user_id, total_xp, level, trust_score, sybil_score, status")
              .in("auth_user_id", authUserIds),
          ])
        : [
            { data: [] as ProfileRow[], error: null },
            { data: [] as ReputationRow[], error: null },
          ];

    if (profilesResponse.error) {
      throw new Error(profilesResponse.error.message || "Failed to load XP user profiles.");
    }

    if (reputationsResponse.error) {
      throw new Error(
        reputationsResponse.error.message || "Failed to load XP user reputation."
      );
    }

    const review = buildDefiXpReviewRead({
      events,
      profiles: ((profilesResponse.data ?? []) as ProfileRow[]).map(
        (row): DefiXpReviewProfileInput => ({
          authUserId: row.auth_user_id,
          username: row.username,
          wallet: row.wallet,
        })
      ),
      reputations: ((reputationsResponse.data ?? []) as ReputationRow[]).map(
        (row): DefiXpReviewReputationInput => ({
          authUserId: row.auth_user_id,
          totalXp: row.total_xp,
          level: row.level,
          trustScore: row.trust_score,
          sybilScore: row.sybil_score,
          status: row.status,
        })
      ),
    });

    return NextResponse.json(
      { ok: true, review },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load DeFi XP review.",
      },
      { status: 500 }
    );
  }
}
