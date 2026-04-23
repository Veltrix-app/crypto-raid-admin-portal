"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  BusinessControlAccountDetail,
  BusinessControlOverview,
} from "@/lib/billing/business-control";

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
