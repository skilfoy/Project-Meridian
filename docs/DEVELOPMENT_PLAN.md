# Project Meridian Development Plan

## Product direction

Meridian is an evidence-centered strategic intelligence platform that detects cross-domain change, explains emerging risk, forecasts plausible developments, and converts heterogeneous signals into decision-ready assessments.

Meridian serves as the canonical intelligence engine for the broader platform ecosystem. ASDF, Leviathan, JackalProof, and future products should consume Meridian through stable services and contracts rather than maintaining separate collection, evidence, signal, and forecasting pipelines.

The platform differentiates through analytical depth, provenance, organizational context, entity and relationship intelligence, forecasting, scenario analysis, and analyst workflow rather than raw feed volume.

## Governing principles

- Deterministic evidence processing remains authoritative.
- Language models support synthesis, explanation, forecasting, and interaction through a provider-neutral interface.
- Every factual assertion remains traceable to collected evidence.
- Observation, inference, forecast, and recommendation remain distinguishable throughout the system.
- Every source has an owner, purpose, reliability class, freshness target, licensing posture, and retirement process.
- Core intelligence functions continue operating during optional-service degradation.
- Product surfaces consume shared contracts rather than duplicating analytical logic.
- AGPL platform code is not incorporated without deliberate licensing review.

## Current baseline

Phase 0 is complete and merged into `main`.

Delivered capabilities include:

- Active Supabase PostgreSQL production project and tracked migrations
- Clerk-backed tenant provisioning
- Strict encryption-secret validation
- Canonical observation, evidence, signal, and analysis contracts
- Deterministic normalization, hashing, deduplication, convergence, geographic clustering, velocity detection, and collection-gap signals
- Transactional intelligence-run persistence
- Collection-to-analysis orchestration
- Historical run comparison
- Signal Center overview and provenance APIs
- Investigation cases, assignment, disposition, watch status, acknowledgement, and analyst notes
- GitHub Actions validation for type checking, deterministic intelligence verification, and production builds
- Vercel production deployment from `main`

## Phase 1: Production commissioning and engineering hardening

### Objectives

- Complete the production runtime configuration.
- Separate mandatory readiness dependencies from optional capabilities.
- Remove residual Anthropic dependencies and documentation references.
- Validate authenticated persistence and collection against production Supabase.
- Establish source reliability, failure isolation, and operational visibility.
- Strengthen tenant isolation, migration controls, and release gates.

### Workstreams

#### Runtime commissioning

- Require database, authentication, and encryption for application readiness.
- Report Redis, queue workers, AI providers, telemetry, and billing as capability states.
- Configure the production encryption master secret directly in Vercel.
- Configure Upstash Redis or explicitly operate in cache-disabled mode.
- Validate `/api/ready` and `/api/health` against production dependencies.
- Run authenticated analysis and collection smoke tests.
- Verify persisted runs, observations, evidence, signals, feed state, and case workflows.

#### Dependency and toolchain hygiene

- Remove `@anthropic-ai/sdk` and obsolete Anthropic environment references.
- Maintain a provider-neutral AI adapter contract.
- Align TypeScript with the supported ESLint toolchain range.
- Upgrade GitHub Actions runtime versions.
- Triage dependency audit findings through targeted upgrades.
- Add a lockfile integrity check to CI.

#### Security and tenancy

- Add automated cross-tenant isolation tests.
- Verify Clerk webhook replay and signature handling.
- Validate encrypted credential rotation and malformed-payload handling.
- Add security headers and route-level authorization tests.
- Review repository visibility and production disclosure posture.

#### Release engineering

- Add migration validation to preview and production workflows.
- Add authenticated API smoke tests to CI or a protected post-deployment workflow.
- Establish release notes and rollback procedures.
- Add structured logs, request correlation IDs, and production error reporting.

### Exit criteria

- `/api/ready` returns HTTP 200 when mandatory platform services are available.
- `/api/health` accurately reports database and optional-service degradation.
- Authenticated analysis and collection persist successfully in production.
- No Anthropic-specific package or environment requirement remains.
- Tenant-isolation tests pass.
- Migration drift is detected automatically.
- Production deployment, smoke tests, and rollback procedures are documented and repeatable.

