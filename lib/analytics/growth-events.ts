import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";
import type {
  AdminGrowthAnalyticsEventType,
  AdminGrowthEventSource,
} from "@/types/entities/growth-analytics";

export type GrowthAnalyticsTouch = {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  referrer: string | null;
  landingPath: string | null;
  capturedAt: string | null;
};

export type GrowthAnalyticsContext = {
  sessionId: string | null;
  anonymousId: string | null;
  firstTouch: GrowthAnalyticsTouch | null;
  latestTouch: GrowthAnalyticsTouch | null;
};

type WriteGrowthAnalyticsEventInput = {
  eventType: AdminGrowthAnalyticsEventType;
  eventSource: AdminGrowthEventSource;
  occurredAt?: string | null;
  authUserId?: string | null;
  customerAccountId?: string | null;
  projectId?: string | null;
  campaignId?: string | null;
  analyticsContext?: GrowthAnalyticsContext | null;
  eventPayload?: Record<string, unknown>;
};

function sanitizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTouch(value: unknown): GrowthAnalyticsTouch | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    source: sanitizeNullableString(record.source),
    medium: sanitizeNullableString(record.medium),
    campaign: sanitizeNullableString(record.campaign),
    term: sanitizeNullableString(record.term),
    content: sanitizeNullableString(record.content),
    referrer: sanitizeNullableString(record.referrer),
    landingPath: sanitizeNullableString(record.landingPath),
    capturedAt: sanitizeNullableString(record.capturedAt),
  };
}

export function coerceGrowthAnalyticsContext(value: unknown): GrowthAnalyticsContext | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return {
    sessionId: sanitizeNullableString(record.sessionId),
    anonymousId: sanitizeNullableString(record.anonymousId),
    firstTouch: normalizeTouch(record.firstTouch),
    latestTouch: normalizeTouch(record.latestTouch),
  };
}

export async function writeGrowthAnalyticsEvent(input: WriteGrowthAnalyticsEventInput) {
  const analyticsContext = coerceGrowthAnalyticsContext(input.analyticsContext);
  const firstTouch = analyticsContext?.firstTouch ?? null;
  const latestTouch = analyticsContext?.latestTouch ?? null;
  const supabase = getServiceSupabaseClient();
  const insertPayload: Record<string, unknown> = {
    event_type: input.eventType,
    event_source: input.eventSource,
    auth_user_id: sanitizeNullableString(input.authUserId),
    customer_account_id: sanitizeNullableString(input.customerAccountId),
    project_id: sanitizeNullableString(input.projectId),
    campaign_id: sanitizeNullableString(input.campaignId),
    session_id: analyticsContext?.sessionId ?? null,
    anonymous_id: analyticsContext?.anonymousId ?? null,
    utm_source: latestTouch?.source ?? null,
    utm_medium: latestTouch?.medium ?? null,
    utm_campaign: latestTouch?.campaign ?? null,
    utm_term: latestTouch?.term ?? null,
    utm_content: latestTouch?.content ?? null,
    referrer: latestTouch?.referrer ?? null,
    landing_path: latestTouch?.landingPath ?? null,
    first_touch_source: firstTouch?.source ?? null,
    first_touch_medium: firstTouch?.medium ?? null,
    first_touch_campaign: firstTouch?.campaign ?? null,
    first_touch_term: firstTouch?.term ?? null,
    first_touch_content: firstTouch?.content ?? null,
    first_touch_referrer: firstTouch?.referrer ?? null,
    first_touch_landing_path: firstTouch?.landingPath ?? null,
    first_touch_captured_at: firstTouch?.capturedAt ?? null,
    latest_touch_source: latestTouch?.source ?? null,
    latest_touch_medium: latestTouch?.medium ?? null,
    latest_touch_campaign: latestTouch?.campaign ?? null,
    latest_touch_term: latestTouch?.term ?? null,
    latest_touch_content: latestTouch?.content ?? null,
    latest_touch_referrer: latestTouch?.referrer ?? null,
    latest_touch_landing_path: latestTouch?.landingPath ?? null,
    latest_touch_captured_at: latestTouch?.capturedAt ?? null,
    event_payload: input.eventPayload ?? {},
  };

  const occurredAt = sanitizeNullableString(input.occurredAt);
  if (occurredAt) {
    insertPayload.occurred_at = occurredAt;
  }

  const insertResult = await supabase.from("growth_analytics_events").insert(insertPayload);

  if (insertResult.error) {
    throw new Error(insertResult.error.message || "Failed to write growth analytics event.");
  }
}
