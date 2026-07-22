# Project Meridian Delivery Status

Updated: 2026-07-22

## Strategic objective

Meridian is the canonical evidence-centered intelligence engine for ASDF, Leviathan, JackalProof, and future products. Deterministic evidence processing remains authoritative. Provider-neutral AI supports synthesis, explanation, forecasting, and interaction.

## Current phase

**Phase 1: Production commissioning and engineering hardening**

Status: In progress  
Branch: `phase-1-production-commissioning`  
Pull request: #2  
Epic: #3

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

## Active work ledger

| State | Issue | Workstream | Dependency |
|---|---:|---|---|
| In progress | #4 | Production readiness and authenticated smoke tests | Vercel runtime configuration |
| In progress | #5 | Provider-neutral cleanup and CI hardening | None |
| Ready | #6 | Source capability registry and health contracts | Existing feed registry |
| Ready | #7 | Circuit breakers, stale-on-error, and last-known-good data | #6 |
| Ready | #8 | Tenant-isolation tests and release gates | Isolated test database |
| Ready | #9 | Structured logs, correlation IDs, and error reporting | Optional telemetry configuration |
| Ready | #10 | Canonical entity, assertion, alias, and relationship graph | #6 for source reliability metadata |

## Intended execution sequence

1. Complete #5 and the code portion of #4.
2. Finish #4 production configuration and runtime validation.
3. Implement #6 source contracts and health visibility.
4. Implement #7 collection resilience.
5. Advance #8 and #9 engineering controls.
6. Implement #10 graph foundation.

## Blocked by external configuration

- Production readiness returning HTTP 200 requires a valid `ENCRYPTION_MASTER_SECRET` in Vercel.
- Authenticated production persistence tests require working Clerk and database runtime configuration.
- Redis-backed cache and recurring collection tests require Upstash or another Redis runtime.
- Destructive tenant-isolation testing requires an isolated database or disposable Supabase branch.

## Deferred

- Supabase Auth migration decision
- Dedicated graph database evaluation
- MapLibre and deck.gl modernization
- MCP and external SDK release

## Completion evidence

Work is complete only when all applicable evidence exists:

- implementation commit
- acceptance criteria satisfied
- type checking passes
- deterministic intelligence verification passes
- feed or registry verification passes when applicable
- production build passes
- database migration applied and tracked when required
- Vercel deployment succeeds when applicable
- runtime smoke test succeeds when applicable
- documentation and rollback notes are updated

## Workflow

1. An epic defines a durable phase or capability outcome.
2. Work items define scope, acceptance criteria, dependencies, completion evidence, and rollback.
3. The active pull request identifies the integration boundary.
4. Commits and migrations provide implementation evidence.
5. CI, Vercel, and Supabase provide validation evidence.
6. `docs/STATUS.md` records current state and sequencing.
7. Architecture Decision Records preserve consequential decisions.

## Sources of truth

- Strategy and phase architecture: `docs/DEVELOPMENT_PLAN.md`
- Current delivery state: `docs/STATUS.md`
- Executable work and acceptance criteria: GitHub Issues
- Active integration scope: current pull request
- Architecture decisions: `docs/decisions/`
- Completion evidence: commits, CI, Vercel, and Supabase migrations
