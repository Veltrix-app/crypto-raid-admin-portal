"use client";

import { createClient } from "@/lib/supabase/client";
import type { PortalCustomerBillingWorkspace } from "@/lib/billing/account-billing";
import { readBillingAwareJsonResponse } from "@/lib/billing/entitlement-blocks";

function getSupabaseAccessToken() {
  const supabase = createClient();
  return supabase.auth.getSession().then(({ data }) => data.session?.access_token ?? null);
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  return readBillingAwareJsonResponse<T>(response, "Billing workspace request failed.");
}

export async function fetchPortalCustomerBillingWorkspace(accountId: string) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Missing portal session.");
  }

  const response = await fetch(`/api/accounts/${accountId}/billing`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = await readJsonResponse<{
    ok: true;
    workspace: PortalCustomerBillingWorkspace;
  }>(response);

  return payload.workspace;
}
