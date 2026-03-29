'use client';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type LogEntryType = 'api_call' | 'ai_call' | 'feed' | 'error' | 'system';

export interface LogEntry {
  id: string;
  ts: number;
  type: LogEntryType;
  source: string;
  method?: string;
  url?: string;
  status?: number | string;
  latencyMs?: number;
  message: string;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
}

const MAX_ENTRIES = 500;

interface DebugStore {
  entries: LogEntry[];
  logEntry: (entry: Omit<LogEntry, 'id' | 'ts'>) => void;
  clearLogs: () => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
  entries: [],
  logEntry: (entry) =>
    set((state) => {
      const next = [{ ...entry, id: nanoid(), ts: Date.now() }, ...state.entries];
      return { entries: next.slice(0, MAX_ENTRIES) };
    }),
  clearLogs: () => set({ entries: [] }),
}));
