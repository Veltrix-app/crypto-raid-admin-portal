import { NextRequest } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";
import { getServiceSupabaseClient } from "@/lib/community/project-community-ops";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type AuthenticatedPortalAccountUser = {
  accessToken: string;
  user: User;
  email: string | null;
  normalizedEmail: string;
  displayName: string;
};

export function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

function deriveDisplayName(user: User) {
  const metadata = user.user_metadata ?? {};
  const value =
    metadata.username ??
    metadata.user_name ??
    metadata.full_name ??
    metadata.name ??
    user.email?.split("@")[0] ??
    "Workspace owner";

  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "Workspace owner";
}

function getAuthSupabaseClient(accessToken: string) {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, supabasePublishableKey, {
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

export async function resolveAuthenticatedPortalAccountUser(
  request: NextRequest
): Promise<AuthenticatedPortalAccountUser> {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    throw new Error("Missing bearer token.");
  }

  const supabase = getAuthSupabaseClient(accessToken);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    throw new Error("Invalid session.");
  }

  const email = typeof user.email === "string" ? user.email : null;
  const normalizedEmail = email?.trim().toLowerCase() ?? "";

  return {
    accessToken,
    user,
    email,
    normalizedEmail,
    displayName: deriveDisplayName(user),
  };
}

export function getAccountsServiceClient() {
  return getServiceSupabaseClient();
}