## Phase 2: Collection reliability and intelligence data plane

### Source capability registry

Each source is classified as:

- `PRODUCTION`
- `EXPERIMENTAL`
- `CREDENTIAL_REQUIRED`
- `PLANNED`

Every source record includes:

- owner
- domain and geographic coverage
- cadence and freshness target
- reliability and independence class
- licensing and attribution metadata
- cost budget
- expected record volume
- current health
- last successful collection
- circuit-breaker state
- last-known-good availability

### Data-plane expansion

Introduce or complete explicit models for:

- collection runs
- immutable raw observations
- source assertions
- normalized events
- evidence links
- collection health
- processing failures
- normalization versions
- source-reliability history

### Resilience controls

- bounded retries with jitter
- circuit breakers
- negative caching
- stale-on-error responses
- last-known-good retention
- idempotent ingestion
- content hashing
- duplicate clustering
- ingestion budgets
- per-source latency and cost telemetry

### Exit criteria

- Initial curated portfolio of 20 to 30 production-supported sources
- At least 95% success rate across core sources
- Every normalized event traces to immutable observations
- Feed failures preserve successful collection from other sources
- Collection gaps and freshness are visible to analysts
- Worker restarts produce no duplicate schedules or records

## Phase 3: Entity, assertion, and relationship graph

### Canonical entities

- people
- organizations
- governments
- threat actors
- malware and campaigns
- technologies and products
- infrastructure
- locations and regions
- industries and sectors
- financial instruments
- suppliers and dependencies
- strategic initiatives and organizational assets

### Graph capabilities

- aliases and identifiers
- deterministic and probabilistic entity resolution
- typed directed relationships
- temporal validity
- relationship confidence
- supporting and contradicting evidence
- source assertions and claim state
- entity merging and splitting
- graph traversal and neighborhood queries
- organizational exposure mapping

### Storage approach

Use PostgreSQL, PostGIS, pgvector, and relational edge tables as the initial graph substrate. Evaluate Apache AGE or a dedicated graph database after measured query patterns demonstrate a requirement.

### Exit criteria

- Every signal can reference canonical entities and relationships.
- Conflicting claims remain explicitly represented.
- Entity resolution is versioned and reviewable.
- Analysts can trace relationship provenance and temporal validity.
- Organizational exposure queries operate across the graph.

## Phase 4: Signal, correlation, and forecasting engine

### Signal families

- multi-source convergence
- independent-source triangulation
- narrative acceleration
- narrative fragmentation
- source contradiction
- state-media synchronization
- geographic convergence
- conflict escalation
- infrastructure disruption
- travel-advisory deterioration
- sanctions expansion
- cyber-geopolitical alignment
- maritime and aviation anomaly concentration
- market-news divergence
- commodity-geopolitical convergence
- prediction-market lead
- volatility regime transition
- watchlist escalation
- supplier and site exposure
- collection insufficiency

### Analytical controls

Each signal carries:

- evidence identifiers
- method version
- baseline reference
- confidence
- impact
- urgency
- novelty
- source independence
- corroborating and contradicting evidence
- collection sufficiency
- organizational relevance
- analyst disposition

### Forecasting

- probabilistic forecasts
- explicit time horizons
- resolution criteria
- scenario branches
- assumptions and drivers
- indicators and signposts
- Bayesian updates
- Brier scoring and calibration
- historical replay and backtesting

### Exit criteria

- Signal library operates against historical and live data.
- Signals can be replayed deterministically.
- Forecasts are measurable and calibrated.
- Analyst feedback updates quality metrics without rewriting historical evidence.

## Phase 5: Analyst experience and visualization

### Core surfaces

- Global Operations View
- Signal Center
- Intelligence Workbench
- Entity and Relationship Explorer
- Scenario Lab
- Briefing Studio
- Source Health and Intelligence Gaps

### Visualization modernization

