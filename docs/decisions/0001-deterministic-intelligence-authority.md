# ADR 0001: Deterministic intelligence remains authoritative

- Status: Accepted
- Date: 2026-07-22
- Owners: Project Meridian
- Related issues: #3, #6, #7, #10
- Related pull requests: #1, #2

## Context

Meridian combines heterogeneous sources, analytical signals, analyst workflow, forecasting, and optional language-model synthesis. Intelligence products require reproducibility, provenance, explicit uncertainty, and graceful operation when optional AI services are unavailable.

Language models can improve synthesis, explanation, interaction, and scenario exploration. They cannot serve as the authoritative store of observations, evidence, signal calculations, or historical state because outputs may vary by model, prompt, provider, and runtime conditions.

## Decision

Deterministic evidence processing is Meridian's authoritative analytical layer.

The authoritative layer owns:

- normalized observations
- immutable evidence references
- content hashing and deduplication
- source and geographic convergence
- velocity and collection-sufficiency detection
- signal scores and method versions
- historical run comparison
- entity, assertion, and relationship state

Language models operate downstream of this layer for synthesis, explanation, forecasting assistance, briefing generation, and user interaction. Model outputs must preserve evidence references and distinguish observation, inference, forecast, and recommendation.

## Consequences

### Positive

- intelligence runs are reproducible for fixed inputs and time
- factual claims remain traceable to evidence
- provider outages do not disable core intelligence
- analytical changes can be versioned and backtested
- model changes do not silently rewrite historical evidence

### Negative

- deterministic methods require explicit engineering and verification
- some ambiguous tasks remain conservative until analyst or model review
- parallel deterministic and AI contracts increase implementation effort

### Operational implications

- CI must verify deterministic behavior
- method versions must be persisted
- AI output must never replace underlying evidence or signal records
- historical results remain immutable when methods change

## Alternatives considered

### Language-model-first orchestration

Rejected because provider variability, unsupported claims, and model drift would weaken reproducibility and provenance.

### Analyst-only interpretation

Rejected as the sole operating model because Meridian must scale collection, correlation, and baseline detection beyond manual review capacity.

## Validation

- deterministic verification suite passes
- identical inputs and reference time produce identical analysis
- signals preserve evidence identifiers and method versions
- system remains usable when AI is disabled

## Reconsideration triggers

No trigger permits replacing the authoritative evidence layer with probabilistic generation. Future models may assume broader analytical roles only when outputs remain reproducible, evidence-bound, versioned, and independently verifiable.
