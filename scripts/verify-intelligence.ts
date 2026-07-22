import assert from 'node:assert/strict';
import { analyzeIncidents } from '../src/lib/intelligence/engine';
import { compareRunSnapshots, type HistoricalRunSnapshot } from '../src/lib/intelligence/history';
import type { NormalizedIncident } from '../src/types/feeds';

const referenceTime = '2026-07-22T04:00:00.000Z';

const incidents: NormalizedIncident[] = [
  {
    id: '1',
    source: 'source-a',
    sourceId: 'a-1',
    title: 'Coordinated ransomware campaign targets financial institutions',
    summary: 'Multiple institutions report disruptions.',
    severity: 'HIGH',
    domain: 'cyber',
    lat: 38.63,
    lng: -90.2,
    occurredAt: '2026-07-22T03:20:00.000Z',
    tags: ['ransomware', 'finance'],
  },
  {
    id: '2',
    source: 'source-b',
    sourceId: 'b-1',
    title: 'Ransomware campaign hits financial institutions',
    summary: 'Independent reporting identifies related disruption activity.',
    severity: 'HIGH',
    domain: 'cyber',
    lat: 38.61,
    lng: -90.18,
    occurredAt: '2026-07-22T03:30:00.000Z',
    tags: ['finance', 'ransomware'],
  },
  {
    id: '3',
    source: 'source-c',
    sourceId: 'c-1',
    title: 'New ransomware activity observed',
    severity: 'MEDIUM',
    domain: 'cyber',
    occurredAt: '2026-07-22T02:30:00.000Z',
    tags: ['ransomware'],
  },
];

const first = analyzeIncidents(incidents, { referenceTime, observedAt: referenceTime });
const second = analyzeIncidents(incidents, { referenceTime, observedAt: referenceTime });

assert.deepEqual(first, second, 'analysis must be deterministic for fixed inputs and time');
assert(first.signals.some((signal) => signal.family === 'SOURCE_CONVERGENCE'));
assert(first.signals.some((signal) => signal.family === 'GEOGRAPHIC_CONVERGENCE'));
assert(first.signals.some((signal) => signal.family === 'VELOCITY_SPIKE'));

const previous: HistoricalRunSnapshot = {
  runId: 'previous',
  generatedAt: '2026-07-22T03:00:00.000Z',
  methodVersion: first.methodVersion,
  coverage: { incidentCount: 2, sourceCount: 2, evidenceCount: 2, signalCount: 2 },
  feedFailureCount: 1,
  signals: [
    {
      signalId: 'old-1',
      family: 'SOURCE_CONVERGENCE',
      title: 'Independent-source convergence: cyber',
      summary: 'Earlier convergence',
      detectedAt: '2026-07-22T03:00:00.000Z',
      scores: { confidence: 0.6, impact: 0.8, urgency: 0.7, novelty: 0.4 },
      dimensions: { domain: 'cyber' },
    },
    {
      signalId: 'old-2',
      family: 'WATCHLIST_ESCALATION',
      title: 'Watchlist escalation: legacy actor',
      summary: 'Earlier watchlist activity',
      detectedAt: '2026-07-22T03:00:00.000Z',
      scores: { confidence: 0.5, impact: 0.5, urgency: 0.5, novelty: 0.3 },
      dimensions: {},
    },
  ],
};

const current: HistoricalRunSnapshot = {
  runId: 'current',
  generatedAt: referenceTime,
  methodVersion: first.methodVersion,
  coverage: { incidentCount: 3, sourceCount: 3, evidenceCount: 3, signalCount: 2 },
  feedFailureCount: 0,
  signals: [
    {
      signalId: 'new-1',
      family: 'SOURCE_CONVERGENCE',
      title: 'Independent-source convergence: cyber',
      summary: 'Current convergence',
      detectedAt: referenceTime,
      scores: { confidence: 0.9, impact: 0.9, urgency: 0.9, novelty: 0.5 },
      dimensions: { domain: 'cyber' },
    },
    {
      signalId: 'new-2',
      family: 'GEOGRAPHIC_CONVERGENCE',
      title: 'Geographic activity convergence',
      summary: 'New geographic convergence',
      detectedAt: referenceTime,
      scores: { confidence: 0.7, impact: 0.8, urgency: 0.8, novelty: 0.5 },
      dimensions: { locationBucket: '39.000,-90.000' },
    },
  ],
};

const changes = compareRunSnapshots(current, previous);
assert.equal(changes.counts.ESCALATED, 1);
assert.equal(changes.counts.NEW, 1);
assert.equal(changes.counts.RESOLVED, 1);
assert.equal(changes.collectionDelta.incidentCount, 1);
assert.equal(changes.collectionDelta.feedFailureCount, -1);

console.log('Meridian intelligence verification passed');
