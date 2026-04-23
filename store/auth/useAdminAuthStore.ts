"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type AdminProjectMembership = {
  projectId: string;
  projectName: string;
  role: "owner" | "admin" | "reviewer" | "analyst";
  status: "active" | "invited";
};

type AdminAuthMethod = "password" | "sso" | "unknown";

type AdminAuthSnapshot = {
  isAuthenticated: boolean;
  authUserId: string | null;
  email: string | null;
  role: "project_admin" | "super_admin" | null;
  memberships: AdminProjectMembership[];
  activeProjectId: string | null;
  currentAal: "aal1" | "aal2" | null;
  nextAal: "aal1" | "aal2" | null;
  authMethod: AdminAuthMethod;
  verifiedFactorCount: number;
  mfaPending: boolean;
  loading: boolean;
};

type AdminAuthState = {
  isAuthenticated: boolean;
  authUserId: string | null;
  email: string | null;
  role: "project_admin" | "super_admin" | null;
  memberships: AdminProjectMembership[];
  activeProjectId: string | null;
  currentAal: "aal1" | "aal2" | null;
  nextAal: "aal1" | "aal2" | null;
  authMethod: AdminAuthMethod;
  verifiedFactorCount: number;
  mfaPending: boolean;
  loading: boolean;
  initialize: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; requiresMfa?: boolean }>;
  loginWithSso: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyTotp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  setActiveProjectId: (projectId: string) => void;
};

async function resolvePortalRole(authUserId: string | null, email: string | null) {
  if (!authUserId) return null;

  const supabase = createClient();
  const fallbackRole = email?.includes("super") ? "super_admin" : "project_admin";

  const { data, error } = await supabase
    .from("admin_users")
    .select("role, status")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("Failed to resolve admin role from admin_users:", error.message);
    return fallbackRole;
  }

  if (data?.status === "active" && data?.role === "super_admin") {
    return "super_admin" as const;
  }

  return fallbackRole;
}

