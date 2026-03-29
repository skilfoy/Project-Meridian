'use client';
import { useDebugStore } from '@/store/debug.store';
import type { LogEntryType } from '@/store/debug.store';

export function useLogger() {
  const logEntry = useDebugStore((s) => s.logEntry);

  async function trackedFetch(
    url: string,
    options: RequestInit = {},
    source: string,
    type: LogEntryType = 'api_call'
  ): Promise<Response> {
    const start = Date.now();
    const method = (options.method ?? 'GET').toUpperCase();
    try {
      const res = await fetch(url, options);
      const latencyMs = Date.now() - start;
      logEntry({
        type, source, method, url, status: res.status, latencyMs,
        message: `${method} ${url} → ${res.status}`,
      });
      return res;
    } catch (err) {
      const latencyMs = Date.now() - start;
      const error = err instanceof Error ? err.message : String(err);
      logEntry({ type: 'error', source, method, url, latencyMs, message: error, error });
      throw err;
    }
  }

  return { trackedFetch, logEntry };
}
