"use client";

import { create } from "zustand";
import { PolicyType, Platform } from "@/domain/enums";

export interface ExplorerFilters {
  policyType?: PolicyType;
  platform?: Platform;
  scopeTagId?: string;
  search?: string;
}

interface ExplorerState {
  selectedNodeKey: string | null;
  filters: ExplorerFilters;
  viewMode: "list" | "grid";
  setSelectedNodeKey: (key: string | null) => void;
  setFilters: (filters: Partial<ExplorerFilters>) => void;
  resetFilters: () => void;
  setViewMode: (mode: "list" | "grid") => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
  selectedNodeKey: null,
  filters: {},
  viewMode: "list",
  setSelectedNodeKey: (key) => set({ selectedNodeKey: key }),
  setFilters: (updates) =>
    set((s) => ({ filters: { ...s.filters, ...updates } })),
  resetFilters: () => set({ filters: {} }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
