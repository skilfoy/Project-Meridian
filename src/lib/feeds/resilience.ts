import type { CircuitBreakerState } from '@/types/feeds';

interface CircuitRecord {
  failures: number;
  openedAt?: number;
  lastFailureAt?: number;
}

const records = new Map<string, CircuitRecord>();
const FAILURE_THRESHOLD = 3;
const OPEN_DURATION_MS = 5 * 60 * 1000;

export function getCircuitBreakerState(feedId: string, now = Date.now()): CircuitBreakerState {
  const record = records.get(feedId);
  if (!record || record.failures < FAILURE_THRESHOLD) return 'CLOSED';
  if (!record.openedAt) return 'CLOSED';
  if (now - record.openedAt >= OPEN_DURATION_MS) return 'HALF_OPEN';
  return 'OPEN';
}

export function assertCircuitAllowsRequest(feedId: string, now = Date.now()): CircuitBreakerState {
  const state = getCircuitBreakerState(feedId, now);
  if (state === 'OPEN') {
    throw new Error(`Circuit open for feed ${feedId}`);
  }
  return state;
}

export function recordFeedSuccess(feedId: string): void {
  records.delete(feedId);
}

export function recordFeedFailure(feedId: string, now = Date.now()): CircuitBreakerState {
  const current = records.get(feedId) ?? { failures: 0 };
  const failures = current.failures + 1;
  const openedAt = failures >= FAILURE_THRESHOLD ? current.openedAt ?? now : undefined;
  records.set(feedId, { failures, openedAt, lastFailureAt: now });
  return getCircuitBreakerState(feedId, now);
}

export function resetCircuitBreaker(feedId?: string): void {
  if (feedId) records.delete(feedId);
  else records.clear();
}

export function getCircuitBreakerSnapshot(): Record<string, CircuitBreakerState> {
  return Object.fromEntries([...records.keys()].map((feedId) => [feedId, getCircuitBreakerState(feedId)]));
}
