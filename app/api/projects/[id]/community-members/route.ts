import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

type ConnectedProvider = "discord" | "telegram" | "x";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const projectId = id?.trim();

    if (!projectId) {
      return NextResponse.json({ ok: false, error: "Missing project id." }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();
    const { data: reputationRows, error: reputationError } = await supabase
      .from("user_project_reputation")
      .select("auth_user_id, xp, level, trust_score, quests_completed, raids_completed", {
        count: "exact",
      })
      .eq("project_id", projectId)
      .order("xp", { ascending: false })
      .limit(250);

    if (reputationError) {
      return NextResponse.json({ ok: false, error: reputationError.message }, { status: 500 });
    }

    const authUserIds = Array.from(
      new Set(
        ((reputationRows ?? []) as Array<{ auth_user_id: string | null }>)
          .map((row) => row.auth_user_id ?? "")
          .filter(Boolean)
      )
    );

    if (authUserIds.length === 0) {
      return NextResponse.json({
        ok: true,
        summary: {
          totalContributors: 0,
          discordLinked: 0,
          telegramLinked: 0,
          xLinked: 0,
          walletVerified: 0,
          commandReady: 0,
          fullStackReady: 0,
        },
        topContributors: [],
        readinessWatch: [],
      });
    }

    const [
      { data: connectedAccounts, error: accountsError },
      { data: walletLinks, error: walletError },
      { data: profiles, error: profilesError },
    ] = await Promise.all([
      supabase
        .from("user_connected_accounts")
        .select("auth_user_id, provider, username, provider_user_id")
        .eq("status", "connected")
        .in("provider", ["discord", "telegram", "x"])
        .in("auth_user_id", authUserIds),
      supabase.from("wallet_links").select("auth_user_id").in("auth_user_id", authUserIds),
      supabase
        .from("user_profiles")
        .select("auth_user_id, username, avatar_url")
        .in("auth_user_id", authUserIds),
    ]);

    if (accountsError) {
      return NextResponse.json({ ok: false, error: accountsError.message }, { status: 500 });
    }
    if (walletError) {
      return NextResponse.json({ ok: false, error: walletError.message }, { status: 500 });
    }
    if (profilesError) {
      return NextResponse.json({ ok: false, error: profilesError.message }, { status: 500 });
    }

    const connectedByAuthUserId = new Map<string, Set<ConnectedProvider>>();
    const displayNameByAuthUserId = new Map<string, string>();

    for (const account of (connectedAccounts ?? []) as Array<{
      auth_user_id: string;
      provider: ConnectedProvider;
      username: string | null;
    }>) {
      const providers = connectedByAuthUserId.get(account.auth_user_id) ?? new Set<ConnectedProvider>();
      providers.add(account.provider);
      connectedByAuthUserId.set(account.auth_user_id, providers);

      if (account.username?.trim() && !displayNameByAuthUserId.has(account.auth_user_id)) {
        displayNameByAuthUserId.set(account.auth_user_id, account.username.trim());
      }
    }

    for (const profile of (profiles ?? []) as Array<{
      auth_user_id: string;
      username: string | null;
      avatar_url: string | null;
    }>) {
      if (profile.username?.trim() && !displayNameByAuthUserId.has(profile.auth_user_id)) {
        displayNameByAuthUserId.set(profile.auth_user_id, profile.username.trim());
      }
    }

    const walletVerifiedSet = new Set(
      ((walletLinks ?? []) as Array<{ auth_user_id: string }>).map((row) => row.auth_user_id)
    );

    const contributors = ((reputationRows ?? []) as Array<{
      auth_user_id: string;
      xp: number | null;
      level: number | null;
      trust_score: number | null;
      quests_completed: number | null;
      raids_completed: number | null;
    }>).map((row) => {
      const linkedProviders = Array.from(connectedByAuthUserId.get(row.auth_user_id) ?? []);
      const walletVerified = walletVerifiedSet.has(row.auth_user_id);
      const commandReady =
        linkedProviders.includes("discord") || linkedProviders.includes("telegram");
      const fullStackReady = commandReady && linkedProviders.includes("x") && walletVerified;

      return {
        authUserId: row.auth_user_id,
        username:
          displayNameByAuthUserId.get(row.auth_user_id) ??
          `pilot-${row.auth_user_id.slice(0, 6)}`,
        xp: Number(row.xp ?? 0),
        level: Number(row.level ?? 1),
        trust: Number(row.trust_score ?? 50),
        questsCompleted: Number(row.quests_completed ?? 0),
        raidsCompleted: Number(row.raids_completed ?? 0),
        linkedProviders,
        walletVerified,
        commandReady,
        fullStackReady,
      };
    });

    const summary = {
      totalContributors: contributors.length,
      discordLinked: contributors.filter((item) => item.linkedProviders.includes("discord")).length,
      telegramLinked: contributors.filter((item) => item.linkedProviders.includes("telegram")).length,
      xLinked: contributors.filter((item) => item.linkedProviders.includes("x")).length,
      walletVerified: contributors.filter((item) => item.walletVerified).length,
      commandReady: contributors.filter((item) => item.commandReady).length,
      fullStackReady: contributors.filter((item) => item.fullStackReady).length,
    };

    const readinessWatch = [...contributors]
      .filter((item) => !item.fullStackReady)
      .sort((left, right) => right.xp - left.xp)
      .slice(0, 6);

    return NextResponse.json({
      ok: true,
      summary,
      topContributors: contributors.slice(0, 8),
      readinessWatch,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to load community members.",
      },
      { status: 500 }
    );
  }
}
