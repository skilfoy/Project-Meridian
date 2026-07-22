# Project Meridian Development Plan

## Product direction

Meridian is an evidence-centered strategic intelligence platform that detects cross-domain change, explains emerging risk, forecasts plausible developments, and converts heterogeneous signals into decision-ready assessments.

The platform should differentiate through analytical depth, provenance, organizational context, forecasting, scenario analysis, and analyst workflow rather than raw feed volume.

## Phase 0: Recovery and commissioning

### Objectives

- Restore the Supabase project and verify Prisma migrations.
- Configure Clerk, Redis, Anthropic, and encryption secrets in Vercel.
- Align application and database regions.
- Deploy the BullMQ worker on a persistent runtime.
- Validate production-supported feeds.
- Establish readiness, health, smoke testing, and operational documentation.

### Exit criteria

- `/api/ready` returns HTTP 200.
- `/api/health` returns HTTP 200.
- Authentication and organization provisioning work.
- Database and Redis connectivity pass.
- Production secrets contain no fallback values.
- Ten free feeds successfully return normalized records.
- Worker restarts do not duplicate recurring jobs.

## Phase 1: Engineering foundation

- GitHub Actions for lint, type checking, build, dependency audit, and smoke tests.
- Supabase row-level security and tenant-isolation tests.
- Structured logging, Sentry, and environment validation.
- Source capability registry with production, experimental, credential-required, and planned states.
- Migration and preview-deployment workflow.

## Phase 2: Intelligence data plane

Introduce explicit models for:

- Collection runs
- Raw observations
- Source assertions
- Normalized events
- Entities and aliases
- Relationships
- Evidence links
- Collection health

Add immutable content hashes, deduplication, provenance, geospatial enrichment, circuit breakers, negative caching, and last-known-good responses.

## Phase 3: Signal and correlation engine

Initial signal families:

- Multi-source convergence
- Independent-source triangulation
- Narrative acceleration
- Source contradiction
- Geographic convergence
- Market-news divergence
- Prediction-market lead
- Infrastructure disruption
- Watchlist escalation
- Collection insufficiency

Every signal must carry evidence identifiers, method version, confidence, impact, urgency, novelty, baseline reference, and collection-gap status.

## Phase 4: Analyst experience

- MapLibre/deck.gl flat map
- 3D globe sharing the same layer registry
- Signal Center
- Evidence drawer
- Intelligence Workbench
- Entity and relationship pages
- Source-health dashboard
- Historical replay
- Saved and shareable views

## Phase 5: Governed AI

Implement a typed orchestration pipeline with collection, data-quality, entity, correlation, risk, forecast, scenario, briefing, and assurance stages.

AI outputs must preserve:

- Evidence references
- Observation, inference, and forecast distinctions
- Model and prompt versions
- Confidence and known limitations
- Human-review state
- Cost and latency telemetry

## Phase 6: Controlled beta

- Role model and onboarding
- Notification rules and Slack or email delivery
- Executive and analyst briefing exports
- REST documentation and initial MCP interface
- Backup and restoration test
- Load test and security review
- Product analytics and beta feedback loop

## Architecture decisions

- Preserve Next.js and React.
- Use Supabase PostgreSQL with PostGIS and pgvector.
- Use Upstash Redis for caching and queues.
- Run one persistent BullMQ worker on a small DigitalOcean droplet or Railway service.
- Use Zod schemas and generated OpenAPI contracts.
- Keep deterministic analysis authoritative and use language models for synthesis, forecasting, and explanation.
- Avoid direct incorporation of AGPL platform code without deliberate licensing review.

## Quality metrics

### Data plane

- Source success rate
- Median data age
- Collection latency
- Duplicate ratio
- Normalization failure rate
- Cache-hit rate
- Last-known-good utilization

### Intelligence quality

- Signal precision and recall
- Median lead time
- Evidence completeness
- Source diversity
- Analyst acceptance rate
- Forecast Brier score
- Calibration by probability band

### Initial service targets

- 99.5% production availability
- 95% core-source success rate
- 100% signal evidence coverage
- Less than 1% duplicate critical alerts
- Cached API p95 below 500 milliseconds
- Zero unsupported factual claims in the evaluation suite
