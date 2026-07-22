import { createHash } from 'crypto';
import type { Severity } from '@/types';
import type { NormalizedIncident } from '@/types/feeds';
import type {
  EvidenceReference,
  IntelligenceAnalysisResult,
  IntelligenceObservation,
  IntelligenceSignal,
  SignalScores,
} from './types';

const METHOD_VERSION = 'meridian-intelligence-core/0.2.0';
const HOUR_MS = 60 * 60 * 1000;

const SEVERITY_WEIGHT: Record<Severity, number> = {
  CRITICAL: 1,
  HIGH: 0.8,
  MEDIUM: 0.55,
  LOW: 0.3,
  INFO: 0.1,
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'by', 'for', 'from', 'in', 'into', 'is', 'of',
  'on', 'or', 'the', 'to', 'with', 'after', 'amid', 'over', 'under', 'new',
  'report', 'reports', 'reported', 'says', 'said', 'update', 'updates',
]);

export interface IntelligenceEngineOptions {
  referenceTime?: string;
  observedAt?: string;
  sourceReliability?: Record<string, number>;
  minimumIndependentSources?: number;
  convergenceWindowHours?: number;
  geographicPrecisionDegrees?: number;
  recentWindowHours?: number;
  baselineWindowHours?: number;
  velocityRatioThreshold?: number;
  topicSimilarityThreshold?: number;
}

type ResolvedOptions = Required<
  Omit<IntelligenceEngineOptions, 'referenceTime' | 'observedAt' | 'sourceReliability'>
>;

