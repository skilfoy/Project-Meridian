/**
 * Stub providers for feeds that require paid/key access.
 * Each stub returns correct metadata but requires a valid API key to fetch real data.
 */
import type { FeedParams, RawFeedResult } from '@/types/feeds';

function makeStub(source: string) {
  return async (_params: FeedParams, apiKey?: string): Promise<RawFeedResult> => {
    if (!apiKey) throw new Error(`${source} API key required`);
    // Real implementation would call the provider's API here.
    // Stub returns empty to indicate key was provided but not yet implemented.
    return { items: [], meta: { source, fetchedAt: new Date().toISOString(), latencyMs: 0, total: 0 } };
  };
}

export const fetchAcled        = makeStub('acled');
export const fetchShodan       = makeStub('shodan');
export const fetchVirusTotal   = makeStub('virustotal');
export const fetchGreyNoise    = makeStub('greynoise');
export const fetchCensys       = makeStub('censys');
export const fetchOpenSky      = makeStub('opensky');
export const fetchAisStream    = makeStub('aisstream');
export const fetchNewsApi      = makeStub('newsapi');
export const fetchReddit       = makeStub('reddit');
export const fetchTwitter      = makeStub('twitter');
export const fetchRecordedFuture = makeStub('recorded-future');
export const fetchMandiant     = makeStub('mandiant');
export const fetchCrowdStrike  = makeStub('crowdstrike');
export const fetchIbmXforce    = makeStub('ibm-xforce');
export const fetchMarineTraffic = makeStub('marinetraffic');
export const fetchFlightAware  = makeStub('flightaware');
export const fetchPulsedive    = makeStub('pulsedive');
