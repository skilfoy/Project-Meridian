import type { FeedParams, RawFeedResult } from '@/types/feeds';

// Bounding boxes [minLat, minLon, maxLat, maxLon] per theater
const THEATER_BBOX: Record<string, [number, number, number, number]> = {
  gcc:              [12, 43, 30, 60],
  'eastern-europe': [44, 22, 54, 42],
  'indo-pacific':   [-5, 100, 30, 145],
  sahel:            [10, -18, 25, 25],
  levant:           [29, 33, 38, 42],
  'horn-of-africa': [0, 38, 18, 52],
  'south-asia':     [20, 58, 38, 78],
  'latin-america':  [-5, -85, 25, -65],
};

export async function fetchNasaFirms(params: FeedParams, apiKey?: string): Promise<RawFeedResult> {
  if (!apiKey) throw new Error('NASA FIRMS MAP_KEY required');
  const start = Date.now();
  const bbox = params.theaterId ? THEATER_BBOX[params.theaterId] : undefined;
  const bboxStr = bbox ? bbox.join(',') : '-180,-90,180,90';
  const limit = Math.min(params.limit ?? 50, 500);

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${bboxStr}/1`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`NASA FIRMS HTTP ${res.status}`);

  const text = await res.text();
  const lines = text.trim().split('\n').slice(1, limit + 1); // Skip header

  const items = lines.map((line, idx) => {
    const parts = line.split(',');
    const lat  = parseFloat(parts[0]);
    const lng  = parseFloat(parts[1]);
    const date = parts[5];
    return {
      id:          `firms-${date}-${idx}`,
      title:       `Active Fire Detection (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      summary:     `VIIRS thermal anomaly detected`,
      publishedAt: date,
      lat:         isNaN(lat) ? undefined : lat,
      lng:         isNaN(lng) ? undefined : lng,
      severity:    'MEDIUM' as const,
      tags:        ['nasa', 'firms', 'fire', 'environmental'],
    };
  }).filter((i) => i.lat !== undefined);

  return { items, meta: { source: 'nasa-firms', fetchedAt: new Date().toISOString(), latencyMs: Date.now() - start, total: items.length } };
}
