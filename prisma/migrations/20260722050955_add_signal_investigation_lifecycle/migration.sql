CREATE TYPE "SignalCaseStatus" AS ENUM ('OPEN','ACKNOWLEDGED','INVESTIGATING','MONITORING','CLOSED');
CREATE TYPE "SignalDisposition" AS ENUM ('TRUE_POSITIVE','FALSE_POSITIVE','BENIGN','INFORMATIONAL','DUPLICATE','MITIGATED','ACCEPTED_RISK');

CREATE TABLE "SignalCase" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "signalKey" TEXT NOT NULL,
  "theaterId" TEXT,
  "family" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "SignalCaseStatus" NOT NULL DEFAULT 'OPEN',
  "disposition" "SignalDisposition",
  "acknowledgedAt" TIMESTAMPTZ,
  "acknowledgedBy" TEXT,
  "assignedTo" TEXT,
  "watched" BOOLEAN NOT NULL DEFAULT FALSE,
  "firstSeenAt" TIMESTAMPTZ NOT NULL,
  "lastSeenAt" TIMESTAMPTZ NOT NULL,
  "latestRunId" TEXT,
  "latestSignalId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SignalCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SignalCaseNote" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "SignalCaseNote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SignalCase_orgId_signalKey_key" ON "SignalCase"("orgId","signalKey");
CREATE INDEX "SignalCase_orgId_status_updatedAt_idx" ON "SignalCase"("orgId","status","updatedAt");
CREATE INDEX "SignalCase_orgId_watched_updatedAt_idx" ON "SignalCase"("orgId","watched","updatedAt");
CREATE INDEX "SignalCase_orgId_assignedTo_updatedAt_idx" ON "SignalCase"("orgId","assignedTo","updatedAt");
CREATE INDEX "SignalCaseNote_caseId_createdAt_idx" ON "SignalCaseNote"("caseId","createdAt");
CREATE INDEX "SignalCaseNote_orgId_createdAt_idx" ON "SignalCaseNote"("orgId","createdAt");

ALTER TABLE "SignalCase" ADD CONSTRAINT "SignalCase_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalCaseNote" ADD CONSTRAINT "SignalCaseNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalCaseNote" ADD CONSTRAINT "SignalCaseNote_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "SignalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SignalCase" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SignalCaseNote" ENABLE ROW LEVEL SECURITY;
