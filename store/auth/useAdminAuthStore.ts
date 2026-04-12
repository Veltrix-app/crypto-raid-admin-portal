"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

type AdminProjectMembership = {
  projectId: string;
  projectName: string;
  role: "owner" | "admin" | "reviewer" | "analyst";
  status: "active" | "invited";
};

type AdminAuthState = {
  isAuthenticated: boolean;
  authUserId: string | null;
  email: string | null;
  role: "project_admin" | "super_admin" | null;
  memberships: AdminProjectMembership[];
  activeProjectId: string | null;
  loading: boolean;
  initialize: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  setActiveProjectId: (projectId: string) => void;
};

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

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  isAuthenticated: false,
  authUserId: null,
  email: null,
  role: null,
  memberships: [],
  activeProjectId: null,
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
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const authUserId = session?.user?.id ?? null;
    const isSuperAdmin = !!session?.user?.email?.includes("super");
    const memberships = authUserId ? await loadMemberships(authUserId) : [];
    const nextActiveProjectId =
      memberships.find((item) => item.projectId === get().activeProjectId)?.projectId ??
      memberships[0]?.projectId ??
      null;

    set({
      isAuthenticated: !!session,
      authUserId,
      email: session?.user?.email ?? null,
      role: isSuperAdmin ? "super_admin" : session ? "project_admin" : null,
      memberships,
      activeProjectId: nextActiveProjectId,
      loading: false,
    });
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

    const authUserId = data.user?.id ?? null;
    const memberships = authUserId ? await loadMemberships(authUserId) : [];

    set({
      isAuthenticated: true,
      authUserId,
      email: data.user?.email ?? email,
      role: data.user?.email?.includes("super") ? "super_admin" : "project_admin",
      memberships,
      activeProjectId: memberships[0]?.projectId ?? null,
      loading: false,
    });

    return { ok: true };
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    set({
      isAuthenticated: false,
      authUserId: null,
      email: null,
      role: null,
      memberships: [],
      activeProjectId: null,
      loading: false,
    });
  },
}));