async function bootstrapMembershipsByEmail(authUserId: string, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  const supabase = createClient();

  const [
    { data: teamMatches },
    { data: projectMatches },
  ] = await Promise.all([
    supabase
      .from("team_members")
      .select("id")
      .is("auth_user_id", null)
      .ilike("email", normalizedEmail),
    supabase
      .from("projects")
      .select("id, name, contact_email")
      .is("owner_user_id", null)
      .ilike("contact_email", normalizedEmail),
  ]);

  if ((teamMatches?.length ?? 0) > 0) {
    const teamIds = teamMatches!.map((row: any) => row.id);
    const { error } = await supabase
      .from("team_members")
      .update({
        auth_user_id: authUserId,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .in("id", teamIds);

    if (error) {
      console.error("Failed to auto-link team memberships:", error.message);
    }
  }

  for (const project of projectMatches ?? []) {
    const timestamp = new Date().toISOString();

    const { error: ownerError } = await supabase
      .from("projects")
      .update({ owner_user_id: authUserId })
      .eq("id", project.id)
      .is("owner_user_id", null);

    if (ownerError) {
      console.error("Failed to auto-link project owner:", ownerError.message);
      continue;
    }

    const { data: existingTeamMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("project_id", project.id)
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (!existingTeamMember) {
      const { error: teamInsertError } = await supabase.from("team_members").insert({
        name: project.name ?? "Project Owner",
        email: normalizedEmail,
        role: "owner",
        status: "active",
        project_id: project.id,
        auth_user_id: authUserId,
        joined_at: timestamp,
      });

      if (teamInsertError) {
        console.error("Failed to create owner team membership:", teamInsertError.message);
      }
    }
  }
}

async function loadMemberships(authUserId: string) {
  const supabase = createClient();

  const [{ data: membershipRows }, { data: ownedProjects }] = await Promise.all([
    supabase
      .from("team_members")
      .select("project_id, role, status")
      .eq("auth_user_id", authUserId),
    supabase.from("projects").select("id, name").eq("owner_user_id", authUserId),
  ]);

  const projectIds = Array.from(
    new Set([
      ...(membershipRows ?? []).map((row: any) => row.project_id).filter(Boolean),
      ...(ownedProjects ?? []).map((row: any) => row.id).filter(Boolean),
    ])
  );

  const { data: projects } = projectIds.length
    ? await supabase.from('projects').select('id, name').in('id', projectIds)
    : { data: [] as { id: string; name: string }[] };

  const projectNameById = new Map((projects ?? []).map((row: any) => [row.id, row.name]));
  const membershipMap = new Map<string, AdminProjectMembership>();

  for (const row of membershipRows ?? []) {
    if (!row.project_id) continue;
    membershipMap.set(row.project_id, {
      projectId: row.project_id,
      projectName: projectNameById.get(row.project_id) ?? "Project",
      role: row.role ?? "reviewer",
      status: row.status ?? "invited",
    });
  }

  for (const row of ownedProjects ?? []) {
    if (!row.id) continue;
    membershipMap.set(row.id, {
      projectId: row.id,
      projectName: row.name ?? "Project",
      role: "owner",
      status: "active",
    });
  }

  return Array.from(membershipMap.values());
}

function clearAuthState(): AdminAuthSnapshot {
  return {
    isAuthenticated: false,
    authUserId: null,
    email: null,
    role: null,
    memberships: [],
    activeProjectId: null,
    currentAal: null,
    nextAal: null,
    authMethod: "unknown",
    verifiedFactorCount: 0,
    mfaPending: false,
    loading: false,
  };
}

function deriveAuthMethod(methods: unknown[]) {
  for (const entry of methods) {
    if (typeof entry === "string") {
      const normalized = entry.trim().toLowerCase();
      if (["sso", "saml", "oidc"].includes(normalized)) {
        return "sso" as const;
      }

      if (["password", "otp", "magiclink"].includes(normalized)) {
        return "password" as const;
      }
    }

    if (
      entry &&
      typeof entry === "object" &&
      "method" in entry &&
      typeof (entry as { method?: unknown }).method === "string"
    ) {
      const normalized = (entry as { method: string }).method.trim().toLowerCase();
      if (["sso", "saml", "oidc"].includes(normalized)) {
        return "sso" as const;
      }

      if (["password", "otp", "magiclink"].includes(normalized)) {
        return "password" as const;
      }
    }
  }

  return "unknown" as const;
}

async function loadSecurityState(supabase: SupabaseClient) {
  const [{ data: factors }, { data: assurance }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);

  const verifiedFactorCount = Array.isArray((factors as { totp?: unknown[] } | null)?.totp)
    ? ((factors as { totp?: unknown[] }).totp ?? []).length
    : 0;
  const currentAal: "aal1" | "aal2" = assurance?.currentLevel === "aal2" ? "aal2" : "aal1";
  const nextAal: "aal1" | "aal2" = assurance?.nextLevel === "aal2" ? "aal2" : "aal1";
  const currentAuthenticationMethods = Array.isArray(assurance?.currentAuthenticationMethods)
    ? assurance.currentAuthenticationMethods
    : [];
  const authMethod = deriveAuthMethod(currentAuthenticationMethods);
  const mfaPending = verifiedFactorCount > 0 && currentAal !== "aal2" && nextAal === "aal2";

  return {
    currentAal,
    nextAal,
    authMethod,
    verifiedFactorCount,
    mfaPending,
  };
}

async function buildAuthSnapshot(activeProjectId: string | null): Promise<AdminAuthSnapshot> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const authUserId = session?.user?.id ?? null;
  const email = session?.user?.email ?? null;

  if (!session || !authUserId) {
    return clearAuthState();
  }

  if (email) {
    await bootstrapMembershipsByEmail(authUserId, email);
  }

  const [role, memberships, security] = await Promise.all([
    resolvePortalRole(authUserId, email),
    loadMemberships(authUserId),
    loadSecurityState(supabase),
  ]);

  const nextActiveProjectId =
    memberships.find((item) => item.projectId === activeProjectId)?.projectId ??
    memberships[0]?.projectId ??
    null;

  return {
    isAuthenticated: !security.mfaPending,
    authUserId,
    email,
    role,
    memberships,
    activeProjectId: nextActiveProjectId,
    currentAal: security.currentAal,
    nextAal: security.nextAal,
    authMethod: security.authMethod,
    verifiedFactorCount: security.verifiedFactorCount,
    mfaPending: security.mfaPending,
    loading: false,
  };
}

async function resolvePrimaryTotpFactorId(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    throw new Error(error.message);
  }

  const totpFactor = (data?.totp ?? [])[0];
  if (!totpFactor?.id) {
    throw new Error("No TOTP factor is available for this account.");
  }

  return totpFactor.id;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  isAuthenticated: false,
  authUserId: null,
  email: null,
  role: null,
  memberships: [],
  activeProjectId: null,
  currentAal: null,
  nextAal: null,
  authMethod: "unknown",
  verifiedFactorCount: 0,
  mfaPending: false,
  loading: true,

  setActiveProjectId: (projectId) => {
    const membership = get().memberships.find((item) => item.projectId === projectId);
    if (!membership) return;
    set({ activeProjectId: projectId });
  },

  refreshMemberships: async () => {
    const authUserId = get().authUserId;
    if (!authUserId) {
      set({ memberships: [], activeProjectId: null });
      return;
    }

    const memberships = await loadMemberships(authUserId);
    const nextActiveProjectId =
      memberships.find((item) => item.projectId === get().activeProjectId)?.projectId ??
      memberships[0]?.projectId ??
      null;

    set({
      memberships,
      activeProjectId: nextActiveProjectId,
    });
  },

  initialize: async () => {
    const snapshot = await buildAuthSnapshot(get().activeProjectId);
    set(snapshot);
  },

  login: async (email: string, password: string) => {
    const supabase = createClient();

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const snapshot = await buildAuthSnapshot(get().activeProjectId);
    set(snapshot);

    if (snapshot.mfaPending) {
      return { ok: true, requiresMfa: true };
    }

    return { ok: true, requiresMfa: false };
  },

  loginWithSso: async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const domain = normalizedEmail.includes("@") ? normalizedEmail.split("@")[1] ?? "" : "";
    if (!domain) {
      return {
        ok: false,
        error: "Enter your workspace email first so Veltrix can route you into the right SSO domain.",
      };
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithSSO({
      domain,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  },

  verifyTotp: async (code: string) => {
    const supabase = createClient();
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      return { ok: false, error: "Enter the authenticator code first." };
    }

    try {
      const factorId = await resolvePrimaryTotpFactorId(supabase);
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError || !challenge?.id) {
        throw new Error(challengeError?.message || "Two-factor challenge could not be created.");
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: normalizedCode,
      });

      if (verifyError) {
        throw new Error(verifyError.message);
      }

      const snapshot = await buildAuthSnapshot(get().activeProjectId);
      set(snapshot);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Two-factor verification failed.",
      };
    }
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    set(clearAuthState());
  },
}));