const DEFAULT_OPTIONS: ResolvedOptions = {
  minimumIndependentSources: 2,
  convergenceWindowHours: 24,
  geographicPrecisionDegrees: 1,
  recentWindowHours: 6,
  baselineWindowHours: 24,
  velocityRatioThreshold: 2,
  topicSimilarityThreshold: 0.4,
};

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function sourceGroup(source: string): string {
  return source.trim().toLowerCase().replace(/^https?:\/\//, '').split(/[\s/:]/)[0] || 'unknown';
}

function parseTimestamp(value: string, label: string): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${label} must be a valid ISO date string`);
  return timestamp;
}

function topicTokens(observation: IntelligenceObservation): Set<string> {
  const text = `${observation.title} ${observation.summary ?? ''} ${observation.tags.join(' ')}`;
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
  );
}

function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

function signalId(family: string, observationIds: string[]): string {
  return `sig_${hash({
    family,
    observationIds: [...observationIds].sort(),
    method: METHOD_VERSION,
  }).slice(0, 24)}`;
}

function scoreFromObservations(
  observations: IntelligenceObservation[],
  confidence: number,
  novelty: number,
  referenceTime: number
): SignalScores {
  const maxSeverity = observations.reduce(
    (current, observation) => Math.max(current, SEVERITY_WEIGHT[observation.severity]),
    0
  );
  const timestamps = observations
    .map((observation) => Date.parse(observation.occurredAt))
    .filter(Number.isFinite);
  const recentTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : referenceTime;
  const ageHours = Math.max(0, (referenceTime - recentTimestamp) / HOUR_MS);

  return {
    confidence: clamp(confidence),
    impact: clamp(maxSeverity),
    urgency: clamp(1 - ageHours / 72),
    novelty: clamp(novelty),
  };
}

export function normalizeIncidents(
  incidents: NormalizedIncident[],
  options: Pick<IntelligenceEngineOptions, 'sourceReliability' | 'observedAt'> = {}
): IntelligenceObservation[] {
  const observedAt = options.observedAt ?? new Date().toISOString();
  parseTimestamp(observedAt, 'observedAt');

  return incidents.map((incident) => {
    parseTimestamp(incident.occurredAt, 'incident.occurredAt');
    const canonical = {
      source: incident.source,
      sourceId: incident.sourceId,
      title: incident.title.trim(),
      summary: incident.summary?.trim(),
      domain: incident.domain.trim().toLowerCase(),
      severity: incident.severity,
      occurredAt: incident.occurredAt,
      lat: incident.lat,
      lng: incident.lng,
      tags: [...incident.tags].map((tag) => tag.trim().toLowerCase()).sort(),
    };
    const contentHash = hash(canonical);
    const observationId = `obs_${contentHash.slice(0, 24)}`;
    const reliability = clamp(options.sourceReliability?.[incident.source] ?? 0.6);

    const evidence: EvidenceReference = {
      id: `ev_${hash({ observationId, source: incident.source, sourceId: incident.sourceId }).slice(0, 24)}`,
      observationId,
      source: incident.source,
      sourceRecordId: incident.sourceId,
      url: incident.url,
      capturedAt: observedAt,
      occurredAt: incident.occurredAt,
      reliability,
      independenceGroup: sourceGroup(incident.source),
      contentHash,
    };

    return {
      id: observationId,
      source: incident.source,
      sourceRecordId: incident.sourceId,
      title: incident.title.trim(),
      summary: incident.summary?.trim(),
      domain: incident.domain.trim().toLowerCase(),
      severity: incident.severity,
      occurredAt: incident.occurredAt,
      observedAt,
      latitude: incident.lat,
      longitude: incident.lng,
      tags: canonical.tags,
      contentHash,
      evidence: [evidence],
    };
  });
}

function deduplicateObservations(observations: IntelligenceObservation[]): IntelligenceObservation[] {
  const byId = new Map<string, IntelligenceObservation>();
  for (const observation of observations) {
    const existing = byId.get(observation.id);
    if (!existing) {
      byId.set(observation.id, observation);
      continue;
    }

    byId.set(observation.id, {
      ...existing,
      evidence: unique([...existing.evidence, ...observation.evidence].map((evidence) => evidence.id))
        .map((id) => [...existing.evidence, ...observation.evidence].find((evidence) => evidence.id === id)!),
    });
  }
  return [...byId.values()];
}

function clusterByTopic(
  observations: IntelligenceObservation[],
  threshold: number
): IntelligenceObservation[][] {
  const clusters: Array<{ domain: string; tokens: Set<string>; observations: IntelligenceObservation[] }> = [];

  for (const observation of observations) {
    const tokens = topicTokens(observation);
    let bestIndex = -1;
    let bestScore = 0;

    for (let index = 0; index < clusters.length; index += 1) {
      const cluster = clusters[index];
      if (cluster.domain !== observation.domain) continue;
      const score = jaccard(tokens, cluster.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    if (bestIndex >= 0 && bestScore >= threshold) {
      const cluster = clusters[bestIndex];
      cluster.observations.push(observation);
      cluster.tokens = new Set([...cluster.tokens, ...tokens]);
    } else {
      clusters.push({ domain: observation.domain, tokens, observations: [observation] });
    }
  }

  return clusters.map((cluster) => cluster.observations);
}

function detectSourceConvergence(
  observations: IntelligenceObservation[],
  options: ResolvedOptions,
  referenceTime: number
): IntelligenceSignal[] {
  const groups = clusterByTopic(observations, options.topicSimilarityThreshold);
  const signals: IntelligenceSignal[] = [];

  for (const group of groups) {
    const independentSources = unique(group.flatMap((observation) =>
      observation.evidence.map((evidence) => evidence.independenceGroup)
    ));
    if (independentSources.length < options.minimumIndependentSources) continue;

    const timestamps = group.map((observation) => Date.parse(observation.occurredAt));
    const timeSpanHours = timestamps.length > 1
      ? (Math.max(...timestamps) - Math.min(...timestamps)) / HOUR_MS
      : 0;
    if (timeSpanHours > options.convergenceWindowHours) continue;

    const observationIds = group.map((observation) => observation.id);
    const confidence = 0.45 + independentSources.length * 0.12 + Math.min(group.length, 5) * 0.05;

    signals.push({
      id: signalId('SOURCE_CONVERGENCE', observationIds),
      family: 'SOURCE_CONVERGENCE',
      title: `Independent-source convergence: ${group[0].domain}`,
      summary: `${independentSources.length} independent source groups reported ${group.length} related observations within ${Number(timeSpanHours.toFixed(1))} hours.`,
      detectedAt: new Date(referenceTime).toISOString(),
      methodVersion: METHOD_VERSION,
      scores: scoreFromObservations(group, confidence, 0.55, referenceTime),
      observationIds,
      evidenceIds: group.flatMap((observation) => observation.evidence.map((evidence) => evidence.id)),
      dimensions: {
        independentSources,
        sourceCount: independentSources.length,
        observationCount: group.length,
        timeSpanHours: Number(timeSpanHours.toFixed(2)),
        topicSimilarityThreshold: options.topicSimilarityThreshold,
      },
    });
  }

  return signals;
}

function detectGeographicConvergence(
  observations: IntelligenceObservation[],
  options: ResolvedOptions,
  referenceTime: number
): IntelligenceSignal[] {
  const groups = new Map<string, IntelligenceObservation[]>();
  const precision = options.geographicPrecisionDegrees;

  for (const observation of observations) {
    if (observation.latitude === undefined || observation.longitude === undefined) continue;
    const latBucket = Math.round(observation.latitude / precision) * precision;
    const lngBucket = Math.round(observation.longitude / precision) * precision;
    const key = `${latBucket.toFixed(3)},${lngBucket.toFixed(3)}`;
    groups.set(key, [...(groups.get(key) ?? []), observation]);
  }

  const signals: IntelligenceSignal[] = [];
  for (const [locationBucket, group] of groups) {
    const independentSources = unique(group.flatMap((observation) =>
      observation.evidence.map((evidence) => evidence.independenceGroup)
    ));
    if (independentSources.length < options.minimumIndependentSources) continue;

    const timestamps = group.map((observation) => Date.parse(observation.occurredAt));
    const timeSpanHours = timestamps.length > 1
      ? (Math.max(...timestamps) - Math.min(...timestamps)) / HOUR_MS
      : 0;
    if (timeSpanHours > options.convergenceWindowHours) continue;

    const observationIds = group.map((observation) => observation.id);
    signals.push({
      id: signalId('GEOGRAPHIC_CONVERGENCE', observationIds),
      family: 'GEOGRAPHIC_CONVERGENCE',
      title: 'Geographic activity convergence',
      summary: `${group.length} observations from ${independentSources.length} independent source groups converged near ${locationBucket}.`,
      detectedAt: new Date(referenceTime).toISOString(),
      methodVersion: METHOD_VERSION,
      scores: scoreFromObservations(group, 0.5 + independentSources.length * 0.1, 0.5, referenceTime),
      observationIds,
      evidenceIds: group.flatMap((observation) => observation.evidence.map((evidence) => evidence.id)),
      dimensions: {
        locationBucket,
        precisionDegrees: precision,
        independentSources,
        observationCount: group.length,
        timeSpanHours: Number(timeSpanHours.toFixed(2)),
      },
    });
  }

  return signals;
}

function detectVelocitySpikes(
  observations: IntelligenceObservation[],
  options: ResolvedOptions,
  referenceTime: number
): IntelligenceSignal[] {
  const byDomain = new Map<string, IntelligenceObservation[]>();
  for (const observation of observations) {
    byDomain.set(observation.domain, [...(byDomain.get(observation.domain) ?? []), observation]);
  }

  const signals: IntelligenceSignal[] = [];
  const recentStart = referenceTime - options.recentWindowHours * HOUR_MS;
  const baselineStart = recentStart - options.baselineWindowHours * HOUR_MS;

  for (const [domain, group] of byDomain) {
    const recent = group.filter((observation) => {
      const timestamp = Date.parse(observation.occurredAt);
      return timestamp >= recentStart && timestamp <= referenceTime;
    });
    const baseline = group.filter((observation) => {
      const timestamp = Date.parse(observation.occurredAt);
      return timestamp >= baselineStart && timestamp < recentStart;
    });

    if (recent.length < 3) continue;

    const recentRate = recent.length / options.recentWindowHours;
    const baselineRate = baseline.length / options.baselineWindowHours;
    const ratio = baselineRate === 0 ? recent.length : recentRate / baselineRate;
    if (ratio < options.velocityRatioThreshold) continue;

    const observationIds = recent.map((observation) => observation.id);
    signals.push({
      id: signalId('VELOCITY_SPIKE', observationIds),
      family: 'VELOCITY_SPIKE',
      title: `Activity velocity spike: ${domain}`,
      summary: `${recent.length} observations occurred during the recent ${options.recentWindowHours}-hour window, a ${Number(ratio.toFixed(2))}x rate relative to the baseline window.`,
      detectedAt: new Date(referenceTime).toISOString(),
      methodVersion: METHOD_VERSION,
      scores: scoreFromObservations(
        recent,
        0.55 + Math.min(ratio, 5) * 0.08,
        Math.min(1, ratio / 5),
        referenceTime
      ),
      observationIds,
      evidenceIds: recent.flatMap((observation) => observation.evidence.map((evidence) => evidence.id)),
      dimensions: {
        domain,
        recentCount: recent.length,
        baselineCount: baseline.length,
        recentWindowHours: options.recentWindowHours,
        baselineWindowHours: options.baselineWindowHours,
        rateRatio: Number(ratio.toFixed(3)),
      },
    });
  }

  return signals;
}

function detectCollectionInsufficiency(
  observations: IntelligenceObservation[],
  options: ResolvedOptions,
  referenceTime: number
): IntelligenceSignal[] {
  const independentSources = unique(observations.flatMap((observation) =>
    observation.evidence.map((evidence) => evidence.independenceGroup)
  ));
  if (observations.length >= 3 && independentSources.length >= options.minimumIndependentSources) return [];

  const observationIds = observations.map((observation) => observation.id);
  return [{
    id: signalId('COLLECTION_INSUFFICIENCY', observationIds),
    family: 'COLLECTION_INSUFFICIENCY',
    title: 'Collection is insufficient for confident assessment',
    summary: `The analysis contains ${observations.length} observations from ${independentSources.length} independent source groups. Low collection volume must not be interpreted as low risk.`,
    detectedAt: new Date(referenceTime).toISOString(),
    methodVersion: METHOD_VERSION,
    scores: {
      confidence: 1,
      impact: 0.4,
      urgency: 0.7,
      novelty: 0.2,
    },
    observationIds,
    evidenceIds: observations.flatMap((observation) => observation.evidence.map((evidence) => evidence.id)),
    dimensions: {
      observationCount: observations.length,
      independentSourceCount: independentSources.length,
      minimumIndependentSources: options.minimumIndependentSources,
    },
  }];
}

export function analyzeIncidents(
  incidents: NormalizedIncident[],
  engineOptions: IntelligenceEngineOptions = {}
): IntelligenceAnalysisResult {
  const options: ResolvedOptions = { ...DEFAULT_OPTIONS, ...engineOptions };
  const incidentTimestamps = incidents
    .map((incident) => Date.parse(incident.occurredAt))
    .filter(Number.isFinite);
  const referenceTime = engineOptions.referenceTime
    ? parseTimestamp(engineOptions.referenceTime, 'referenceTime')
    : incidentTimestamps.length > 0
      ? Math.max(...incidentTimestamps)
      : Date.now();
  const observedAt = engineOptions.observedAt ?? new Date(referenceTime).toISOString();
  const observations = deduplicateObservations(normalizeIncidents(incidents, {
    sourceReliability: engineOptions.sourceReliability,
    observedAt,
  }));

  const signals = [
    ...detectSourceConvergence(observations, options, referenceTime),
    ...detectGeographicConvergence(observations, options, referenceTime),
    ...detectVelocitySpikes(observations, options, referenceTime),
    ...detectCollectionInsufficiency(observations, options, referenceTime),
  ].sort((a, b) => {
    const aPriority = a.scores.confidence * a.scores.impact * a.scores.urgency;
    const bPriority = b.scores.confidence * b.scores.impact * b.scores.urgency;
    return bPriority - aPriority || a.id.localeCompare(b.id);
  });

  return {
    generatedAt: new Date(referenceTime).toISOString(),
    methodVersion: METHOD_VERSION,
    observations,
    signals,
    coverage: {
      incidentCount: incidents.length,
      sourceCount: unique(observations.map((observation) => sourceGroup(observation.source))).length,
      evidenceCount: observations.reduce((count, observation) => count + observation.evidence.length, 0),
      signalCount: signals.length,
    },
  };
}
