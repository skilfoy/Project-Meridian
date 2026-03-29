import type { FeedParams, RawFeedResult } from '@/types/feeds';
import type { Severity } from '@/types';

function cvssToSeverity(score: number): Severity {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  if (score > 0)    return 'LOW';
  return 'INFO';
}

export async function fetchNvd(params: FeedParams, apiKey?: string): Promise<RawFeedResult> {
  const start = Date.now();
  const limit = Math.min(params.limit ?? 20, 100);
  const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0');
  url.searchParams.set('resultsPerPage', String(limit));
  url.searchParams.set('startIndex', '0');

  const severityFilter = params.filters?.severity;
  if (severityFilter) url.searchParams.set('cvssV3Severity', severityFilter);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers['apiKey'] = apiKey;

  const res = await fetch(url.toString(), { headers, next: { revalidate: 900 } });
  if (!res.ok) throw new Error(`NVD HTTP ${res.status}`);

  const data = await res.json() as {
    vulnerabilities?: Array<{
      cve?: {
        id?: string;
        descriptions?: Array<{ lang: string; value: string }>;
        metrics?: { cvssMetricV31?: Array<{ cvssData?: { baseScore?: number; baseSeverity?: string } }> };
        published?: string;
        references?: Array<{ url?: string }>;
      };
    }>;
  };

  const items = (data.vulnerabilities ?? []).map((v) => {
    const cve = v.cve ?? {};
    const desc = (cve.descriptions ?? []).find((d) => d.lang === 'en')?.value ?? '';
    const score = cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore ?? 0;
    return {
      id:          cve.id,
      title:       `${cve.id}: ${desc.slice(0, 100)}${desc.length > 100 ? '...' : ''}`,
      summary:     desc,
      url:         cve.references?.[0]?.url,
      publishedAt: cve.published,
      severity:    cvssToSeverity(score),
      tags:        ['nvd', 'cve', 'vulnerability'],
    };
  });

  return { items, meta: { source: 'nvd', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
