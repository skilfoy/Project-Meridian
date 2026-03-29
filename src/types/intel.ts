import type { Severity, TLP } from './index';

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  origin: string;
  motivation: string[];
  targetSectors: string[];
  knownTTPs: string[];
  tlp: TLP;
}

export interface CVEEntry {
  cveId: string;
  description: string;
  cvssScore: number;
  severity: Severity;
  publishedAt: string;
  affectedProducts: string[];
  references: string[];
}

export interface KEVEntry {
  cveId: string;
  vulnerabilityName: string;
  vendorProject: string;
  product: string;
  dateAdded: string;
  dueDate: string;
  requiredAction: string;
  notes?: string;
  knownRansomwareCampaignUse: boolean;
}

export interface DisasterEvent {
  id: string;
  type: string;
  title: string;
  country: string;
  lat?: number;
  lng?: number;
  severity: string;
  startDate: string;
  url?: string;
}
