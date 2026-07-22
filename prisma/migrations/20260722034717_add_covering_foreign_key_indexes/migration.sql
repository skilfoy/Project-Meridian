CREATE INDEX IF NOT EXISTS "User_orgId_idx" ON "User"("orgId");
CREATE INDEX IF NOT EXISTS "Dashboard_orgId_idx" ON "Dashboard"("orgId");
CREATE INDEX IF NOT EXISTS "Dashboard_userId_idx" ON "Dashboard"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_orgId_idx" ON "AuditLog"("orgId");
