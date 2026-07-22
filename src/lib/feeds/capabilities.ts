import type {
  FeedDefinition,
  SourceCapability,
  SourceIndependenceClass,
  SourceReliabilityClass,
  SourceSupportState,
} from '@/types/feeds';

const PLANNED_FEEDS = new Set([
  'acled',
  'shodan',
  'virustotal',
  'greynoise',
  'censys',
  'opensky',
  'aisstream',
  'newsapi',
  'reddit',
  'twitter',
  'recorded-future',
  'mandiant',
  'crowdstrike',
  'ibm-xforce',
  'marinetraffic',
  'flightaware',
  'pulsedive',
]);

const AUTHORITATIVE_PREFIXES = [
  'cisa',
  'nvd',
  'gdacs',
  'state-dept',
  'fbi',
  'usgs',
  'who',
  'interpol',
  'un-',
  'world-bank',
  'wmo',
  'ncsc',
  'nato',
];

const AGGREGATORS = new Set(['gdelt', 'reliefweb', 'opensanctions']);
const COMMUNITY = new Set(['urlhaus', 'threatfox', 'malwarebazaar', 'feodo-tracker', 'otx']);
const NEWSWIRE = new Set(['reuters-world']);

function startsWithAny(value: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

function supportState(definition: FeedDefinition): SourceSupportState {
  if (PLANNED_FEEDS.has(definition.id)) return 'PLANNED';
  if (definition.requiresKey) return 'CREDENTIAL_REQUIRED';
  if (definition.defaultEnabled) return 'PRODUCTION';
  return 'EXPERIMENTAL';
}

function reliabilityClass(definition: FeedDefinition): SourceReliabilityClass {
  if (startsWithAny(definition.id, AUTHORITATIVE_PREFIXES)) return 'AUTHORITATIVE';
  if (NEWSWIRE.has(definition.id)) return 'PRIMARY';
  if (COMMUNITY.has(definition.id)) return 'COMMUNITY';
  if (PLANNED_FEEDS.has(definition.id)) return 'UNKNOWN';
  return 'REPUTABLE_SECONDARY';
}

function independenceClass(definition: FeedDefinition): SourceIndependenceClass {
  if (startsWithAny(definition.id, AUTHORITATIVE_PREFIXES)) return 'OFFICIAL';
  if (NEWSWIRE.has(definition.id)) return 'NEWSWIRE';
  if (AGGREGATORS.has(definition.id)) return 'AGGREGATOR';
  if (COMMUNITY.has(definition.id)) return 'COMMUNITY';
  if (definition.tier === 'PAID') return 'VENDOR';
  return 'PUBLISHER';
}

export function resolveSourceCapability(definition: FeedDefinition): SourceCapability {
  const defaults: SourceCapability = {
    supportState: supportState(definition),
    owner: 'Meridian Intelligence Engineering',
    reliabilityClass: reliabilityClass(definition),
    independenceClass: independenceClass(definition),
    freshnessTargetSec: definition.refreshIntervalSec,
    geographicCoverage: ['global'],
    domainCoverage: [definition.category],
    attributionRequired: true,
    license: 'Source terms govern downstream use',
    expectedVolume: definition.refreshIntervalSec <= 900 ? 'HIGH' : definition.refreshIntervalSec <= 3600 ? 'MEDIUM' : 'LOW',
  };

  return {
    ...defaults,
    ...definition.capability,
    geographicCoverage: definition.capability?.geographicCoverage ?? defaults.geographicCoverage,
    domainCoverage: definition.capability?.domainCoverage ?? defaults.domainCoverage,
  };
}

export function isCollectableSource(definition: FeedDefinition): boolean {
  return resolveSourceCapability(definition).supportState !== 'PLANNED';
}
