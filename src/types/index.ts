export type Plan = 'FREE' | 'ANALYST' | 'TEAM' | 'ENTERPRISE';
export type Role = 'OWNER' | 'ADMIN' | 'ANALYST' | 'VIEWER' | 'EMBED';
export type TLP = 'WHITE' | 'GREEN' | 'AMBER' | 'RED';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface OrgContext {
  orgId: string;
  userId: string;
  plan: Plan;
  role: Role;
}

export interface Theater {
  id: string;
  name: string;
  shortName: string;
  description: string;
  lat: number;
  lng: number;
  zoom: number;
  countries: string[];
  color: string;
}

export interface TheaterIntel {
  theaterId: string;
  summary: string;
  threatLevel: Severity;
  keyDevelopments: string[];
  watchItems: string[];
  generatedAt: string;
  cachedAt?: string;
}
