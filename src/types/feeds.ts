import type { Severity } from './index';

export type FeedTier = 'FREE' | 'KEY_REQUIRED' | 'PAID';
export type FeedCategory = 'conflict' | 'government' | 'commercial' | 'news' | 'maritime' | 'cyber' | 'environmental' | 'aviation' | 'sanctions';
export type FeedStatus = 'live' | 'error' | 'no-key' | 'disabled' | 'unknown';

export interface FeedDefinition {
  id: string;
  name: string;
  description: string;
  category: FeedCategory;
  tier: FeedTier;
  docsUrl: string;
  defaultEnabled: boolean;
  refreshIntervalSec: number;
  requiresKey: boolean;
  fetch: (params: FeedParams, apiKey?: string) => Promise<RawFeedResult>;
}

export interface FeedParams {
  theaterId?: string;
  limit?: number;
  since?: Date;
  filters?: Record<string, string>;
}

export interface RawFeedResult {
  items: RawFeedItem[];
  meta: {
    source: string;
    fetchedAt: string;
    latencyMs: number;
    total?: number;
  };
}

export interface RawFeedItem {
  id?: string;
  title: string;
  summary?: string;
  url?: string;
  publishedAt?: string;
  lat?: number;
  lng?: number;
  severity?: Severity;
  tags?: string[];
  raw?: unknown;
}

export interface NormalizedIncident {
  id: string;
  source: string;
  sourceId?: string;
  title: string;
  summary?: string;
  url?: string;
  severity: Severity;
  domain: string;
  lat?: number;
  lng?: number;
  occurredAt: string;
  tags: string[];
}

export interface FeedResult {
  feedId: string;
  incidents: NormalizedIncident[];
  meta: {
    source: string;
    latencyMs: number;
    fetchedAt: string;
    cached: boolean;
    total: number;
  };
}

export interface AggregatedFeedResult {
  incidents: NormalizedIncident[];
  feedResults: FeedResult[];
  errors: Array<{ feedId: string; error: string }>;
  meta: {
    totalFeeds: number;
    successfulFeeds: number;
    failedFeeds: number;
    fetchedAt: string;
  };
}

export interface FeedStatusEntry {
  feedId: string;
  status: FeedStatus;
  lastFetchedAt?: string;
  lastError?: string;
  latencyMs?: number;
  enabled: boolean;
}
