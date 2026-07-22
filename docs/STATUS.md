# Project Meridian Delivery Status

Updated: 2026-07-22

## Strategic objective

Meridian is the canonical evidence-centered intelligence engine for ASDF, Leviathan, JackalProof, and future products. Deterministic evidence processing remains authoritative. Provider-neutral AI supports synthesis, explanation, forecasting, and interaction.

## Current phase

**Phase 1: Production commissioning and engineering hardening**

Status: In progress
Branch: `phase-1-production-commissioning`
Pull request: #2

## Completed baseline

- Active Supabase PostgreSQL production project
- Tracked Prisma migrations
- Clerk-backed tenant provisioning
- Strict credential-encryption validation
- Canonical observation, evidence, signal, and analysis contracts
- Deterministic normalization, hashing, deduplication, convergence, geographic clustering, velocity detection, and collection-gap signals
- Transactional intelligence-run persistence
- Collection-to-analysis orchestration
- Historical run comparison
- Signal Center and provenance inspection
- Persistent investigation cases and analyst notes
- GitHub Actions validation
- Vercel production deployment from `main`

## Active execution sequence

1. Production readiness and health semantics
2. Vendor-neutral dependency and environment cleanup
3. Secure runtime configuration and production smoke tests
4. Source capability and health contracts
5. Resilient collection controls
6. Tenant-isolation and release gates
7. Entity, assertion, alias, and relationship graph foundation

## Delivery states

### In progress

- Phase 1 roadmap recentering and production commissioning
- Readiness and health semantics
- Anthropic dependency removal

### Ready

- Production runtime smoke tests
- Source capability registry
- Source health read model and API
- Circuit breaker and last-known-good controls
- Tenant-isolation tests
- Migration drift validation
- Structured logging and request correlation
- Canonical entity and relationship schema

### Blocked by external configuration

- Production readiness returning HTTP 200 requires a valid `ENCRYPTION_MASTER_SECRET` in Vercel.
- Authenticated production persistence tests require working Clerk and database runtime configuration.
- Redis-backed cache and recurring collection tests require Upstash or another Redis runtime.

### Deferred

- Supabase Auth migration decision
- Dedicated graph database evaluation
- MapLibre and deck.gl modernization
- MCP and external SDK release

## Completion evidence

Work is complete only when all applicable evidence exists:

- implementation commit
- acceptance criteria satisfied
- type checking passes
- deterministic verification passes
- production build passes
- database migration applied and tracked when required
- Vercel deployment succeeds when applicable
- runtime smoke test succeeds when applicable
- documentation and rollback notes updated

## Sources of truth

- Strategy and phase architecture: `docs/DEVELOPMENT_PLAN.md`
- Current delivery state: `docs/STATUS.md`
- Executable work and acceptance criteria: GitHub Issues
- Active integration scope: current pull request
- Architecture decisions: `docs/decisions/`
- Completion evidence: commits, CI, Vercel, and Supabase migrations
