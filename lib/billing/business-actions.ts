import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import type {
  AdminCustomerAccountBillingEvent,
  AdminCustomerAccountBusinessNote,
} from "@/types/entities/billing-subscription";
import type {
  DbCustomerAccountBillingEvent,
  DbCustomerAccountBusinessNote,
  DbCustomerAccountSubscription,
} from "@/types/database";

const MS_IN_DAY = 24 * 60 * 60 * 1000;

function mapBusinessNote(row: DbCustomerAccountBusinessNote): AdminCustomerAccountBusinessNote {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    authorAuthUserId: row.author_auth_user_id ?? undefined,
    ownerAuthUserId: row.owner_auth_user_id ?? undefined,
    noteType: row.note_type as AdminCustomerAccountBusinessNote["noteType"],
    status: row.status as AdminCustomerAccountBusinessNote["status"],
    title: row.title,
    body: row.body,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at ?? undefined,
  };
}

function mapBillingEvent(row: DbCustomerAccountBillingEvent): AdminCustomerAccountBillingEvent {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    customerAccountSubscriptionId: row.customer_account_subscription_id ?? undefined,
    customerAccountInvoiceId: row.customer_account_invoice_id ?? undefined,
    eventSource: row.event_source,
    eventType: row.event_type,
    stripeEventId: row.stripe_event_id ?? undefined,
    actorAuthUserId: row.actor_auth_user_id ?? undefined,
    summary: row.summary ?? undefined,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

export async function loadBusinessAccountNotes(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_business_notes")
    .select(
      "id, customer_account_id, author_auth_user_id, owner_auth_user_id, note_type, status, title, body, metadata, created_at, updated_at, resolved_at"
    )
    .eq("customer_account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message || "Failed to load business notes.");
  }

  return (data ?? []).map(mapBusinessNote);
}

export async function loadBusinessAccountEvents(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("customer_account_billing_events")
    .select(
      "id, customer_account_id, customer_account_subscription_id, customer_account_invoice_id, event_source, event_type, stripe_event_id, actor_auth_user_id, summary, metadata, created_at"
    )
    .eq("customer_account_id", accountId)
    .order("created_at", { ascending: false })
    .limit(14);

  if (error) {
    throw new Error(error.message || "Failed to load billing events.");
  }

  return (data ?? []).map(mapBillingEvent);
}

export async function createBusinessNote(input: {
  customerAccountId: string;
  authorAuthUserId: string;
  noteType: AdminCustomerAccountBusinessNote["noteType"];
  title: string;
  body: string;
  ownerAuthUserId?: string | null;
}) {
  const supabase = getAccountsServiceClient();
  const normalizedTitle = input.title.trim();
  const normalizedBody = input.body.trim();

  if (!normalizedTitle || !normalizedBody) {
    throw new Error("A business note needs both a title and a body.");
  }

  const { data, error } = await supabase
    .from("customer_account_business_notes")
    .insert({
      customer_account_id: input.customerAccountId,
      author_auth_user_id: input.authorAuthUserId,
      owner_auth_user_id: input.ownerAuthUserId ?? null,
      note_type: input.noteType,
      status: "open",
      title: normalizedTitle,
      body: normalizedBody,
    })
    .select(
      "id, customer_account_id, author_auth_user_id, owner_auth_user_id, note_type, status, title, body, metadata, created_at, updated_at, resolved_at"
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create business note.");
  }

  const { error: eventError } = await supabase.from("customer_account_billing_events").insert({
    customer_account_id: input.customerAccountId,
    event_source: "portal_admin",
    event_type: "business_note_added",
    actor_auth_user_id: input.authorAuthUserId,
    summary: normalizedTitle,
    metadata: {
      noteType: input.noteType,
      businessNoteId: data.id,
    },
  });

  if (eventError) {
    throw new Error(eventError.message || "Failed to write the business note audit event.");
  }

  return mapBusinessNote(data);
}

function resolveGraceBaseDate(subscription: Pick<DbCustomerAccountSubscription, "grace_until" | "current_period_end">) {
  const now = Date.now();
  const graceUntil = subscription.grace_until ? new Date(subscription.grace_until).getTime() : 0;
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : 0;

  return new Date(Math.max(now, graceUntil, currentPeriodEnd));
}

export async function extendBusinessGraceWindow(input: {
  customerAccountId: string;
  actorAuthUserId: string;
  days: number;
}) {
  const supabase = getAccountsServiceClient();
  const extensionDays = Math.max(1, Math.min(30, Math.floor(input.days)));
  const now = new Date().toISOString();

  const { data: subscription, error: subscriptionError } = await supabase
    .from("customer_account_subscriptions")
    .select(
      "id, customer_account_id, billing_plan_id, status, current_period_end, grace_until"
    )
    .eq("customer_account_id", input.customerAccountId)
    .eq("is_current", true)
    .maybeSingle();

  if (subscriptionError) {
    throw new Error(subscriptionError.message || "Failed to load the current subscription.");
  }

  if (!subscription?.id || subscription.billing_plan_id === "free") {
    throw new Error("Grace can only be extended on paid workspace accounts.");
  }

  const nextGraceUntil = new Date(
    resolveGraceBaseDate(subscription).getTime() + extensionDays * MS_IN_DAY
  ).toISOString();

  const { error: updateSubscriptionError } = await supabase
    .from("customer_account_subscriptions")
    .update({
      status: "grace",
      grace_until: nextGraceUntil,
      updated_at: now,
    })
    .eq("id", subscription.id);

  if (updateSubscriptionError) {
    throw new Error(updateSubscriptionError.message || "Failed to extend subscription grace.");
  }

  const { error: updateEntitlementsError } = await supabase
    .from("customer_account_entitlements")
    .update({
      grace_until: nextGraceUntil,
      updated_at: now,
    })
    .eq("customer_account_id", input.customerAccountId);

  if (updateEntitlementsError) {
    throw new Error(updateEntitlementsError.message || "Failed to extend entitlement grace.");
  }

  const { error: eventError } = await supabase.from("customer_account_billing_events").insert({
    customer_account_id: input.customerAccountId,
    customer_account_subscription_id: subscription.id,
    event_source: "portal_admin",
    event_type: "grace_extended",
    actor_auth_user_id: input.actorAuthUserId,
    summary: `Extended workspace grace by ${extensionDays} day${extensionDays === 1 ? "" : "s"}.`,
    metadata: {
      days: extensionDays,
      previousGraceUntil: subscription.grace_until,
      nextGraceUntil,
    },
  });

  if (eventError) {
    throw new Error(eventError.message || "Failed to write the grace extension audit event.");
  }

  return {
    graceUntil: nextGraceUntil,
    days: extensionDays,
  };
}
