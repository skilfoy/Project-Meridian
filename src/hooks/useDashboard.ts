'use client';
import { useState, useCallback } from 'react';
import { useLogger } from './useLogger';
import type { TheaterIntel } from '@/types';

export function useDashboard(theaterId: string) {
  const [intel, setIntel]     = useState<TheaterIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const { trackedFetch }      = useLogger();

  const generateIntel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trackedFetch(
        '/api/ai/generate',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theaterId }) },
        'claude-ai',
        'ai_call'
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as TheaterIntel;
      setIntel(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate intel');
    } finally {
      setLoading(false);
    }
  }, [theaterId, trackedFetch]);

  return { intel, loading, error, generateIntel };
}
