import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import type { DbDataAccessRequest } from "@/types/database";
import type {
  AdminDataAccessRequest,
  AdminDataAccessRequestStatus,
  AdminDataRequestVerificationState,
} from "@/types/entities/security";

function shapeRequest(row: DbDataAccessRequest): AdminDataAccessRequest {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id ?? undefined,
    authUserId: row.auth_user_id ?? undefined,
    requestType: row.request_type,
    status: row.status,
    verificationState: row.verification_state,
    requesterEmail: row.requester_email,
    summary: row.summary,
    reviewNotes: row.review_notes,
    reviewedByAuthUserId: row.reviewed_by_auth_user_id ?? undefined,
    approvedByAuthUserId: row.approved_by_auth_user_id ?? undefined,
    completedByAuthUserId: row.completed_by_auth_user_id ?? undefined,
    requestedAt: row.requested_at,
    reviewedAt: row.reviewed_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadDataRequestsForAccount(accountId: string) {
  const supabase = getAccountsServiceClient();
  const { data, error } = await supabase
    .from("data_access_requests")
    .select("*")
    .eq("customer_account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbDataAccessRequest[]).map(shapeRequest);
}

export async function loadDataRequestsForUser(authUserId: string, accountId?: string | null) {
  const supabase = getAccountsServiceClient();
  let query = supabase
    .from("data_access_requests")
    .select("*")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false });

  if (accountId) {
    query = query.eq("customer_account_id", accountId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DbDataAccessRequest[]).map(shapeRequest);
}

export async function createDataAccessRequest(params: {
  accountId?: string | null;
  authUserId: string;
  requesterEmail: string;
  requestType: "export" | "delete";
  summary: string;
}) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("data_access_requests")
    .insert({
      customer_account_id: params.accountId ?? null,
      auth_user_id: params.authUserId,
      request_type: params.requestType,
      status: "submitted",
      verification_state: "pending",
      requester_email: params.requesterEmail,
      summary: params.summary.trim(),
      requested_at: now,
      metadata: {
        source: "portal_security",
      },
      updated_at: now,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to create data request.");
  }

  await supabase.from("data_access_request_events").insert({
    data_access_request_id: data.id,
    event_type: "submitted",
    actor_auth_user_id: params.authUserId,
    summary: `Data ${params.requestType} request submitted from portal security.`,
    event_payload: {
      requestType: params.requestType,
    },
  });

  return shapeRequest(data as DbDataAccessRequest);
}

function deriveRequestStatusUpdate(params: {
  action: "review" | "request_verification" | "approve" | "reject" | "complete";
  currentStatus: AdminDataAccessRequestStatus;
}) {
  switch (params.action) {
    case "review":
      return {
        status: "in_review" as AdminDataAccessRequestStatus,
        verificationState: "pending" as AdminDataRequestVerificationState,
        eventType: "status_changed",
      };
    case "request_verification":
      return {
        status: "awaiting_verification" as AdminDataAccessRequestStatus,
        verificationState: "pending" as AdminDataRequestVerificationState,
        eventType: "verification_requested",
      };
    case "approve":
      return {
        status: "approved" as AdminDataAccessRequestStatus,
        verificationState: "verified" as AdminDataRequestVerificationState,
        eventType: "verification_completed",
      };
    case "reject":
      return {
        status: "rejected" as AdminDataAccessRequestStatus,
        verificationState: "rejected" as AdminDataRequestVerificationState,
        eventType: "status_changed",
      };
    case "complete":
      return {
        status: "completed" as AdminDataAccessRequestStatus,
        verificationState:
          params.currentStatus === "approved"
            ? ("verified" as AdminDataRequestVerificationState)
            : ("not_needed" as AdminDataRequestVerificationState),
        eventType: "completed",
      };
  }
}

export async function updateDataAccessRequest(params: {
  requestId: string;
  actorAuthUserId: string;
  action: "review" | "request_verification" | "approve" | "reject" | "complete";
  reviewNotes?: string;
}) {
  const supabase = getAccountsServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("data_access_requests")
    .select("*")
    .eq("id", params.requestId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    throw new Error("Data access request was not found.");
  }

  const now = new Date().toISOString();
  const next = deriveRequestStatusUpdate({
    action: params.action,
    currentStatus: existing.status,
  });

  const { data, error } = await supabase
    .from("data_access_requests")
    .update({
      status: next.status,
      verification_state: next.verificationState,
      review_notes: params.reviewNotes ?? existing.review_notes,
      reviewed_by_auth_user_id: params.actorAuthUserId,
      approved_by_auth_user_id: params.action === "approve" ? params.actorAuthUserId : existing.approved_by_auth_user_id,
      completed_by_auth_user_id:
        params.action === "complete" ? params.actorAuthUserId : existing.completed_by_auth_user_id,
      reviewed_at:
        params.action === "review" ||
        params.action === "request_verification" ||
        params.action === "approve" ||
        params.action === "reject"
          ? now
          : existing.reviewed_at,
      completed_at: params.action === "complete" ? now : existing.completed_at,
      updated_at: now,
    })
    .eq("id", params.requestId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to update data access request.");
  }

  await supabase.from("data_access_request_events").insert({
    data_access_request_id: data.id,
    event_type: next.eventType,
    actor_auth_user_id: params.actorAuthUserId,
    summary: `Data request moved to ${next.status}.`,
    event_payload: {
      action: params.action,
      reviewNotes: params.reviewNotes ?? null,
    },
  });

  return shapeRequest(data as DbDataAccessRequest);
}
