# Architecture Decision Records

Meridian uses Architecture Decision Records to preserve consequential technical and product decisions outside conversation history.

## Process

1. Copy `0000-template.md`.
2. Assign the next sequential number.
3. Describe the context, decision, consequences, alternatives, and validation evidence.
4. Commit the ADR with the implementation or planning change that depends on it.
5. Mark replaced decisions as `Superseded` and link the replacement ADR.

## Status values

- Proposed
- Accepted
- Superseded
- Deprecated
- Rejected

## Initial decision backlog

- Deterministic intelligence remains authoritative
- Provider-neutral AI integration
- PostgreSQL relational graph substrate before a dedicated graph database
- Clerk retained through alpha
- Redis remains an optional web capability and required worker capability
- Meridian serves as the canonical intelligence engine for adjacent products
