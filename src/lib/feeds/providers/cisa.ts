import type { FeedParams, RawFeedResult } from '@/types/feeds';

export async function fetchCisaKev(params: FeedParams): Promise<RawFeedResult> {
  const start = Date.now();
  const res = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`CISA KEV HTTP ${res.status}`);

  const data = await res.json() as {
    vulnerabilities?: Array<{
      cveID?: string; vulnerabilityName?: string; vendorProject?: string; product?: string;
      dateAdded?: string; dueDate?: string; requiredAction?: string; knownRansomwareCampaignUse?: string;
    }>;
  };

  const limit = params.limit ?? 50;
  const vulns = (data.vulnerabilities ?? []).slice(0, limit);

  const items = vulns.map((v) => ({
    id:          v.cveID,
    title:       `${v.cveID}: ${v.vulnerabilityName ?? 'Unknown'}`,
    summary:     `${v.vendorProject ?? ''} ${v.product ?? ''} — Due: ${v.dueDate ?? 'N/A'}. ${v.requiredAction ?? ''}`,
    publishedAt: v.dateAdded,
    tags:        ['cisa', 'kev', 'vulnerability', v.knownRansomwareCampaignUse === 'Known' ? 'ransomware' : 'no-ransomware'].filter(Boolean),
  }));

  return { items, meta: { source: 'cisa-kev', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
