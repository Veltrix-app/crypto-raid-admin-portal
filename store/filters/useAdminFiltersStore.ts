"use client";

import { create } from "zustand";

type AdminFiltersState = {
  search: string;
  status: string;
  setSearch: (value: string) => void;
  setStatus: (value: string) => void;
  resetFilters: () => void;
};

export const useAdminFiltersStore = create<AdminFiltersState>((set) => ({
  search: "",
  status: "all",

  setSearch: (value) => set({ search: value }),
  setStatus: (value) => set({ status: value }),
  resetFilters: () =>
    set({
      search: "",
      status: "all",
    }),
}));