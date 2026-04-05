"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

type AdminAuthState = {
  isAuthenticated: boolean;
  email: string | null;
  role: "project_admin" | "super_admin" | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  isAuthenticated: false,
  email: null,
  role: null,
  loading: true,

  initialize: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const session = data.session;

    set({
      isAuthenticated: !!session,
      email: session?.user?.email ?? null,
      role: session?.user?.email?.includes("super") ? "super_admin" : session ? "project_admin" : null,
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

    set({
      isAuthenticated: true,
      email: data.user?.email ?? email,
      role: data.user?.email?.includes("super") ? "super_admin" : "project_admin",
      loading: false,
    });

    return { ok: true };
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    set({
      isAuthenticated: false,
      email: null,
      role: null,
      loading: false,
    });
  },
}));