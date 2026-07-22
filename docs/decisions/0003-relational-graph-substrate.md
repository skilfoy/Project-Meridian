# ADR 0003: Use PostgreSQL as the initial intelligence-graph substrate

- Status: Accepted
- Date: 2026-07-22
- Owners: Project Meridian
- Related issues: #3, #10
- Related pull requests: #2

## Context

Meridian needs canonical entities, aliases, source assertions, typed relationships, temporal validity, provenance, contradiction, and organizational exposure queries. The platform already uses Supabase PostgreSQL through Prisma. Introducing a dedicated graph database before measuring real traversal and scale requirements would add infrastructure, synchronization, tenancy, backup, and operational complexity.

## Decision

Meridian will implement the initial intelligence graph using PostgreSQL relational tables, PostGIS, pgvector, and indexed edge tables.

The initial graph model includes:

- tenant-scoped canonical entities
- aliases and external identifiers
- source assertions
- typed directed relationships
- confidence and review state
- valid-from and valid-to timestamps
- supporting and contradicting evidence links
- reversible entity merge and split records

Graph services will expose stable traversal and neighborhood contracts so the storage implementation can change without rewriting product surfaces.

A dedicated graph database or Apache AGE will be evaluated only after measured query patterns demonstrate that PostgreSQL cannot meet required latency, traversal depth, write volume, or analytical complexity.

## Consequences

### Positive

- one transactional system of record during early development
- existing tenancy, migrations, backup, and operational controls apply
- evidence, signals, cases, and graph state can be updated atomically
- lower infrastructure and synchronization complexity
- storage can evolve behind stable graph-service contracts

### Negative

- complex multi-hop traversal may require recursive SQL and careful indexing
- graph algorithms may be less convenient than in a specialized engine
- future migration may require dual-write or backfill work

### Operational implications

- relationship tables require directional and temporal indexes
- query plans and traversal latency must be measured
- entity resolution remains versioned and auditable
- product code must call graph services rather than embedding storage-specific queries broadly

## Alternatives considered

### Dedicated property-graph database immediately

Rejected because current scale and query patterns do not justify added operational complexity.

### Document-oriented embedded graph structures

Rejected because they weaken referential integrity, provenance queries, and temporal relationship updates.

### Vector database as the primary graph store

Rejected because semantic similarity does not replace explicit typed relationships, provenance, or transactional state.

## Validation

- initial neighborhood and exposure queries meet service targets
- relationship provenance and temporal validity remain traceable
- entity resolution and merge operations remain transactional
- query telemetry identifies depth, latency, cardinality, and index behavior

## Reconsideration triggers

Evaluate a dedicated graph engine when measured production workloads show persistent inability to meet latency or traversal requirements after reasonable schema, indexing, caching, and query optimization.
