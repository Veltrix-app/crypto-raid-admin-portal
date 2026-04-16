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
      resolvedIntegration.questType !== "url_visit" ||
      resolvedIntegration.verificationProvider !== "website" ||
      resolvedIntegration.completionMode !== "integration_auto"
    ) {
      return NextResponse.json(
        { ok: false, error: "Quest is not configured for website auto verification." },
        { status: 400 }
      );
    }

    const verificationConfig = resolvedIntegration.verificationConfig;
    const targetUrl =
      typeof verificationConfig.targetUrl === "string" && verificationConfig.targetUrl.trim()
        ? verificationConfig.targetUrl.trim()
        : typeof quest.action_url === "string"
        ? quest.action_url.trim()
        : "";

    if (!targetUrl || !isValidUrl(targetUrl)) {
      return NextResponse.json(
        { ok: false, error: "Quest target URL is missing or invalid." },
        { status: 400 }
      );
    }

    const eventType =
      typeof verificationConfig.eventType === "string" && verificationConfig.eventType.trim()
        ? verificationConfig.eventType.trim()
        : "website_visit_confirmed";

    const now = new Date().toISOString();

    const { error: eventError } = await supabase.from("verification_events").insert({
      auth_user_id: user.id,
      project_id: quest.project_id ?? null,
      quest_id: quest.id,
      provider: "website",
      event_type: eventType,
      external_ref: targetUrl,
      metadata: {
        targetUrl,
        source: "mobile_app",
      },
    });

    if (eventError) {
      return NextResponse.json(
        { ok: false, error: eventError.message || "Failed to write verification event." },
        { status: 500 }
      );
    }

    const { data: existingSubmission } = await supabase
      .from("quest_submissions")
      .select("id, status")
      .eq("auth_user_id", user.id)
      .eq("quest_id", quest.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let submissionId = existingSubmission?.id ?? null;

    if (existingSubmission?.id) {
      const { error: updateSubmissionError } = await supabase
        .from("quest_submissions")
        .update({
          status: "approved",
          proof_text: `website_visit_confirmed:${targetUrl}`,
          updated_at: now,
        })
        .eq("id", existingSubmission.id);

      if (updateSubmissionError) {
        return NextResponse.json(
          { ok: false, error: updateSubmissionError.message || "Failed to update submission." },
          { status: 500 }
        );
      }
    } else {
      const { data: createdSubmission, error: createSubmissionError } = await supabase
        .from("quest_submissions")
        .insert({
          auth_user_id: user.id,
          quest_id: quest.id,
          status: "approved",
          proof_text: `website_visit_confirmed:${targetUrl}`,
        })
        .select("id")
        .single();

      if (createSubmissionError || !createdSubmission) {
        return NextResponse.json(
          { ok: false, error: createSubmissionError?.message || "Failed to create submission." },
          { status: 500 }
        );
      }

      submissionId = createdSubmission.id;
    }

    if (!submissionId) {
      return NextResponse.json(
        { ok: false, error: "No submission id available for verification result." },
        { status: 500 }
      );
    }

    await supabase.from("verification_results").insert({
      auth_user_id: user.id,
      project_id: quest.project_id ?? null,
      quest_id: quest.id,
      source_table: "quest_submissions",
      source_id: submissionId,
      verification_type: "event_check",
      route: "integration_auto",
      decision_status: "approved",
      decision_reason: "Tracked website visit was confirmed by the verification endpoint.",
      confidence_score: 94,
      required_config_keys: ["targetUrl", "integrationProvider", "eventType"],
      missing_config_keys: [],
      duplicate_signal_types: [],
      metadata: {
        questTitle: quest.title,
        provider: "website",
        targetUrl,
        eventType,
      },
    });

    const { data: userProgress } = await supabase
      .from("user_progress")
      .select("id, quest_statuses")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userProgress?.id) {
      const nextQuestStatuses =
        userProgress.quest_statuses && typeof userProgress.quest_statuses === "object"
          ? { ...(userProgress.quest_statuses as Record<string, string>), [quest.id]: "approved" }
          : { [quest.id]: "approved" };

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
      title: "Quest auto-approved",
      body: `${quest.title} completed automatically after Veltrix confirmed the website visit.`,
      type: "quest",
      read: false,
      source_table: "quest_submissions",
      source_id: submissionId,
      metadata: {
        questId: quest.id,
        provider: "website",
        targetUrl,
      },
    });

    return NextResponse.json({
      ok: true,
      status: "approved",
      questId: quest.id,
      targetUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
