import { db } from '@/lib/db';
import { getLatestIntelligenceChanges, type SignalChangeType } from './history';

export interface SignalScoreSet {
  confidence: number;
  impact: number;
  urgency: number;
  novelty: number;
}

export interface SignalCenterSignal {
  runId: string;
  signalId: string;
  family: string;
  title: string;
  summary: string;
  detectedAt: string;
  methodVersion: string;
  scores: SignalScoreSet;
  dimensions: Record<string, unknown>;
  observationCount: number;
  evidenceCount: number;
  sourceCount: number;
  changeType: SignalChangeType | 'UNCOMPARED';
  priorityDelta: number | null;
  priority: number;
}

export interface SignalCenterOverview {
  status: 'ready' | 'no_runs';
  theaterId?: string;
  run?: {
    runId: string;
    generatedAt: string;
    methodVersion: string;
    coverage: Record<string, number>;
    feedFailureCount: number;
  };
  changeSummary?: {
    previousRunId: string;
    previousGeneratedAt: string;
    counts: Record<SignalChangeType, number>;
    collectionDelta: {
      incidentCount: number;
      sourceCount: number;
      evidenceCount: number;
      signalCount: number;
      feedFailureCount: number;
    };
  } | null;
  signals: SignalCenterSignal[];
  resolvedSignals: Array<{
    signalId: string;
    family: string;
    title: string;
    summary: string;
    detectedAt: string;
    priorityDelta: number;
  }>;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function toScores(value: unknown): SignalScoreSet {
  const scores = asRecord(value);
  return {
    confidence: asNumber(scores.confidence),
    impact: asNumber(scores.impact),
    urgency: asNumber(scores.urgency),
    novelty: asNumber(scores.novelty),
  };
}

function priority(scores: SignalScoreSet): number {
  return Number((scores.confidence * scores.impact * scores.urgency).toFixed(4));
}

function coverage(value: unknown): Record<string, number> {
  const record = asRecord(value);
  return {
    incidentCount: asNumber(record.incidentCount),
    sourceCount: asNumber(record.sourceCount),
    evidenceCount: asNumber(record.evidenceCount),
    signalCount: asNumber(record.signalCount),
  };
}

function feedFailureCount(value: unknown): number {
  const metadata = asRecord(value);
  return Array.isArray(metadata.errors) ? metadata.errors.length : 0;
}

export async function getSignalCenterOverview(
  orgId: string,
  theaterId?: string
): Promise<SignalCenterOverview> {
  const run = await db.intelligenceRun.findFirst({
    where: {
      orgId,
      ...(theaterId ? { theaterId } : {}),
    },
    orderBy: [
      { generatedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    include: {
      signals: {
        orderBy: [
          { detectedAt: 'desc' },
          { signalId: 'asc' },
        ],
      },
      observations: {
        select: {
          observationId: true,
          source: true,
        },
      },
    },
  });

  if (!run) {
    return {
      status: 'no_runs',
      theaterId,
      signals: [],
      resolvedSignals: [],
    };
  }

  const changes = await getLatestIntelligenceChanges(orgId, theaterId);
  const changeBySignalId = new Map(
    (changes?.changes ?? [])
      .filter((change) => change.current)
      .map((change) => [change.current!.signalId, change])
  );
  const sourceByObservationId = new Map(
    run.observations.map((observation) => [observation.observationId, observation.source])
  );

  const signals = run.signals.map((signal): SignalCenterSignal => {
    const scores = toScores(signal.scores);
    const change = changeBySignalId.get(signal.signalId);
    const sources = new Set(
      signal.observationIds
        .map((observationId) => sourceByObservationId.get(observationId))
        .filter((source): source is string => Boolean(source))
    );

    return {
      runId: run.id,
      signalId: signal.signalId,
      family: signal.family,
      title: signal.title,
      summary: signal.summary,
      detectedAt: signal.detectedAt.toISOString(),
      methodVersion: signal.methodVersion,
      scores,
      dimensions: asRecord(signal.dimensions),
      observationCount: signal.observationIds.length,
      evidenceCount: signal.evidenceIds.length,
      sourceCount: sources.size,
      changeType: change?.type ?? 'UNCOMPARED',
      priorityDelta: change?.priorityDelta ?? null,
      priority: priority(scores),
    };
  }).sort((left, right) =>
    right.priority - left.priority
      || right.scores.novelty - left.scores.novelty
      || left.signalId.localeCompare(right.signalId)
  );

  const resolvedSignals = (changes?.changes ?? [])
    .filter((change) => change.type === 'RESOLVED' && change.previous)
    .map((change) => ({
      signalId: change.previous!.signalId,
      family: change.previous!.family,
      title: change.previous!.title,
      summary: change.previous!.summary,
      detectedAt: change.previous!.detectedAt,
      priorityDelta: change.priorityDelta,
    }));

  return {
    status: 'ready',
    theaterId: run.theaterId ?? theaterId,
    run: {
      runId: run.id,
      generatedAt: run.generatedAt.toISOString(),
      methodVersion: run.methodVersion,
      coverage: coverage(run.coverage),
      feedFailureCount: feedFailureCount(run.feedMeta),
    },
    changeSummary: changes
      ? {
          previousRunId: changes.previousRun.runId,
          previousGeneratedAt: changes.previousRun.generatedAt,
          counts: changes.counts,
          collectionDelta: changes.collectionDelta,
        }
      : null,
    signals,
    resolvedSignals,
  };
}

export async function getSignalCenterDetail(
  orgId: string,
  runId: string,
  signalId: string
) {
  const signal = await db.intelligenceSignalRecord.findFirst({
    where: { orgId, runId, signalId },
  });

  if (!signal) return null;

  const observations = await db.intelligenceObservationRecord.findMany({
    where: {
      orgId,
      runId,
      observationId: { in: signal.observationIds },
    },
    orderBy: [
      { occurredAt: 'desc' },
      { observationId: 'asc' },
    ],
    include: {
      evidence: {
        orderBy: [
          { occurredAt: 'desc' },
          { evidenceId: 'asc' },
        ],
      },
    },
  });

  const scores = toScores(signal.scores);
  return {
    runId,
    signalId: signal.signalId,
    family: signal.family,
    title: signal.title,
    summary: signal.summary,
    detectedAt: signal.detectedAt.toISOString(),
    methodVersion: signal.methodVersion,
    scores,
    priority: priority(scores),
    dimensions: asRecord(signal.dimensions),
    observations: observations.map((observation) => ({
      observationId: observation.observationId,
      source: observation.source,
      sourceRecordId: observation.sourceRecordId,
      title: observation.title,
      summary: observation.summary,
      domain: observation.domain,
      severity: observation.severity,
      occurredAt: observation.occurredAt.toISOString(),
      observedAt: observation.observedAt.toISOString(),
      latitude: observation.latitude,
      longitude: observation.longitude,
      tags: observation.tags,
      contentHash: observation.contentHash,
      evidence: observation.evidence.map((evidence) => ({
        evidenceId: evidence.evidenceId,
        source: evidence.source,
        sourceRecordId: evidence.sourceRecordId,
        url: evidence.url,
        capturedAt: evidence.capturedAt.toISOString(),
        occurredAt: evidence.occurredAt.toISOString(),
        reliability: evidence.reliability,
        independenceGroup: evidence.independenceGroup,
        contentHash: evidence.contentHash,
      })),
    })),
  };
}
