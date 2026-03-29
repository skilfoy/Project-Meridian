import { nanoid } from 'nanoid';
import type { RawFeedItem, NormalizedIncident } from '@/types/feeds';
import type { Severity } from '@/types';

const DOMAIN_MAP: Record<string, string> = {
  gdelt:        'news',
  'cisa-kev':   'cyber',
  nvd:          'cyber',
  reliefweb:    'humanitarian',
  urlhaus:      'cyber',
  threatfox:    'cyber',
  gdacs:        'environmental',
  'state-dept': 'government',
  'fbi-wanted': 'government',
  guardian:     'news',
  nyt:          'news',
  'nasa-firms': 'environmental',
  acled:        'conflict',
  default:      'intelligence',
};

export function normalizeItem(item: RawFeedItem, source: string): NormalizedIncident {
  return {
    id:         item.id ?? nanoid(),
    source,
    sourceId:   item.id,
    title:      item.title,
    summary:    item.summary,
    url:        item.url,
    severity:   item.severity ?? inferSeverity(item),
    domain:     DOMAIN_MAP[source] ?? DOMAIN_MAP.default,
    lat:        item.lat,
    lng:        item.lng,
    occurredAt: item.publishedAt ?? new Date().toISOString(),
    tags:       item.tags ?? [],
  };
}

function inferSeverity(item: RawFeedItem): Severity {
  const text = `${item.title} ${item.summary ?? ''}`.toLowerCase();
  if (/critical|imminent|active exploitation|ransomware|do not travel/.test(text)) return 'CRITICAL';
  if (/high|attack|breach|exploited|conflict|missile|drone/.test(text)) return 'HIGH';
  if (/medium|warning|alert|suspicious/.test(text)) return 'MEDIUM';
  return 'LOW';
}
