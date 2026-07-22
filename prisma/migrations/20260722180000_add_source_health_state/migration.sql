ALTER TABLE "FeedConfig"
  ADD COLUMN "lastSuccessAt" TIMESTAMP(3),
  ADD COLUMN "lastFailureAt" TIMESTAMP(3),
  ADD COLUMN "staleServedAt" TIMESTAMP(3),
  ADD COLUMN "lastLatencyMs" INTEGER,
  ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "circuitState" TEXT NOT NULL DEFAULT 'CLOSED',
  ADD COLUMN "circuitOpenedAt" TIMESTAMP(3);

CREATE INDEX "FeedConfig_orgId_circuitState_idx"
  ON "FeedConfig"("orgId", "circuitState");

CREATE INDEX "FeedConfig_orgId_lastSuccessAt_idx"
  ON "FeedConfig"("orgId", "lastSuccessAt");
