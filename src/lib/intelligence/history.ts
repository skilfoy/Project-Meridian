import { db } from '@/lib/db';

export type SignalChangeType = 'NEW' | 'ESCALATED' | 'DEESCALATED' | 'PERSISTING' | 'RESOLVED';

export interface HistoricalSignalSnapshot {
  signalId: string;
  family: string;
  title: string;
  summary: string;
  detectedAt: string;
  scores: {
    confidence: number;
    impact: number;
    urgency: number;
    novelty: number;
  };
  dimensions: Record<string, unknown>;
}

export interface HistoricalRunSnapshot {
  runId: string;
  generatedAt: string;
  methodVersion: string;
  coverage: Record<string, number>;
  feedFailureCount: number;
  signals: HistoricalSignalSnapshot[];
}

export interface SignalChange {
  type: SignalChangeType;
  identity: string;
  current?: HistoricalSignalSnapshot;
  previous?: HistoricalSignalSnapshot;
  priorityDelta: number;
}

export interface IntelligenceChangeSummary {
  currentRun: HistoricalRunSnapshot;
  previousRun: HistoricalRunSnapshot;
  collectionDelta: {
    incidentCount: number;
    sourceCount: number;
    evidenceCount: number;
    signalCount: number;
    feedFailureCount: number;
  };
  changes: SignalChange[];
  counts: Record<SignalChangeType, number>;
}

const CHANGE_THRESHOLD = 0.08;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function signalIdentity(signal: HistoricalSignalSnapshot): string {
  const dimensions = signal.dimensions;
  const discriminator = [
    dimensions.domain,
    dimensions.locationBucket,
    dimensions.topicKey,
  ].find((value) => typeof value === 'string' && value.length > 0);

  return `${signal.family}:${typeof discriminator === 'string' ? discriminator : normalizeTitle(signal.title)}`;
}

function priority(signal: HistoricalSignalSnapshot): number {
  return signal.scores.confidence * signal.scores.impact * signal.scores.urgency;
}

function round(value: number): number {
  return Number(value.toFixed(4));
}

function classifyDelta(delta: number): SignalChangeType {
  if (delta >= CHANGE_THRESHOLD) return 'ESCALATED';
  if (delta <= -CHANGE_THRESHOLD) return 'DEESCALATED';
  return 'PERSISTING';
}

function coverageDelta(
  current: HistoricalRunSnapshot,
  previous: HistoricalRunSnapshot,
  key: string
): number {
  return asNumber(current.coverage[key]) - asNumber(previous.coverage[key]);
}

export function compareRunSnapshots(
  current: HistoricalRunSnapshot,
  previous: HistoricalRunSnapshot
): IntelligenceChangeSummary {
  const previousByIdentity = new Map(
    previous.signals.map((signal) => [signalIdentity(signal), signal])
  );
  const currentByIdentity = new Map(
    current.signals.map((signal) => [signalIdentity(signal), signal])
  );

  const changes: SignalChange[] = [];

  for (const currentSignal of current.signals) {
    const identity = signalIdentity(currentSignal);
    const previousSignal = previousByIdentity.get(identity);

    if (!previousSignal) {
      changes.push({
        type: 'NEW',
        identity,
        current: currentSignal,
        priorityDelta: round(priority(currentSignal)),
      });
      continue;
    }

    const delta = round(priority(currentSignal) - priority(previousSignal));
    changes.push({
      type: classifyDelta(delta),
      identity,
      current: currentSignal,
      previous: previousSignal,
      priorityDelta: delta,
    });
  }

  for (const previousSignal of previous.signals) {
    const identity = signalIdentity(previousSignal);
    if (currentByIdentity.has(identity)) continue;

    changes.push({
      type: 'RESOLVED',
      identity,
      previous: previousSignal,
      priorityDelta: round(-priority(previousSignal)),
    });
  }

  const order: Record<SignalChangeType, number> = {
    NEW: 0,
    ESCALATED: 1,
    PERSISTING: 2,
    DEESCALATED: 3,
    RESOLVED: 4,
  };

  changes.sort((left, right) =>
    order[left.type] - order[right.type]
      || Math.abs(right.priorityDelta) - Math.abs(left.priorityDelta)
      || left.identity.localeCompare(right.identity)
  );

  const counts: Record<SignalChangeType, number> = {
    NEW: 0,
    ESCALATED: 0,
    DEESCALATED: 0,
    PERSISTING: 0,
    RESOLVED: 0,
  };
  for (const change of changes) counts[change.type] += 1;

  return {
    currentRun: current,
    previousRun: previous,
    collectionDelta: {
      incidentCount: coverageDelta(current, previous, 'incidentCount'),
      sourceCount: coverageDelta(current, previous, 'sourceCount'),
      evidenceCount: coverageDelta(current, previous, 'evidenceCount'),
      signalCount: coverageDelta(current, previous, 'signalCount'),
      feedFailureCount: current.feedFailureCount - previous.feedFailureCount,
    },
    changes,
    counts,
  };
}

function toSignalSnapshot(signal: {
  signalId: string;
  family: string;
  title: string;
  summary: string;
  detectedAt: Date;
  scores: unknown;
  dimensions: unknown;
}): HistoricalSignalSnapshot {
  const scores = asRecord(signal.scores);
  return {
    signalId: signal.signalId,
    family: signal.family,
    title: signal.title,
    summary: signal.summary,
    detectedAt: signal.detectedAt.toISOString(),
    scores: {
      confidence: asNumber(scores.confidence),
      impact: asNumber(scores.impact),
      urgency: asNumber(scores.urgency),
      novelty: asNumber(scores.novelty),
    },
    dimensions: asRecord(signal.dimensions),
  };
}

function toRunSnapshot(run: {
  id: string;
  generatedAt: Date;
  methodVersion: string;
  coverage: unknown;
  feedMeta: unknown;
  signals: Array<{
    signalId: string;
    family: string;
    title: string;
    summary: string;
    detectedAt: Date;
    scores: unknown;
    dimensions: unknown;
  }>;
}): HistoricalRunSnapshot {
  const feedMeta = asRecord(run.feedMeta);
  const errors = Array.isArray(feedMeta.errors) ? feedMeta.errors : [];
  const coverage = asRecord(run.coverage);

  return {
    runId: run.id,
    generatedAt: run.generatedAt.toISOString(),
    methodVersion: run.methodVersion,
    coverage: {
      incidentCount: asNumber(coverage.incidentCount),
      sourceCount: asNumber(coverage.sourceCount),
      evidenceCount: asNumber(coverage.evidenceCount),
      signalCount: asNumber(coverage.signalCount),
    },
    feedFailureCount: errors.length,
    signals: run.signals.map(toSignalSnapshot),
  };
}

export async function getLatestIntelligenceChanges(
  orgId: string,
  theaterId?: string
): Promise<IntelligenceChangeSummary | null> {
  const runs = await db.intelligenceRun.findMany({
    where: {
      orgId,
      ...(theaterId ? { theaterId } : {}),
    },
    orderBy: [
      { generatedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 2,
    include: {
      signals: {
        orderBy: { detectedAt: 'desc' },
      },
    },
  });

  if (runs.length < 2) return null;
  return compareRunSnapshots(toRunSnapshot(runs[0]), toRunSnapshot(runs[1]));
}
