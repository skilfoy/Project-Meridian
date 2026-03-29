'use client';
import useSWR from 'swr';
import { useLogger } from './useLogger';
import type { FeedResult } from '@/types/feeds';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function useFeed(feedId: string, theaterId?: string, limit = 25) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (theaterId) params.set('theater', theaterId);
  return useSWR<FeedResult>(`/api/feeds/${feedId}?${params}`, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });
}

export function useFeedStatus() {
  return useSWR('/api/feeds/status', fetcher, {
    refreshInterval: 30000,
  });
}
