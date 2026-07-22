import type { Severity } from '@/types';

export type ISODateString = string;

export interface EvidenceReference {
  id: string;
  observationId: string;
  source: string;
  sourceRecordId?: string;
  url?: string;
  capturedAt: ISODateString;
  occurredAt: ISODateString;
  reliability: number;
  independenceGroup: string;
  contentHash: string;
}

export interface IntelligenceObservation {
  id: string;
  source: string;
  sourceRecordId?: string;
  title: string;
  summary?: string;
  domain: string;
  severity: Severity;
  occurredAt: ISODateString;
  observedAt: ISODateString;
  latitude?: number;
  longitude?: number;
  tags: string[];
  contentHash: string;
  evidence: EvidenceReference[];
}

export type SignalFamily =
  | 'SOURCE_CONVERGENCE'
  | 'GEOGRAPHIC_CONVERGENCE'
  | 'VELOCITY_SPIKE'
  | 'SOURCE_CONTRADICTION'
  | 'WATCHLIST_ESCALATION'
  | 'COLLECTION_INSUFFICIENCY';

export interface SignalScores {
  confidence: number;
  impact: number;
  urgency: number;
  novelty: number;
}

export interface IntelligenceSignal {
  id: string;
  family: SignalFamily;
  title: string;
  summary: string;
  detectedAt: ISODateString;
  methodVersion: string;
  scores: SignalScores;
  observationIds: string[];
  evidenceIds: string[];
  dimensions: Record<string, string | number | boolean | string[]>;
}

export interface IntelligenceAnalysisResult {
  generatedAt: ISODateString;
  methodVersion: string;
  observations: IntelligenceObservation[];
  signals: IntelligenceSignal[];
  coverage: {
    incidentCount: number;
    sourceCount: number;
    evidenceCount: number;
    signalCount: number;
  };
}
