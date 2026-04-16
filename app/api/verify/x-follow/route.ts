import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveQuestIntegration } from "@/lib/quest-integration";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function getSupabaseClient(accessToken: string) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Missing bearer token." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const questId = typeof body?.questId === "string" ? body.questId : "";

  if (!questId) {
    return NextResponse.json({ ok: false, error: "Missing questId." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseClient(accessToken);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session." }, { status: 401 });
    }

    const { data: quest, error: questError } = await supabase
      .from("quests")
      .select(
        "id, title, project_id, action_url, quest_type, verification_type, verification_provider, completion_mode, verification_config"
      )
      .eq("id", questId)
      .single();

    if (questError || !quest) {
      return NextResponse.json({ ok: false, error: "Quest not found." }, { status: 404 });
    }

    const resolvedIntegration = resolveQuestIntegration(quest);

    if (
      resolvedIntegration.questType !== "social_follow" ||
      resolvedIntegration.verificationProvider !== "x" ||
      resolvedIntegration.completionMode !== "integration_auto"
    ) {
      return NextResponse.json(
        { ok: false, error: "Quest is not configured for X follow verification." },
        { status: 400 }
      );
    }

    const verificationConfig = resolvedIntegration.verificationConfig;
    const profileUrl =
      typeof verificationConfig.profileUrl === "string" && verificationConfig.profileUrl.trim()
        ? verificationConfig.profileUrl.trim()
        : typeof quest.action_url === "string"
        ? quest.action_url.trim()
        : "";
    const handle =
      typeof verificationConfig.handle === "string" && verificationConfig.handle.trim()
        ? verificationConfig.handle.trim()
        : "";

    if (!profileUrl || !isValidUrl(profileUrl)) {
      return NextResponse.json(
        { ok: false, error: "X profile URL is missing or invalid." },
        { status: 400 }
      );
    }

    const [{ data: connectedAccount }, { data: projectIntegration }] = await Promise.all([
      supabase
        .from("user_connected_accounts")
        .select("id, provider, status, username")
        .eq("auth_user_id", user.id)
        .eq("provider", "x")
        .eq("status", "connected")
        .maybeSingle(),
      supabase
        .from("project_integrations")
        .select("id, provider, status, config")
        .eq("project_id", quest.project_id)
        .eq("provider", "x")
        .maybeSingle(),
    ]);

    if (!connectedAccount) {
      return NextResponse.json(
        {
          ok: false,
          status: "needs_account_link",
          error: "Link an X account before Veltrix can verify this quest automatically.",
        },
        { status: 400 }
      );
    }

    if (!projectIntegration || projectIntegration.status !== "connected") {
      return NextResponse.json(
        {
          ok: false,
          status: "needs_project_integration",
          error: "This project still needs an active X integration before follow verification can run.",
        },
        { status: 400 }
      );
    }

    const eventType =
      typeof verificationConfig.eventType === "string" && verificationConfig.eventType.trim()
        ? verificationConfig.eventType.trim()
        : "x_follow_confirmed";
    const now = new Date().toISOString();

    const { error: eventError } = await supabase.from("verification_events").insert({
      auth_user_id: user.id,
      project_id: quest.project_id ?? null,
      quest_id: quest.id,
      provider: "x",
      event_type: "x_follow_requested",
      external_ref: profileUrl,
      metadata: {
        profileUrl,
        handle,
        accountUsername: connectedAccount.username ?? null,
        expectedEventType: eventType,
        source: "mobile_app",
      },
    });

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message || "Failed to create X verification event." },
        { status: 500 }
      );
    }

    const { error: verificationRunError } = await supabase.from("quest_verification_runs").insert({
      auth_user_id: user.id,
      project_id: quest.project_id ?? null,
      quest_id: quest.id,
      provider: "x",
      result: "pending",
      reason: "X follow verification requested and waiting for integration confirmation.",
      metadata: {
        profileUrl,
        handle,
        projectIntegrationId: projectIntegration.id,
        accountUsername: connectedAccount.username ?? null,
      },
    });

    if (verificationRunError) {
      return NextResponse.json(
        { ok: false, error: verificationRunError.message || "Failed to create verification run." },
        { status: 500 }
      );
    }

    const { data: existingSubmission } = await supabase
      .from("quest_submissions")
      .select("id")
      .eq("auth_user_id", user.id)
      .eq("quest_id", quest.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingSubmission?.id) {
      await supabase.from("quest_submissions").insert({
        auth_user_id: user.id,
        quest_id: quest.id,
        status: "pending",
        proof_text: "x_follow_requested",
      });
    }

    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("id, quest_statuses")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userProgress?.id) {
      const nextQuestStatuses =
        userProgress.quest_statuses && typeof userProgress.quest_statuses === "object"
          ? { ...(userProgress.quest_statuses as Record<string, string>), [quest.id]: "pending" }
          : { [quest.id]: "pending" };

      await supabase
        .from("user_progress")
        .update({
          quest_statuses: nextQuestStatuses,
          updated_at: now,
        })
        .eq("id", userProgress.id);
    }

    await supabase.from("app_notifications").insert({
      auth_user_id: user.id,
      title: "X verification started",
      body: `${quest.title} is now waiting for follow confirmation.`,
      type: "quest",
      read: false,
      metadata: {
        questId: quest.id,
        provider: "x",
        profileUrl,
        handle,
      },
    });

    return NextResponse.json({
      ok: true,
      status: "pending",
      questId: quest.id,
      targetUrl: profileUrl,
      message: "X follow verification request created. Follow confirmation is still pending.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "X verification failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
