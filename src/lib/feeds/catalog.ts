import { FEED_REGISTRY } from './registry';
import { getCircuitBreakerState } from './resilience';
import { resolveSourceCapability } from './capabilities';

export function getSourceCatalog() {
  return FEED_REGISTRY.map((definition) => ({
    id: definition.id,
    name: definition.name,
    description: definition.description,
    category: definition.category,
    tier: definition.tier,
    docsUrl: definition.docsUrl,
    defaultEnabled: definition.defaultEnabled,
    refreshIntervalSec: definition.refreshIntervalSec,
    requiresKey: definition.requiresKey,
    capability: resolveSourceCapability(definition),
    runtime: {
      circuitBreaker: getCircuitBreakerState(definition.id),
    },
  }));
}

export function getSourceCatalogSummary() {
  const sources = getSourceCatalog();
  const bySupportState = sources.reduce<Record<string, number>>((counts, source) => {
    const state = source.capability.supportState;
    counts[state] = (counts[state] ?? 0) + 1;
    return counts;
  }, {});

  return {
    total: sources.length,
    bySupportState,
    collectable: sources.filter((source) => source.capability.supportState !== 'PLANNED').length,
    credentialRequired: sources.filter((source) => source.requiresKey).length,
  };
}
