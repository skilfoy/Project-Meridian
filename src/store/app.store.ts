'use client';
import { create } from 'zustand';
import type { Theater } from '@/types';

interface AppStore {
  activeTheaterId: string;
  setActiveTheaterId: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeTheaterId: 'gcc',
  setActiveTheaterId: (id) => set({ activeTheaterId: id }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
