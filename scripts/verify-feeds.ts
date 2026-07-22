import assert from 'node:assert/strict';
import { FEED_REGISTRY } from '../src/lib/feeds/registry';
import { getSourceCatalog, getSourceCatalogSummary } from '../src/lib/feeds/catalog';
import { isCollectableSource, resolveSourceCapability } from '../src/lib/feeds/capabilities';
import {
  getCircuitBreakerState,
  recordFeedFailure,
  recordFeedSuccess,
  resetCircuitBreaker,
} from '../src/lib/feeds/resilience';

assert(FEED_REGISTRY.length > 0, 'feed registry must not be empty');
assert.equal(new Set(FEED_REGISTRY.map((feed) => feed.id)).size, FEED_REGISTRY.length, 'feed IDs must be unique');

for (const feed of FEED_REGISTRY) {
  const capability = resolveSourceCapability(feed);
  assert(capability.owner.length > 0, `${feed.id} must have an owner`);
  assert(capability.freshnessTargetSec > 0, `${feed.id} must have a freshness target`);
  assert(capability.domainCoverage.includes(feed.category), `${feed.id} must declare its domain`);
  assert(capability.geographicCoverage.length > 0, `${feed.id} must declare geographic coverage`);
  assert(capability.license.length > 0, `${feed.id} must declare a licensing posture`);

  if (capability.supportState === 'PLANNED') {
    assert.equal(isCollectableSource(feed), false, `${feed.id} planned source must not be collectable`);
    assert.equal(feed.defaultEnabled, false, `${feed.id} planned source must not be enabled by default`);
  }
}

const catalog = getSourceCatalog();
const summary = getSourceCatalogSummary();
assert.equal(catalog.length, FEED_REGISTRY.length);
assert.equal(summary.total, FEED_REGISTRY.length);
assert(summary.collectable > 0);
assert((summary.bySupportState.PRODUCTION ?? 0) > 0);
assert((summary.bySupportState.PLANNED ?? 0) > 0);

resetCircuitBreaker();
assert.equal(getCircuitBreakerState('verification-feed', 0), 'CLOSED');
recordFeedFailure('verification-feed', 1);
recordFeedFailure('verification-feed', 2);
assert.equal(getCircuitBreakerState('verification-feed', 3), 'CLOSED');
recordFeedFailure('verification-feed', 3);
assert.equal(getCircuitBreakerState('verification-feed', 4), 'OPEN');
assert.equal(getCircuitBreakerState('verification-feed', 5 * 60 * 1000 + 4), 'HALF_OPEN');
recordFeedSuccess('verification-feed');
assert.equal(getCircuitBreakerState('verification-feed'), 'CLOSED');

console.log(`Meridian feed verification passed for ${summary.total} registered sources`);
