CREATE TABLE "GraphEntity" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "canonicalName" TEXT NOT NULL,
  "description" TEXT,
  "attributes" JSONB,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "reviewState" TEXT NOT NULL DEFAULT 'UNREVIEWED',
  "validFrom" TIMESTAMP(3),
  "validTo" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GraphEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GraphAlias" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "aliasType" TEXT NOT NULL DEFAULT 'NAME',
  "source" TEXT,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GraphAlias_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GraphAssertion" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "subjectEntityId" TEXT NOT NULL,
  "predicate" TEXT NOT NULL,
  "objectEntityId" TEXT,
  "objectValue" JSONB,
  "assertionState" TEXT NOT NULL DEFAULT 'ACTIVE',
  "confidence" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL,
  "sourceRecordId" TEXT,
  "validFrom" TIMESTAMP(3),
  "validTo" TIMESTAMP(3),
  "observedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GraphAssertion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GraphRelationship" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "fromEntityId" TEXT NOT NULL,
  "toEntityId" TEXT NOT NULL,
  "relationshipType" TEXT NOT NULL,
  "direction" TEXT NOT NULL DEFAULT 'DIRECTED',
  "confidence" DOUBLE PRECISION NOT NULL,
  "reviewState" TEXT NOT NULL DEFAULT 'UNREVIEWED',
  "validFrom" TIMESTAMP(3),
  "validTo" TIMESTAMP(3),
  "attributes" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GraphRelationship_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GraphEvidenceLink" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "assertionId" TEXT,
  "relationshipId" TEXT,
  "evidenceRecordId" TEXT NOT NULL,
  "stance" TEXT NOT NULL DEFAULT 'SUPPORTS',
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GraphEvidenceLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GraphEntity_orgId_entityType_canonicalName_key" ON "GraphEntity"("orgId", "entityType", "canonicalName");
CREATE INDEX "GraphEntity_orgId_entityType_idx" ON "GraphEntity"("orgId", "entityType");
CREATE INDEX "GraphEntity_orgId_reviewState_idx" ON "GraphEntity"("orgId", "reviewState");

CREATE UNIQUE INDEX "GraphAlias_orgId_entityId_alias_key" ON "GraphAlias"("orgId", "entityId", "alias");
CREATE INDEX "GraphAlias_orgId_alias_idx" ON "GraphAlias"("orgId", "alias");

CREATE INDEX "GraphAssertion_orgId_subjectEntityId_predicate_idx" ON "GraphAssertion"("orgId", "subjectEntityId", "predicate");
CREATE INDEX "GraphAssertion_orgId_objectEntityId_idx" ON "GraphAssertion"("orgId", "objectEntityId");
CREATE INDEX "GraphAssertion_orgId_observedAt_idx" ON "GraphAssertion"("orgId", "observedAt");

CREATE INDEX "GraphRelationship_orgId_fromEntityId_relationshipType_idx" ON "GraphRelationship"("orgId", "fromEntityId", "relationshipType");
CREATE INDEX "GraphRelationship_orgId_toEntityId_relationshipType_idx" ON "GraphRelationship"("orgId", "toEntityId", "relationshipType");
CREATE INDEX "GraphRelationship_orgId_validFrom_validTo_idx" ON "GraphRelationship"("orgId", "validFrom", "validTo");

CREATE UNIQUE INDEX "GraphEvidenceLink_assertionId_relationshipId_evidenceRecordId_key" ON "GraphEvidenceLink"("assertionId", "relationshipId", "evidenceRecordId");
CREATE INDEX "GraphEvidenceLink_orgId_evidenceRecordId_idx" ON "GraphEvidenceLink"("orgId", "evidenceRecordId");

ALTER TABLE "GraphEntity" ADD CONSTRAINT "GraphEntity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphAlias" ADD CONSTRAINT "GraphAlias_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphAlias" ADD CONSTRAINT "GraphAlias_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "GraphEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphAssertion" ADD CONSTRAINT "GraphAssertion_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphAssertion" ADD CONSTRAINT "GraphAssertion_subjectEntityId_fkey" FOREIGN KEY ("subjectEntityId") REFERENCES "GraphEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphAssertion" ADD CONSTRAINT "GraphAssertion_objectEntityId_fkey" FOREIGN KEY ("objectEntityId") REFERENCES "GraphEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GraphRelationship" ADD CONSTRAINT "GraphRelationship_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphRelationship" ADD CONSTRAINT "GraphRelationship_fromEntityId_fkey" FOREIGN KEY ("fromEntityId") REFERENCES "GraphEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphRelationship" ADD CONSTRAINT "GraphRelationship_toEntityId_fkey" FOREIGN KEY ("toEntityId") REFERENCES "GraphEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphEvidenceLink" ADD CONSTRAINT "GraphEvidenceLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphEvidenceLink" ADD CONSTRAINT "GraphEvidenceLink_assertionId_fkey" FOREIGN KEY ("assertionId") REFERENCES "GraphAssertion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphEvidenceLink" ADD CONSTRAINT "GraphEvidenceLink_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "GraphRelationship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GraphEvidenceLink" ADD CONSTRAINT "GraphEvidenceLink_evidenceRecordId_fkey" FOREIGN KEY ("evidenceRecordId") REFERENCES "IntelligenceEvidenceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GraphEntity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GraphAlias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GraphAssertion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GraphRelationship" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GraphEvidenceLink" ENABLE ROW LEVEL SECURITY;
