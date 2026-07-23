export type GraphEvidenceStance = 'SUPPORTS' | 'CONTRADICTS' | 'CONTEXT';

export interface CreateGraphEntityInput {
  entityType: string;
  canonicalName: string;
  description?: string;
  attributes?: Record<string, unknown>;
  confidence?: number;
  reviewState?: string;
  validFrom?: string;
  validTo?: string;
  aliases?: Array<{ alias: string; aliasType?: string; source?: string; confidence?: number }>;
}

export interface CreateGraphAssertionInput {
  subjectEntityId: string;
  predicate: string;
  objectEntityId?: string;
  objectValue?: unknown;
  assertionState?: string;
  confidence: number;
  source: string;
  sourceRecordId?: string;
  validFrom?: string;
  validTo?: string;
  observedAt: string;
}

export interface CreateGraphRelationshipInput {
  fromEntityId: string;
  toEntityId: string;
  relationshipType: string;
  direction?: string;
  confidence: number;
  reviewState?: string;
  validFrom?: string;
  validTo?: string;
  attributes?: Record<string, unknown>;
}

export interface CreateGraphEvidenceLinkInput {
  assertionId?: string;
  relationshipId?: string;
  evidenceRecordId: string;
  stance?: GraphEvidenceStance;
  weight?: number;
}

export function assertExclusiveTarget(left: unknown, right: unknown, message: string): void {
  const count = Number(left !== undefined && left !== null) + Number(right !== undefined && right !== null);
  if (count !== 1) throw new Error(message);
}

export function assertConfidence(value: number, field = 'confidence'): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${field} must be between 0 and 1`);
  }
}
