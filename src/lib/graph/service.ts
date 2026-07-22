import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import {
  assertConfidence,
  assertExclusiveTarget,
  type CreateGraphAssertionInput,
  type CreateGraphEntityInput,
  type CreateGraphEvidenceLinkInput,
  type CreateGraphRelationshipInput,
} from './contracts';

function asDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return date;
}

async function requireEntities(orgId: string, entityIds: string[]): Promise<void> {
  const uniqueIds = [...new Set(entityIds)];
  const count = await db.graphEntity.count({ where: { orgId, id: { in: uniqueIds } } });
  if (count !== uniqueIds.length) throw new Error('One or more graph entities do not belong to this tenant');
}

export async function searchGraphEntities(orgId: string, query?: string, limit = 50) {
  const take = Math.min(Math.max(limit, 1), 100);
  return db.graphEntity.findMany({
    where: {
      orgId,
      ...(query
        ? {
            OR: [
              { canonicalName: { contains: query, mode: 'insensitive' } },
              { aliases: { some: { alias: { contains: query, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    include: { aliases: true },
    orderBy: [{ canonicalName: 'asc' }],
    take,
  });
}

export async function upsertGraphEntity(orgId: string, input: CreateGraphEntityInput) {
  const entityType = input.entityType.trim().toUpperCase();
  const canonicalName = input.canonicalName.trim();
  if (!entityType || !canonicalName) throw new Error('entityType and canonicalName are required');
  const confidence = input.confidence ?? 1;
  assertConfidence(confidence);

  return db.$transaction(async (tx) => {
    const entity = await tx.graphEntity.upsert({
      where: { orgId_entityType_canonicalName: { orgId, entityType, canonicalName } },
      create: {
        orgId,
        entityType,
        canonicalName,
        description: input.description,
        attributes: input.attributes as Prisma.InputJsonValue | undefined,
        confidence,
        reviewState: input.reviewState ?? 'UNREVIEWED',
        validFrom: asDate(input.validFrom),
        validTo: asDate(input.validTo),
      },
      update: {
        description: input.description,
        attributes: input.attributes as Prisma.InputJsonValue | undefined,
        confidence,
        reviewState: input.reviewState,
        validFrom: asDate(input.validFrom),
        validTo: asDate(input.validTo),
      },
    });

    for (const aliasInput of input.aliases ?? []) {
      const alias = aliasInput.alias.trim();
      if (!alias) continue;
      const aliasConfidence = aliasInput.confidence ?? 1;
      assertConfidence(aliasConfidence, 'alias confidence');
      await tx.graphAlias.upsert({
        where: { orgId_entityId_alias: { orgId, entityId: entity.id, alias } },
        create: {
          orgId,
          entityId: entity.id,
          alias,
          aliasType: aliasInput.aliasType ?? 'NAME',
          source: aliasInput.source,
          confidence: aliasConfidence,
        },
        update: {
          aliasType: aliasInput.aliasType,
          source: aliasInput.source,
          confidence: aliasConfidence,
        },
      });
    }

    return tx.graphEntity.findUniqueOrThrow({ where: { id: entity.id }, include: { aliases: true } });
  });
}

export async function createGraphAssertion(orgId: string, input: CreateGraphAssertionInput) {
  assertExclusiveTarget(
    input.objectEntityId,
    input.objectValue,
    'Exactly one of objectEntityId or objectValue is required'
  );
  assertConfidence(input.confidence);
  await requireEntities(orgId, [input.subjectEntityId, ...(input.objectEntityId ? [input.objectEntityId] : [])]);

  return db.graphAssertion.create({
    data: {
      orgId,
      subjectEntityId: input.subjectEntityId,
      predicate: input.predicate.trim(),
      objectEntityId: input.objectEntityId,
      objectValue: input.objectValue as Prisma.InputJsonValue | undefined,
      assertionState: input.assertionState ?? 'ACTIVE',
      confidence: input.confidence,
      source: input.source.trim(),
      sourceRecordId: input.sourceRecordId,
      validFrom: asDate(input.validFrom),
      validTo: asDate(input.validTo),
      observedAt: asDate(input.observedAt)!,
    },
  });
}

export async function createGraphRelationship(orgId: string, input: CreateGraphRelationshipInput) {
  assertConfidence(input.confidence);
  await requireEntities(orgId, [input.fromEntityId, input.toEntityId]);

  return db.graphRelationship.create({
    data: {
      orgId,
      fromEntityId: input.fromEntityId,
      toEntityId: input.toEntityId,
      relationshipType: input.relationshipType.trim().toUpperCase(),
      direction: input.direction ?? 'DIRECTED',
      confidence: input.confidence,
      reviewState: input.reviewState ?? 'UNREVIEWED',
      validFrom: asDate(input.validFrom),
      validTo: asDate(input.validTo),
      attributes: input.attributes as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function createGraphEvidenceLink(orgId: string, input: CreateGraphEvidenceLinkInput) {
  assertExclusiveTarget(
    input.assertionId,
    input.relationshipId,
    'Exactly one of assertionId or relationshipId is required'
  );
  const weight = input.weight ?? 1;
  assertConfidence(weight, 'weight');

  const [assertion, relationship, evidence] = await Promise.all([
    input.assertionId
      ? db.graphAssertion.findFirst({ where: { id: input.assertionId, orgId }, select: { id: true } })
      : null,
    input.relationshipId
      ? db.graphRelationship.findFirst({ where: { id: input.relationshipId, orgId }, select: { id: true } })
      : null,
    db.intelligenceEvidenceRecord.findFirst({
      where: { id: input.evidenceRecordId, orgId },
      select: { id: true },
    }),
  ]);

  if (input.assertionId && !assertion) throw new Error('Assertion does not belong to this tenant');
  if (input.relationshipId && !relationship) throw new Error('Relationship does not belong to this tenant');
  if (!evidence) throw new Error('Evidence does not belong to this tenant');

  return db.graphEvidenceLink.create({
    data: {
      orgId,
      assertionId: input.assertionId,
      relationshipId: input.relationshipId,
      evidenceRecordId: input.evidenceRecordId,
      stance: input.stance ?? 'SUPPORTS',
      weight,
    },
  });
}

export async function getGraphNeighborhood(orgId: string, entityId: string, limit = 100) {
  const entity = await db.graphEntity.findFirst({
    where: { id: entityId, orgId },
    include: { aliases: true },
  });
  if (!entity) return null;

  const take = Math.min(Math.max(limit, 1), 250);
  const [assertions, outgoing, incoming] = await Promise.all([
    db.graphAssertion.findMany({
      where: { orgId, OR: [{ subjectEntityId: entityId }, { objectEntityId: entityId }] },
      include: { evidenceLinks: { include: { evidence: true } } },
      orderBy: { observedAt: 'desc' },
      take,
    }),
    db.graphRelationship.findMany({
      where: { orgId, fromEntityId: entityId },
      include: { toEntity: { include: { aliases: true } }, evidenceLinks: { include: { evidence: true } } },
      orderBy: { updatedAt: 'desc' },
      take,
    }),
    db.graphRelationship.findMany({
      where: { orgId, toEntityId: entityId },
      include: { fromEntity: { include: { aliases: true } }, evidenceLinks: { include: { evidence: true } } },
      orderBy: { updatedAt: 'desc' },
      take,
    }),
  ]);

  return { entity, assertions, relationships: { outgoing, incoming } };
}