- MapLibre and deck.gl flat map
- shared layer registry
- 3D globe using the same normalized data contracts
- temporal replay
- scalable event clustering
- entity and relationship overlays
- organizational exposure overlays
- interactive graph workspace

### Analyst workflow

- compare competing hypotheses
- request additional collection
- acknowledge, assign, investigate, monitor, and close cases
- preserve notes, revisions, and judgments
- save and share views
- generate evidence-linked briefings

### Exit criteria

- Analysts move from signal to evidence to assessment through one workflow.
- Views are restorable and shareable.
- Large event collections remain responsive.
- Collection gaps remain visible throughout analysis.

## Phase 6: Governed AI and agent orchestration

Implement a typed orchestration DAG with these stages:

- collection
- data quality
- entity resolution
- correlation
- risk
- forecast
- scenario
- briefing
- assurance

Every agent output preserves:

- evidence references
- method, model, and prompt versions
- confidence and known limitations
- observation, inference, forecast, and recommendation distinctions
- human-review state
- cost and latency telemetry

AI provider support remains modular and may include OpenAI-compatible services, OpenRouter, Azure OpenAI, Gemini, Groq, Kimi, Ollama, and future providers. Meridian continues operating deterministically when no provider is configured.

### Exit criteria

- Evaluation suites gate model and prompt changes.
- Unsupported factual claims score zero tolerance in the evaluation set.
- Provider changes require configuration rather than product rewrites.
- Human review and revision history remain auditable.

## Phase 7: Platform access and controlled beta

### Platform interfaces

- versioned REST API
- generated OpenAPI specification
- MCP server
- webhooks
- exports
- partner and internal SDKs
- stable service contracts for ASDF, Leviathan, JackalProof, and future products

### Beta operations

- role model and onboarding
- notification policies
- Slack and email delivery
- executive and analyst briefing exports
- backup and restoration test
- load and resilience testing
- security review
- product analytics
- structured beta feedback process

### Exit criteria

- Invited users complete defined intelligence workflows.
- Tenant isolation receives independent review.
- Backup restoration succeeds.
- Alert duplication remains below target.
- Core source freshness meets service objectives.
- Critical user journeys pass automated end-to-end tests.

## Architecture decisions

- Preserve Next.js and React for the application layer.
- Use Supabase PostgreSQL with PostGIS and pgvector.
- Use Upstash Redis for optional caching and queues.
- Run persistent BullMQ workers outside Vercel serverless functions.
- Use Zod schemas and generated OpenAPI contracts.
- Keep deterministic analysis authoritative.
- Maintain provider-neutral AI integration.
- Treat the knowledge graph as shared infrastructure rather than a UI-only feature.
- Keep product applications decoupled through versioned contracts.

## Quality metrics

### Data plane

- source success rate
- median and p95 data age
- collection latency
- records collected per source
- duplicate ratio
- normalization failure rate
- cache-hit rate
- last-known-good utilization
- geographic and domain coverage
- cost per thousand observations

### Intelligence quality

- signal precision and recall
- median lead time
- evidence completeness
- source diversity and independence
- contradiction-detection accuracy
- cluster purity
- analyst acceptance rate
- analyst confidence change
- forecast Brier score
- calibration by probability band

### Product and operations

- time from detection to assessment
- time to produce an executive brief
- case resolution time
- signals escalated, dismissed, or monitored
- user retention
- API and MCP usage
- cost per active analyst
- production availability

### Initial service targets

- 99.5% production availability
- 95% core-source success rate
- 100% signal evidence coverage
- less than 1% duplicate critical alerts
- cached API p95 below 500 milliseconds
- initial usable dashboard below 3 seconds
- zero unsupported factual claims in the evaluation suite

## Immediate execution sequence

1. Correct readiness and health semantics.
2. Remove residual Anthropic package and documentation references.
3. Complete secure production configuration.
4. Run production persistence and collection smoke tests.
5. Add source capability and health contracts.
6. Implement resilient collection controls.
7. Begin the entity, assertion, and relationship graph.
