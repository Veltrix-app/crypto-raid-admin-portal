import { getAccountsServiceClient } from "@/lib/accounts/account-auth";
import type {
  DbCustomerAccountSsoConnection,
  DbCustomerAccountSsoDomain,
} from "@/types/database";
import type {
  AdminSsoConnection,
  AdminSsoDomain,
} from "@/types/entities/security";

function shapeSsoConnection(row: DbCustomerAccountSsoConnection): AdminSsoConnection {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    providerLabel: row.provider_label,
    providerType: row.provider_type,
    supabaseProviderId: row.supabase_provider_id ?? undefined,
    status: row.status,
    configuredByAuthUserId: row.configured_by_auth_user_id ?? undefined,
    enabledAt: row.enabled_at ?? undefined,
    disabledAt: row.disabled_at ?? undefined,
    lastTestedAt: row.last_tested_at ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function shapeSsoDomain(row: DbCustomerAccountSsoDomain): AdminSsoDomain {
  return {
    id: row.id,
    customerAccountId: row.customer_account_id,
    ssoConnectionId: row.customer_account_sso_connection_id,
    domain: row.domain,
    isPrimary: row.is_primary,
    verificationStatus: row.verification_status,
    verifiedAt: row.verified_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadAccountSsoConnections(accountId: string) {
  const supabase = getAccountsServiceClient();
  const [{ data: connections, error: connectionsError }, { data: domains, error: domainsError }] =
    await Promise.all([
      supabase
        .from("customer_account_sso_connections")
        .select("*")
        .eq("customer_account_id", accountId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("customer_account_sso_domains")
        .select("*")
        .eq("customer_account_id", accountId)
        .order("is_primary", { ascending: false })
        .order("domain", { ascending: true }),
    ]);

  if (connectionsError) {
    throw new Error(connectionsError.message);
  }

  if (domainsError) {
    throw new Error(domainsError.message);
  }

  const domainsByConnectionId = new Map<string, AdminSsoDomain[]>();
  for (const row of (domains ?? []) as DbCustomerAccountSsoDomain[]) {
    const list = domainsByConnectionId.get(row.customer_account_sso_connection_id) ?? [];
    list.push(shapeSsoDomain(row));
    domainsByConnectionId.set(row.customer_account_sso_connection_id, list);
  }

  return ((connections ?? []) as DbCustomerAccountSsoConnection[]).map((connection) => ({
    ...shapeSsoConnection(connection),
    domains: domainsByConnectionId.get(connection.id) ?? [],
  }));
}

export async function upsertAccountSsoConnection(params: {
  accountId: string;
  actorAuthUserId: string;
  providerLabel: string;
  supabaseProviderId?: string | null;
  domains: string[];
  enabled: boolean;
}) {
  const supabase = getAccountsServiceClient();
  const now = new Date().toISOString();
  const cleanedDomains = Array.from(
    new Set(
      params.domains
        .map((domain) => domain.trim().toLowerCase())
        .filter((domain) => domain.length > 0)
    )
  );

  const { data: existing, error: existingError } = await supabase
    .from("customer_account_sso_connections")
    .select("*")
    .eq("customer_account_id", params.accountId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const payload = {
    customer_account_id: params.accountId,
    provider_label: params.providerLabel.trim(),
    provider_type: "saml" as const,
    supabase_provider_id: params.supabaseProviderId?.trim() || null,
    status: params.enabled ? ("active" as const) : ("draft" as const),
    configured_by_auth_user_id: params.actorAuthUserId,
    enabled_at: params.enabled ? now : null,
    disabled_at: params.enabled ? null : now,
    last_tested_at: null,
    metadata: {
      source: "portal_security",
    },
    updated_at: now,
  };

  const { data: connection, error: connectionError } = existing?.id
    ? await supabase
        .from("customer_account_sso_connections")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single()
    : await supabase
        .from("customer_account_sso_connections")
        .insert(payload)
        .select("*")
        .single();

  if (connectionError || !connection) {
    throw new Error(connectionError?.message || "Failed to save SSO connection.");
  }

  if (cleanedDomains.length > 0) {
    await Promise.all(
      cleanedDomains.map((domain, index) =>
        supabase.from("customer_account_sso_domains").upsert(
          {
            customer_account_id: params.accountId,
            customer_account_sso_connection_id: connection.id,
            domain,
            is_primary: index === 0,
            verification_status:
              params.enabled && params.supabaseProviderId ? "verified" : "unverified",
            verified_at:
              params.enabled && params.supabaseProviderId ? now : null,
            updated_at: now,
          },
          { onConflict: "domain" }
        )
      )
    );
  }

  return loadAccountSsoConnections(params.accountId);
}
