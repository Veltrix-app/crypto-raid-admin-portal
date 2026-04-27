import {
  buildCommunityEntityUrl,
  getDefaultCommunityArtwork,
  getServiceSupabaseClient,
  sendProjectCommunityMessage,
  writeProjectCommunityAuditLog,
} from "@/lib/community/project-community-ops";

export type TweetToRaidSourceMode = "review" | "auto_live";
export type TweetToRaidSourceStatus = "active" | "paused" | "blocked";
export type TweetToRaidCandidateStatus = "pending" | "approved" | "rejected" | "expired";

export type TweetToRaidSourceRow = {
  id: string;
  project_id: string;
  integration_id: string | null;
  x_account_id: string | null;
  x_username: string;
  mode: TweetToRaidSourceMode;
  status: TweetToRaidSourceStatus;
  required_hashtags: string[] | null;
  exclude_replies: boolean | null;
  exclude_reposts: boolean | null;
  cooldown_minutes: number | null;
  max_raids_per_day: number | null;
  default_reward_xp: number | null;
  default_duration_minutes: number | null;
  default_campaign_id: string | null;
  default_button_label: string | null;
  default_artwork_url: string | null;
  metadata: Record<string, unknown> | null;
  last_event_at: string | null;
  last_raid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TweetToRaidCandidateRow = {
  id: string;
  project_id: string;
  source_event_id: string | null;
  status: TweetToRaidCandidateStatus;
  title: string;
  short_description: string | null;
  tweet_url: string | null;
  banner: string | null;
  reward_xp: number;
  starts_at: string;
  ends_at: string;
  approved_by_auth_user_id: string | null;
  approved_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
};

export type TweetToRaidEventRow = {
  id: string;
  project_id: string;
  source_id: string | null;
  x_post_id: string;
  x_author_id: string | null;
  x_username: string;
  post_url: string | null;
  text: string;
  media_urls: string[] | null;
  received_at: string;
  decision: "created_raid" | "created_candidate" | "skipped" | "failed";
  decision_reason: string;
  raid_id: string | null;
  candidate_id: string | null;
  delivery_metadata: Record<string, unknown> | null;
  raw_payload?: Record<string, unknown> | null;
  created_at: string;
};

export type GeneratedTweetRaidRow = {
  id: string;
  title: string;
  short_description: string | null;
  reward_xp: number | null;
  status: string;
  source_url: string | null;
  source_external_id: string | null;
  source_event_id: string | null;
  ends_at: string | null;
  created_at: string;
  delivery_metadata: Record<string, unknown> | null;
};

export type TweetToRaidAutopilotState = {
  botConfigured: boolean;
  jobSecretConfigured: boolean;
  sources: TweetToRaidSourceRow[];
  candidates: TweetToRaidCandidateRow[];
  events: TweetToRaidEventRow[];
  raids: GeneratedTweetRaidRow[];
};

type ManualTweetToRaidPostInput = {
  tweetUrl: string;
  fallbackUsername: string;
  text: string;
  mediaUrlsText?: string;
};

type ManualTweetToRaidPost = {
  id: string;
  username: string;
  text: string;
  url: string;
  mediaUrls: string[];
  isReply: boolean;
  isRepost: boolean;
};

type ProjectSummary = {
  id: string;
  name: string | null;
  banner_url: string | null;
  logo: string | null;
  brand_accent: string | null;
};

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : fallback;

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
}

