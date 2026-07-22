import { db } from '@/lib/db';
import { getSourceCatalog, getSourceCatalogSummary } from './catalog';

export type SourceFreshnessState = 'FRESH' | 'STALE' | 'NEVER_COLLECTED' | 'DISABLED';

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function freshnessState(
  enabled: boolean,
  lastSuccessAt: Date | null | undefined,
  freshnessTargetSec: number,
  now: number
): SourceFreshnessState {
  if (!enabled) return 'DISABLED';
  if (!lastSuccessAt) return 'NEVER_COLLECTED';
  return now - lastSuccessAt.getTime() <= freshnessTargetSec * 1000 ? 'FRESH' : 'STALE';
}

export async function getTenantSourceHealth(orgId: string, now = Date.now()) {
  const [catalog, configs] = await Promise.all([
    Promise.resolve(getSourceCatalog()),
    db.feedConfig.findMany({ where: { orgId } }),
  ]);
  const configByFeed = new Map(configs.map((config) => [config.feedId, config]));

  const sources = catalog.map((source) => {
    const config = configByFeed.get(source.id);
    const enabled = config?.enabled ?? source.defaultEnabled;
    const freshness = freshnessState(
      enabled,
      config?.lastSuccessAt,
      source.capability.freshnessTargetSec,
      now
    );

    return {
      ...source,
      tenant: {
        enabled,
        refreshIntervalSec: config?.refreshInterval ?? source.refreshIntervalSec,
        freshness,
        lastFetchedAt: toIso(config?.lastFetchedAt),
        lastSuccessAt: toIso(config?.lastSuccessAt),
        lastFailureAt: toIso(config?.lastFailureAt),
        staleServedAt: toIso(config?.staleServedAt),
        lastLatencyMs: config?.lastLatencyMs ?? null,
        consecutiveFailures: config?.consecutiveFailures ?? 0,
        circuitState: config?.circuitState ?? source.runtime.circuitBreaker,
        circuitOpenedAt: toIso(config?.circuitOpenedAt),
        lastError: config?.lastError ?? null,
      },
    };
  });

  const healthSummary = sources.reduce(
    (summary, source) => {
      summary[source.tenant.freshness] += 1;
      if (source.tenant.circuitState === 'OPEN') summary.openCircuits += 1;
      if (source.tenant.lastError) summary.sourcesWithErrors += 1;
      return summary;
    },
    {
      FRESH: 0,
      STALE: 0,
      NEVER_COLLECTED: 0,
      DISABLED: 0,
      openCircuits: 0,
      sourcesWithErrors: 0,
    }
  );

  return {
    summary: {
      ...getSourceCatalogSummary(),
      health: healthSummary,
    },
    sources,
    generatedAt: new Date(now).toISOString(),
  };
}
