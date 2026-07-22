import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import type { AggregatedFeedResult } from '@/types/feeds';
import type { IntelligenceAnalysisResult } from './types';

export interface PersistAnalysisInput {
  orgId: string;
  theaterId?: string;
  analysis: IntelligenceAnalysisResult;
  feedResult?: AggregatedFeedResult;
}

export interface PersistAnalysisResult {
  runId: string;
  observationCount: number;
  evidenceCount: number;
  signalCount: number;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function persistAnalysis(input: PersistAnalysisInput): Promise<PersistAnalysisResult> {
  const { orgId, theaterId, analysis, feedResult } = input;

  return db.$transaction(async (tx) => {
    const run = await tx.intelligenceRun.create({
      data: {
        orgId,
        theaterId,
        methodVersion: analysis.methodVersion,
        generatedAt: new Date(analysis.generatedAt),
        coverage: asJson(analysis.coverage),
        feedMeta: feedResult
          ? asJson({
              ...feedResult.meta,
              errors: feedResult.errors,
              feeds: feedResult.feedResults.map((result) => ({
                feedId: result.feedId,
                meta: result.meta,
              })),
            })
          : undefined,
      },
    });

    let evidenceCount = 0;

    for (const observation of analysis.observations) {
      const record = await tx.intelligenceObservationRecord.create({
        data: {
          orgId,
          runId: run.id,
          observationId: observation.id,
          source: observation.source,
          sourceRecordId: observation.sourceRecordId,
          title: observation.title,
          summary: observation.summary,
          domain: observation.domain,
          severity: observation.severity,
          occurredAt: new Date(observation.occurredAt),
          observedAt: new Date(observation.observedAt),
          latitude: observation.latitude,
          longitude: observation.longitude,
          tags: observation.tags,
          contentHash: observation.contentHash,
        },
      });

      if (observation.evidence.length > 0) {
        await tx.intelligenceEvidenceRecord.createMany({
          data: observation.evidence.map((evidence) => ({
            orgId,
            observationRecordId: record.id,
            evidenceId: evidence.id,
            source: evidence.source,
            sourceRecordId: evidence.sourceRecordId,
            url: evidence.url,
            capturedAt: new Date(evidence.capturedAt),
            occurredAt: new Date(evidence.occurredAt),
            reliability: evidence.reliability,
            independenceGroup: evidence.independenceGroup,
            contentHash: evidence.contentHash,
          })),
          skipDuplicates: true,
        });
        evidenceCount += observation.evidence.length;
      }
    }

    if (analysis.signals.length > 0) {
      await tx.intelligenceSignalRecord.createMany({
        data: analysis.signals.map((signal) => ({
          orgId,
          runId: run.id,
          signalId: signal.id,
          family: signal.family,
          title: signal.title,
          summary: signal.summary,
          detectedAt: new Date(signal.detectedAt),
          methodVersion: signal.methodVersion,
          scores: asJson(signal.scores),
          observationIds: signal.observationIds,
          evidenceIds: signal.evidenceIds,
          dimensions: asJson(signal.dimensions),
        })),
        skipDuplicates: true,
      });
    }

    return {
      runId: run.id,
      observationCount: analysis.observations.length,
      evidenceCount,
      signalCount: analysis.signals.length,
    };
  });
}
