import type { FeedDefinition } from '@/types/feeds';
import { fetchGdelt }       from './providers/gdelt';
import { fetchCisaKev }     from './providers/cisa';
import { fetchNvd }         from './providers/nvd';
import { fetchReliefWeb }   from './providers/reliefweb';
import { fetchUrlhaus }     from './providers/urlhaus';
import { fetchThreatFox }   from './providers/threatfox';
import { fetchGuardian }    from './providers/guardian';
import { fetchNyt }         from './providers/nyt';
import { fetchNasaFirms }   from './providers/nasa-firms';
import { fetchGdacs }       from './providers/gdacs';
import { fetchStateDept }   from './providers/state-dept';
import { fetchFbiWanted }   from './providers/fbi-wanted';
import {
  fetchAcled, fetchOtx, fetchShodan, fetchVirusTotal, fetchAbuseIpdb,
  fetchGreyNoise, fetchCensys, fetchOpenSky, fetchAisStream, fetchNewsApi,
  fetchReddit, fetchTwitter, fetchRecordedFuture, fetchMandiant, fetchCrowdStrike,
  fetchIbmXforce, fetchMarineTraffic, fetchFlightAware, fetchPulsedive, fetchMalwareBazaar,
} from './providers/stubs';

export const FEED_REGISTRY: FeedDefinition[] = [
  // ─── FREE FEEDS ───────────────────────────────────────────────────────────
  {
    id: 'gdelt', name: 'GDELT', category: 'news', tier: 'FREE',
    description: 'Global Database of Events, Language, and Tone — real-time global news analysis',
    docsUrl: 'https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/',
    defaultEnabled: true, refreshIntervalSec: 900, requiresKey: false,
    fetch: fetchGdelt,
  },
  {
    id: 'cisa-kev', name: 'CISA KEV', category: 'cyber', tier: 'FREE',
    description: 'CISA Known Exploited Vulnerabilities catalog',
    docsUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    defaultEnabled: true, refreshIntervalSec: 3600, requiresKey: false,
    fetch: fetchCisaKev,
  },
  {
    id: 'nvd', name: 'NVD CVE', category: 'cyber', tier: 'FREE',
    description: 'NIST National Vulnerability Database — CVE feed',
    docsUrl: 'https://nvd.nist.gov/developers/vulnerabilities',
    defaultEnabled: true, refreshIntervalSec: 900, requiresKey: false,
    fetch: fetchNvd,
  },
  {
    id: 'reliefweb', name: 'ReliefWeb', category: 'conflict', tier: 'FREE',
    description: 'UN OCHA humanitarian disaster and crisis intelligence',
    docsUrl: 'https://reliefweb.int/help/api',
    defaultEnabled: true, refreshIntervalSec: 1800, requiresKey: false,
    fetch: fetchReliefWeb,
  },
  {
    id: 'urlhaus', name: 'URLhaus', category: 'cyber', tier: 'FREE',
    description: 'abuse.ch malicious URL feed',
    docsUrl: 'https://urlhaus.abuse.ch/api/',
    defaultEnabled: true, refreshIntervalSec: 900, requiresKey: false,
    fetch: fetchUrlhaus,
  },
  {
    id: 'threatfox', name: 'ThreatFox', category: 'cyber', tier: 'FREE',
    description: 'abuse.ch IOC (indicator of compromise) feed',
    docsUrl: 'https://threatfox.abuse.ch/api/',
    defaultEnabled: true, refreshIntervalSec: 900, requiresKey: false,
    fetch: fetchThreatFox,
  },
  {
    id: 'gdacs', name: 'GDACS', category: 'environmental', tier: 'FREE',
    description: 'Global Disaster Alert and Coordination System RSS',
    docsUrl: 'https://www.gdacs.org/xml/rss.xml',
    defaultEnabled: true, refreshIntervalSec: 3600, requiresKey: false,
    fetch: fetchGdacs,
  },
  {
    id: 'state-dept', name: 'State Dept Travel', category: 'government', tier: 'FREE',
    description: 'US State Department travel advisories RSS',
    docsUrl: 'https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html/',
    defaultEnabled: true, refreshIntervalSec: 3600, requiresKey: false,
    fetch: fetchStateDept,
  },
  {
    id: 'fbi-wanted', name: 'FBI Wanted', category: 'government', tier: 'FREE',
    description: 'FBI Most Wanted list API',
    docsUrl: 'https://api.fbi.gov/',
    defaultEnabled: false, refreshIntervalSec: 3600, requiresKey: false,
    fetch: fetchFbiWanted,
  },

  // ─── KEY_REQUIRED FEEDS ───────────────────────────────────────────────────
  {
    id: 'guardian', name: 'The Guardian', category: 'news', tier: 'KEY_REQUIRED',
    description: 'Guardian Content API — world news articles',
    docsUrl: 'https://open-platform.theguardian.com/',
    defaultEnabled: false, refreshIntervalSec: 900, requiresKey: true,
    fetch: fetchGuardian,
  },
  {
    id: 'nyt', name: 'New York Times', category: 'news', tier: 'KEY_REQUIRED',
    description: 'NYT Article Search API',
    docsUrl: 'https://developer.nytimes.com/',
    defaultEnabled: false, refreshIntervalSec: 900, requiresKey: true,
    fetch: fetchNyt,
  },
  {
    id: 'nasa-firms', name: 'NASA FIRMS', category: 'environmental', tier: 'KEY_REQUIRED',
    description: 'NASA Fire Information for Resource Management — active fire / thermal anomaly data',
    docsUrl: 'https://firms.modaps.eosdis.nasa.gov/api/',
    defaultEnabled: false, refreshIntervalSec: 3600, requiresKey: true,
    fetch: fetchNasaFirms,
  },
  {
    id: 'acled', name: 'ACLED', category: 'conflict', tier: 'KEY_REQUIRED',
    description: 'Armed Conflict Location and Event Data',
    docsUrl: 'https://developer.acleddata.com/',
    defaultEnabled: false, refreshIntervalSec: 3600, requiresKey: true,
    fetch: fetchAcled,
  },
  {
    id: 'otx', name: 'AlienVault OTX', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'Open Threat Exchange threat intelligence pulses',
    docsUrl: 'https://otx.alienvault.com/api',
    defaultEnabled: false, refreshIntervalSec: 900, requiresKey: true,
    fetch: fetchOtx,
  },
  {
    id: 'shodan', name: 'Shodan', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'Internet-wide device and vulnerability scanning data',
    docsUrl: 'https://developer.shodan.io/',
    defaultEnabled: false, refreshIntervalSec: 3600, requiresKey: true,
    fetch: fetchShodan,
  },
  {
    id: 'virustotal', name: 'VirusTotal', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'VirusTotal threat intelligence API v3',
    docsUrl: 'https://developers.virustotal.com/',
    defaultEnabled: false, refreshIntervalSec: 1800, requiresKey: true,
    fetch: fetchVirusTotal,
  },
  {
    id: 'abuseipdb', name: 'AbuseIPDB', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'IP address reputation and abuse reports',
    docsUrl: 'https://www.abuseipdb.com/api',
    defaultEnabled: false, refreshIntervalSec: 1800, requiresKey: true,
    fetch: fetchAbuseIpdb,
  },
  {
    id: 'greynoise', name: 'GreyNoise', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'Internet background noise and scanning activity',
    docsUrl: 'https://docs.greynoise.io/',
    defaultEnabled: false, refreshIntervalSec: 1800, requiresKey: true,
    fetch: fetchGreyNoise,
  },
  {
    id: 'censys', name: 'Censys', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'Internet-wide certificate and host scanning',
    docsUrl: 'https://search.censys.io/api',
    defaultEnabled: false, refreshIntervalSec: 3600, requiresKey: true,
    fetch: fetchCensys,
  },
  {
    id: 'opensky', name: 'OpenSky Network', category: 'aviation', tier: 'KEY_REQUIRED',
    description: 'Real-time flight tracking ADS-B data',
    docsUrl: 'https://openskynetwork.github.io/opensky-api/',
    defaultEnabled: false, refreshIntervalSec: 60, requiresKey: true,
    fetch: fetchOpenSky,
  },
  {
    id: 'aisstream', name: 'AISStream', category: 'maritime', tier: 'KEY_REQUIRED',
    description: 'Real-time AIS vessel tracking WebSocket stream',
    docsUrl: 'https://aisstream.io/',
    defaultEnabled: false, refreshIntervalSec: 60, requiresKey: true,
    fetch: fetchAisStream,
  },
  {
    id: 'newsapi', name: 'NewsAPI.org', category: 'news', tier: 'KEY_REQUIRED',
    description: 'Aggregated global news from 80,000+ sources',
    docsUrl: 'https://newsapi.org/docs',
    defaultEnabled: false, refreshIntervalSec: 900, requiresKey: true,
    fetch: fetchNewsApi,
  },
  {
    id: 'reddit', name: 'Reddit', category: 'news', tier: 'KEY_REQUIRED',
    description: 'Reddit API — geopolitical subreddits',
    docsUrl: 'https://www.reddit.com/dev/api/',
    defaultEnabled: false, refreshIntervalSec: 1800, requiresKey: true,
    fetch: fetchReddit,
  },
  {
    id: 'twitter', name: 'X / Twitter', category: 'news', tier: 'KEY_REQUIRED',
    description: 'X/Twitter API v2 filtered stream',
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-api',
    defaultEnabled: false, refreshIntervalSec: 300, requiresKey: true,
    fetch: fetchTwitter,
  },
  {
    id: 'marinetraffic', name: 'MarineTraffic', category: 'maritime', tier: 'PAID',
    description: 'Commercial AIS vessel position and voyage data',
    docsUrl: 'https://www.marinetraffic.com/en/ais-api-services',
    defaultEnabled: false, refreshIntervalSec: 300, requiresKey: true,
    fetch: fetchMarineTraffic,
  },
  {
    id: 'flightaware', name: 'FlightAware', category: 'aviation', tier: 'PAID',
    description: 'FlightAware AeroAPI flight tracking',
    docsUrl: 'https://flightaware.com/aeroapi/',
    defaultEnabled: false, refreshIntervalSec: 60, requiresKey: true,
    fetch: fetchFlightAware,
  },
  {
    id: 'recorded-future', name: 'Recorded Future', category: 'cyber', tier: 'PAID',
    description: 'Recorded Future threat intelligence platform',
    docsUrl: 'https://support.recordedfuture.com/hc/en-us/articles/115004667468',
    defaultEnabled: false, refreshIntervalSec: 900, requiresKey: true,
    fetch: fetchRecordedFuture,
  },
  {
    id: 'mandiant', name: 'Mandiant TI', category: 'cyber', tier: 'PAID',
    description: 'Mandiant threat intelligence feed',
    docsUrl: 'https://www.mandiant.com/advantage/threat-intelligence',
    defaultEnabled: false, refreshIntervalSec: 3600, requiresKey: true,
    fetch: fetchMandiant,
  },
  {
    id: 'crowdstrike', name: 'CrowdStrike Falcon', category: 'cyber', tier: 'PAID',
    description: 'CrowdStrike Falcon threat intelligence',
    docsUrl: 'https://falconpy.io/',
    defaultEnabled: false, refreshIntervalSec: 900, requiresKey: true,
    fetch: fetchCrowdStrike,
  },
  {
    id: 'ibm-xforce', name: 'IBM X-Force', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'IBM X-Force threat intelligence exchange',
    docsUrl: 'https://exchange.xforce.ibmcloud.com/api/doc/',
    defaultEnabled: false, refreshIntervalSec: 1800, requiresKey: true,
    fetch: fetchIbmXforce,
  },
  {
    id: 'pulsedive', name: 'Pulsedive', category: 'cyber', tier: 'KEY_REQUIRED',
    description: 'Community threat intelligence platform',
    docsUrl: 'https://pulsedive.com/api/',
    defaultEnabled: false, refreshIntervalSec: 1800, requiresKey: true,
    fetch: fetchPulsedive,
  },
  {
    id: 'malwarebazaar', name: 'MalwareBazaar', category: 'cyber', tier: 'FREE',
    description: 'abuse.ch malware sample repository',
    docsUrl: 'https://bazaar.abuse.ch/api/',
    defaultEnabled: false, refreshIntervalSec: 900, requiresKey: false,
    fetch: fetchMalwareBazaar,
  },
];

export function getFeed(id: string): FeedDefinition | undefined {
  return FEED_REGISTRY.find((f) => f.id === id);
}
