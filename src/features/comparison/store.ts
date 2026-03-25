"use client";

import { create } from "zustand";

interface ComparisonState {
  selectedIds: string[];
  addPolicy: (id: string) => void;
  removePolicy: (id: string) => void;
  clearPolicies: () => void;
}

export const useComparisonStore = create<ComparisonState>((set) => ({
  selectedIds: [],
  addPolicy: (id) =>
    set((s) =>
      s.selectedIds.includes(id) || s.selectedIds.length >= 5
        ? s
        : { selectedIds: [...s.selectedIds, id] }
    ),
  removePolicy: (id) =>
    set((s) => ({ selectedIds: s.selectedIds.filter((x) => x !== id) })),
  clearPolicies: () => set({ selectedIds: [] }),
}));