export function normalizeTweetToRaidUsername(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function parseTweetToRaidHashtags(value: string) {
  const tags = value
    .split(/[\s,]+/)
    .map((item) => item.trim().replace(/^#+/, "").toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(tags));
}

export function parseTweetToRaidPostUrl(value: string) {
  const trimmed = value.trim();

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (hostname !== "x.com" && hostname !== "twitter.com") {
      return null;
    }

    const [, username, statusSegment, postId] = parsed.pathname.split("/");
    if (!username || statusSegment !== "status" || !postId) {
      return null;
    }

    return {
      postId,
      username: normalizeTweetToRaidUsername(username),
      url: trimmed,
    };
  } catch {
    return null;
  }
}

export function buildManualTweetToRaidPost(input: ManualTweetToRaidPostInput): ManualTweetToRaidPost {
  const parsedUrl = parseTweetToRaidPostUrl(input.tweetUrl);
  const username = parsedUrl?.username || normalizeTweetToRaidUsername(input.fallbackUsername);
  const text = input.text.replace(/\s+/g, " ").trim();

  if (!parsedUrl?.postId) {
    throw new Error("Use a valid X/Twitter status URL for the manual ingest test.");
  }

  if (!username) {
    throw new Error("Add an X username before running the manual ingest test.");
  }

  if (!text) {
    throw new Error("Add the tweet text so the raid draft can be generated safely.");
  }

  const mediaUrls = (input.mediaUrlsText ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));

  return {
    id: parsedUrl.postId,
    username,
    text,
    url: parsedUrl.url,
    mediaUrls,
    isReply: false,
    isRepost: false,
  };
}

export function buildTweetToRaidSourcePayload(
  projectId: string,
  body: Record<string, unknown>
) {
  const xUsername = normalizeTweetToRaidUsername(readString(body.xUsername));
  const mode = body.mode === "auto_live" ? "auto_live" : "review";
  const status =
    body.status === "active" || body.status === "blocked" || body.status === "paused"
      ? body.status
      : "paused";

  if (!xUsername) {
    throw new Error("Add the project X username before saving Tweet-to-Raid Autopilot.");
  }

  return {
    project_id: projectId,
    integration_id: readString(body.integrationId) || null,
    x_account_id: readString(body.xAccountId) || null,
    x_username: xUsername,
    mode,
    status,
    required_hashtags: parseTweetToRaidHashtags(readString(body.requiredHashtags)),
    exclude_replies: readBoolean(body.excludeReplies, true),
    exclude_reposts: readBoolean(body.excludeReposts, true),
    cooldown_minutes: clampNumber(body.cooldownMinutes, 30, 0, 1440),
    max_raids_per_day: clampNumber(body.maxRaidsPerDay, 6, 1, 48),
    default_reward_xp: clampNumber(body.defaultRewardXp, 50, 10, 100),
    default_duration_minutes: clampNumber(body.defaultDurationMinutes, 1440, 15, 10080),
    default_campaign_id: readString(body.defaultCampaignId) || null,
    default_button_label: readString(body.defaultButtonLabel) || "Open raid",
    default_artwork_url: readString(body.defaultArtworkUrl) || null,
    updated_at: new Date().toISOString(),
  };
}

export async function loadTweetToRaidAutopilotState(
  projectId: string
): Promise<TweetToRaidAutopilotState> {
  const supabase = getServiceSupabaseClient();
  const [{ data: sources, error: sourcesError }, { data: candidates, error: candidatesError }, { data: events, error: eventsError }, { data: raids, error: raidsError }] =
    await Promise.all([
      supabase
        .from("x_raid_sources")
        .select(
          "id, project_id, integration_id, x_account_id, x_username, mode, status, required_hashtags, exclude_replies, exclude_reposts, cooldown_minutes, max_raids_per_day, default_reward_xp, default_duration_minutes, default_campaign_id, default_button_label, default_artwork_url, metadata, last_event_at, last_raid_at, created_at, updated_at"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("raid_generation_candidates")
        .select(
          "id, project_id, source_event_id, status, title, short_description, tweet_url, banner, reward_xp, starts_at, ends_at, approved_by_auth_user_id, approved_at, metadata, created_at, updated_at"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(12),
      supabase
        .from("x_raid_ingest_events")
        .select(
          "id, project_id, source_id, x_post_id, x_author_id, x_username, post_url, text, media_urls, received_at, decision, decision_reason, raid_id, candidate_id, delivery_metadata, created_at"
        )
        .eq("project_id", projectId)
        .order("received_at", { ascending: false })
        .limit(12),
      supabase
        .from("raids")
        .select(
          "id, title, short_description, reward_xp, status, source_url, source_external_id, source_event_id, ends_at, created_at, delivery_metadata"
        )
        .eq("project_id", projectId)
        .eq("generated_by", "tweet_to_raid")
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  if (sourcesError) throw new Error(sourcesError.message);
  if (candidatesError) throw new Error(candidatesError.message);
  if (eventsError) throw new Error(eventsError.message);
  if (raidsError) throw new Error(raidsError.message);

  return {
    botConfigured: Boolean(process.env.COMMUNITY_BOT_URL),
    jobSecretConfigured: Boolean(
      process.env.COMMUNITY_RETRY_JOB_SECRET || process.env.COMMUNITY_BOT_WEBHOOK_SECRET
    ),
    sources: (sources ?? []) as TweetToRaidSourceRow[],
    candidates: (candidates ?? []) as TweetToRaidCandidateRow[],
    events: (events ?? []) as TweetToRaidEventRow[],
    raids: (raids ?? []) as GeneratedTweetRaidRow[],
  };
}

export async function saveTweetToRaidSource(
  projectId: string,
  body: Record<string, unknown>
) {
  const supabase = getServiceSupabaseClient();
  const sourceId = readString(body.sourceId);
  const payload = buildTweetToRaidSourcePayload(projectId, body);

  if (sourceId) {
    const { data, error } = await supabase
      .from("x_raid_sources")
      .update(payload)
      .eq("project_id", projectId)
      .eq("id", sourceId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as TweetToRaidSourceRow;
  }

  const { data: existing, error: existingError } = await supabase
    .from("x_raid_sources")
    .select("id")
    .eq("project_id", projectId)
    .ilike("x_username", payload.x_username)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  if (existing?.id) {
    const { data, error } = await supabase
      .from("x_raid_sources")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as TweetToRaidSourceRow;
  }

  const { data, error } = await supabase
    .from("x_raid_sources")
    .insert({ ...payload, created_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as TweetToRaidSourceRow;
}

export async function runManualTweetToRaidIngest(
  projectId: string,
  body: Record<string, unknown>
) {
  const communityBotUrl = process.env.COMMUNITY_BOT_URL;
  if (!communityBotUrl) {
    throw new Error("COMMUNITY_BOT_URL is missing on the portal deployment.");
  }

  const post = buildManualTweetToRaidPost({
    tweetUrl: readString(body.tweetUrl),
    fallbackUsername: readString(body.fallbackUsername),
    text: readString(body.text),
    mediaUrlsText: readString(body.mediaUrlsText),
  });
  const sourceId = readString(body.sourceId);
  const forceMode = body.forceMode === "auto_live" ? "auto_live" : "review";
  const response = await fetch(`${communityBotUrl.replace(/\/+$/, "")}/jobs/ingest-x-raid-post`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.COMMUNITY_RETRY_JOB_SECRET || process.env.COMMUNITY_BOT_WEBHOOK_SECRET
        ? {
            "x-community-job-secret":
              process.env.COMMUNITY_RETRY_JOB_SECRET || process.env.COMMUNITY_BOT_WEBHOOK_SECRET || "",
          }
        : {}),
    },
    body: JSON.stringify({
      projectId,
      sourceId: sourceId || undefined,
      forceMode,
      post,
    }),
    cache: "no-store",
  });

  const result = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    throw new Error(
      typeof result?.error === "string" ? result.error : "Tweet-to-Raid ingest job failed."
    );
  }

  return result ?? { ok: true };
}

export async function approveTweetToRaidCandidate(params: {
  projectId: string;
  candidateId: string;
  authUserId: string;
}) {
  const supabase = getServiceSupabaseClient();
  const [{ data: project, error: projectError }, { data: candidate, error: candidateError }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, banner_url, logo, brand_accent")
        .eq("id", params.projectId)
        .maybeSingle(),
      supabase
        .from("raid_generation_candidates")
        .select("*")
        .eq("project_id", params.projectId)
        .eq("id", params.candidateId)
        .maybeSingle(),
    ]);

  if (projectError) throw new Error(projectError.message);
  if (candidateError) throw new Error(candidateError.message);
  if (!project) throw new Error("Project not found for Tweet-to-Raid approval.");
  if (!candidate) throw new Error("Tweet-to-Raid candidate not found.");

  const typedProject = project as ProjectSummary;
  const typedCandidate = candidate as TweetToRaidCandidateRow;
  if (typedCandidate.status !== "pending") {
    throw new Error("Only pending Tweet-to-Raid candidates can be approved.");
  }

  const metadata = asRecord(typedCandidate.metadata);
  const sourceExternalId = readString(metadata.sourceExternalId);
  const instructions = asStringArray(metadata.instructions);
  const target =
    readString(metadata.target) ||
    "Open the source post, engage with it, then confirm the raid in VYNTRO.";
  const eventResult = typedCandidate.source_event_id
    ? await supabase
        .from("x_raid_ingest_events")
        .select("id, source_id, x_post_id, x_username, post_url")
        .eq("id", typedCandidate.source_event_id)
        .maybeSingle()
    : { data: null, error: null };

  if (eventResult.error) throw new Error(eventResult.error.message);
  const { data: event } = eventResult;
  const eventRecord = asRecord(event);
  const now = new Date().toISOString();

  const { data: raid, error: raidError } = await supabase
    .from("raids")
    .insert({
      project_id: params.projectId,
      campaign_id: null,
      title: typedCandidate.title,
      short_description: typedCandidate.short_description,
      community: typedProject.name ?? "Project",
      target,
      banner: typedCandidate.banner,
      reward_xp: typedCandidate.reward_xp,
      participants: 0,
      progress: 0,
      timer: "Live",
      platform: "x",
      target_url: typedCandidate.tweet_url,
      target_post_id: sourceExternalId || readString(eventRecord.x_post_id),
      target_account_handle: readString(eventRecord.x_username),
      verification_type: "manual_confirm",
      verification_config: {
        sourceProvider: "x",
        sourceUrl: typedCandidate.tweet_url,
        candidateId: typedCandidate.id,
      },
      instructions:
        instructions.length > 0
          ? instructions
          : [
              "Open the source post.",
              "Like, repost, comment or complete the project action honestly.",
              "Return to VYNTRO and confirm the raid once your action is complete.",
            ],
      starts_at: typedCandidate.starts_at,
      ends_at: typedCandidate.ends_at,
      status: "active",
      source_provider: "x",
      source_url: typedCandidate.tweet_url,
      source_external_id: sourceExternalId || readString(eventRecord.x_post_id),
      source_event_id: typedCandidate.source_event_id,
      generated_by: "tweet_to_raid",
      updated_at: now,
    })
    .select("id")
    .single();

  if (raidError) throw new Error(raidError.message);
  const raidId = raid.id as string;
  const raidUrl = buildCommunityEntityUrl("raids", raidId);
  let deliveryMetadata: Record<string, unknown> = {
    sourceUrl: typedCandidate.tweet_url,
    approvedFromPortalAt: now,
    deliveries: [],
    skipped: [],
  };

  try {
    const delivery = await sendProjectCommunityMessage({
      projectId: params.projectId,
      title: `LIVE RAID: ${typedCandidate.title}`,
      body: `${typedCandidate.short_description ?? "A new social raid is live."}\n\nOpen the raid, engage with the source post, then confirm it in VYNTRO.`,
      eyebrow: "LIVE RAID",
      projectName: typedProject.name ?? "Project",
      imageUrl:
        typedCandidate.banner || typedProject.banner_url || typedProject.logo || getDefaultCommunityArtwork("raid"),
      fallbackImageUrl: getDefaultCommunityArtwork("raid"),
      accentColor: typedProject.brand_accent,
      meta: [
        { label: "Reward", value: `+${typedCandidate.reward_xp} XP` },
        { label: "Source", value: "X" },
      ],
      url: raidUrl,
      buttonLabel: "Open raid",
    });

    deliveryMetadata = {
      ...deliveryMetadata,
      ...delivery,
      deliveredAt: new Date().toISOString(),
    };
  } catch (error) {
    deliveryMetadata = {
      ...deliveryMetadata,
      deliveryWarning: error instanceof Error ? error.message : "Community delivery failed.",
    };
  }

  const updateResults = await Promise.all([
    supabase
      .from("raid_generation_candidates")
      .update({
        status: "approved",
        approved_by_auth_user_id: params.authUserId,
        approved_at: now,
        updated_at: now,
      })
      .eq("id", typedCandidate.id),
    typedCandidate.source_event_id
      ? supabase
          .from("x_raid_ingest_events")
          .update({
            decision: "created_raid",
            decision_reason: "approved_from_portal",
            raid_id: raidId,
            delivery_metadata: deliveryMetadata,
            updated_at: now,
          })
          .eq("id", typedCandidate.source_event_id)
      : Promise.resolve({ error: null }),
    supabase.from("raids").update({ delivery_metadata: deliveryMetadata }).eq("id", raidId),
    readString(eventRecord.source_id)
      ? supabase
          .from("x_raid_sources")
          .update({ last_event_at: now, last_raid_at: now, updated_at: now })
          .eq("id", readString(eventRecord.source_id))
      : Promise.resolve({ error: null }),
  ]);
  const failedUpdate = updateResults.find((result) => result.error);
  if (failedUpdate?.error) throw new Error(failedUpdate.error.message);

  await writeProjectCommunityAuditLog({
    projectId: params.projectId,
    sourceTable: "raid_generation_candidates",
    sourceId: typedCandidate.id,
    action: "tweet_to_raid_candidate_approved",
    summary: `Approved Tweet-to-Raid candidate "${typedCandidate.title}".`,
    metadata: {
      raidId,
      authUserId: params.authUserId,
    },
  });

  return {
    raidId,
    deliveryMetadata,
  };
}

export async function rejectTweetToRaidCandidate(params: {
  projectId: string;
  candidateId: string;
  authUserId: string;
}) {
  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const { data: candidate, error: candidateError } = await supabase
    .from("raid_generation_candidates")
    .select("id, title, source_event_id, status")
    .eq("project_id", params.projectId)
    .eq("id", params.candidateId)
    .maybeSingle();

  if (candidateError) throw new Error(candidateError.message);
  if (!candidate) throw new Error("Tweet-to-Raid candidate not found.");

  const candidateRecord = candidate as Pick<
    TweetToRaidCandidateRow,
    "id" | "title" | "source_event_id" | "status"
  >;

  const updateResults = await Promise.all([
    supabase
      .from("raid_generation_candidates")
      .update({
        status: "rejected",
        updated_at: now,
      })
      .eq("id", candidateRecord.id),
    candidateRecord.source_event_id
      ? supabase
          .from("x_raid_ingest_events")
          .update({
            decision_reason: "rejected_from_portal",
            updated_at: now,
          })
          .eq("id", candidateRecord.source_event_id)
      : Promise.resolve({ error: null }),
  ]);
  const failedUpdate = updateResults.find((result) => result.error);
  if (failedUpdate?.error) throw new Error(failedUpdate.error.message);

  await writeProjectCommunityAuditLog({
    projectId: params.projectId,
    sourceTable: "raid_generation_candidates",
    sourceId: candidateRecord.id,
    action: "tweet_to_raid_candidate_rejected",
    summary: `Rejected Tweet-to-Raid candidate "${candidateRecord.title}".`,
    metadata: {
      authUserId: params.authUserId,
    },
  });
}
