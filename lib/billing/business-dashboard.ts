"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  BusinessControlAccountDetail,
  BusinessControlOverview,
} from "@/lib/billing/business-control";
import type { AdminCustomerAccountBusinessNote } from "@/types/entities/billing-subscription";

function getSupabaseAccessToken() {
  const supabase = createClient();
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null);
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    throw new Error(
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Business control request failed."
    );
  }

  return payload as T;
}

export async function fetchBusinessControlOverview() {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch("/api/business/overview", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    overview: BusinessControlOverview;
  }>(response);

  return payload.overview;
}

export async function fetchBusinessControlAccountDetail(accountId: string) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/business/accounts/${accountId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    detail: BusinessControlAccountDetail;
  }>(response);

  return payload.detail;
}

export async function createPortalBusinessNote(input: {
  accountId: string;
  noteType: AdminCustomerAccountBusinessNote["noteType"];
  title: string;
  body: string;
  ownerAuthUserId?: string | null;
}) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/business/accounts/${input.accountId}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      noteType: input.noteType,
      title: input.title,
      body: input.body,
      ownerAuthUserId: input.ownerAuthUserId ?? null,
    }),
  });

  const payload = await readJsonResponse<{
    ok: true;
    note: AdminCustomerAccountBusinessNote;
  }>(response);

  return payload.note;
}

export async function extendPortalBusinessGrace(input: {
  accountId: string;
  days: number;
}) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/business/accounts/${input.accountId}/actions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      action: "extend_grace",
      days: input.days,
    }),
  });

  const payload = await readJsonResponse<{
    ok: true;
    result: {
      graceUntil: string;
      days: number;
    };
  }>(response);

  return payload.result;
}
