# KTI Product and Engineering Specification v1.0

Status: Approved implementation baseline

## 1. Mandate

KTI will operate as a decision-grade global threat intelligence operating system. The product will convert evidence into traceable judgments, expose uncertainty, support executive and analyst workflows, and use visualization only where it improves interpretation.

The July 25, 2026 production screenshots are the failed baseline for this rebuild. The current map-centered interface, neon visual treatment, contradictory health indicators, repetitive telemetry, shallow vulnerability coverage, and incomplete disruption coverage do not satisfy the approved product direction.

## 2. Authority

- This specification is the binding product authority for KTI.
- GitHub issues and pull requests are the engineering execution record.
- Meridian supplies governed evidence, source-health, entity, assertion, provenance, confidence, and temporal-relationship contracts.
- KTI remains a distinct product experience and may not duplicate or bypass Meridian analytical controls.
- Conversation history may inform work, but it does not supersede approved requirements, decision records, tests, or release gates.

## 3. Product doctrine

- Intelligence judgment leads the experience.
- Evidence, provenance, time, confidence, and uncertainty remain visible.
- Consequential change receives priority over raw volume.
- Maps, charts, counters, animation, and color carry documented analytical meaning.
- Executive, strategic, operational, and investigative workflows receive purpose-built views.
- Source degradation remains explicit and cannot be hidden behind aggregate health scores.
- Contradictory indicators fail the release.
- Analysts can inspect how observations became assessments.
- Collection gaps and competing explanations remain visible.
- Action recommendations identify rationale, urgency, owner, and review state.

## 4. Requirement conventions

Every implementation issue and pull request must reference applicable requirement identifiers. Completion requires implementation evidence, test evidence, and production validation.

### 4.1 Product requirements

- KTI-PROD-001: KTI shall present intelligence judgments ahead of raw telemetry.
- KTI-PROD-002: The default authenticated experience shall answer what changed, why it matters, what confidence supports the assessment, and what action follows.
- KTI-PROD-003: The product shall distinguish observed facts, assessed relationships, inferred relationships, and unresolved hypotheses.
- KTI-PROD-004: The product shall expose material collection gaps and uncertainty.
- KTI-PROD-005: Placeholder, simulated, and synthetic intelligence shall never appear as live production data.

### 4.2 Information architecture

- KTI-IA-001: Primary navigation shall include Command Brief, Signal Environment, Campaigns and Threats, Vulnerability Intelligence, Global Disruptions, Knowledge Graph, Dossiers, Collection and Sources, Monitoring Profiles and Boards, and Administration.
- KTI-IA-002: The map shall function as an analytical instrument inside relevant workflows rather than the dominant product identity.
- KTI-IA-003: Users shall be able to enter through a query-driven intelligence workspace.
- KTI-IA-004: Users shall be able to resume recent investigations, boards, monitoring profiles, and generated intelligence products.

### 4.3 Intelligence objects

- KTI-OBJ-001: Every intelligence object shall include a stable identifier, object type, title, description, observed time, published time, updated time, source, evidence, corroboration, confidence, severity, relevance, geography, sector, related entities, analytical judgments, collection gaps, recommended actions, analyst review state, and provenance history.
- KTI-OBJ-002: Every relationship shall include type, direction, confidence, temporal validity, provenance, and review state.
- KTI-OBJ-003: Conflicting assertions shall coexist without silent reconciliation.
- KTI-OBJ-004: Every displayed assessment shall support drill-down to evidence and source context.

### 4.4 Source governance and health

- KTI-SRC-001: Source health shall derive from source-level records and remain mathematically reconcilable to aggregate status.
- KTI-SRC-002: Source health shall expose last success, last error, latency, freshness, enabled state, capability state, cadence, reliability, independence class, licensing posture, expected volume, and last-known-good policy.
- KTI-SRC-003: Stale data shall carry an explicit stale state and visible stale age.
- KTI-SRC-004: Stub, planned, experimental, or credential-required providers shall never appear as production-supported sources.
- KTI-SRC-005: One source failure shall not block successful source persistence.
- KTI-SRC-006: Collection gaps shall propagate to downstream intelligence sufficiency and confidence.

### 4.5 Command Brief

- KTI-CMD-001: Command Brief shall display key judgments, material changes, strategic implications, emerging risks, recommended actions, confidence, and collection gaps.
- KTI-CMD-002: Each judgment shall identify evidence coverage, change since prior cycle, affected entities, sectors, regions, and infrastructure.
- KTI-CMD-003: Executives shall be able to open the underlying dossier without navigating through raw feed views.

### 4.6 Signal Environment

- KTI-SIG-001: Signal Environment shall display novelty, velocity, corroboration, source diversity, confidence movement, and analytical status.
- KTI-SIG-002: Repetitive commodity observations shall be clustered and summarized.
- KTI-SIG-003: Analysts shall be able to promote a signal into an investigation, campaign, dossier, monitoring profile, or collection task.

### 4.7 Campaigns and threats

- KTI-THR-001: Campaign views shall connect actors, malware, infrastructure, targeting, victimology, behaviors, chronology, confidence, and supporting evidence.
- KTI-THR-002: Campaign progression shall distinguish observed activity from inferred coordination.
- KTI-THR-003: Analyst workflows shall support competing hypotheses and explicit review states.

### 4.8 Vulnerability intelligence

- KTI-VUL-001: Vulnerability prioritization shall incorporate exploitation evidence, affected technologies, exposure, weaponization, KEV state, exploit maturity, threat linkage, and operational relevance.
- KTI-VUL-002: Every vulnerability priority score shall be explainable through visible factors.
- KTI-VUL-003: Vulnerability views shall connect affected technologies and organizations to active campaigns, observed infrastructure, and recommended action.

### 4.9 Global disruptions

- KTI-DIS-001: Disruptions shall cover geopolitical events, outages, disasters, infrastructure failures, severe weather, conflict, public-health events, logistics disruption, and cascading dependencies.
- KTI-DIS-002: Disruption views shall expose source coverage, temporal progression, affected assets, sectors, regions, dependencies, and confidence.
- KTI-DIS-003: Earthquakes shall never function as the sole substantive disruption category in production.

### 4.10 Knowledge graph and dossiers

- KTI-GRAPH-001: Graph exploration shall display entities, aliases, assertions, relationships, time, provenance, confidence, and contradictions.
- KTI-GRAPH-002: Analysts shall be able to pivot from any entity or relationship to supporting evidence and related dossiers.
- KTI-DOS-001: Dossiers shall include key judgments, chronology, evidence, sources, confidence, implications, competing explanations, collection gaps, recommended actions, and review history.
- KTI-DOS-002: Dossiers shall support export and stable sharing without losing provenance.

### 4.11 Map behavior

- KTI-MAP-001: Every marker, cluster, line, arc, color, and animation shall have documented analytical semantics.
- KTI-MAP-002: Animated directional flows shall require evidence-backed source, target, direction, time, confidence, and relationship type.
- KTI-MAP-003: The map shall differentiate observed, assessed, and inferred relationships.
- KTI-MAP-004: The map shall support confidence, uncertainty, temporal playback, event density, regional impact, infrastructure ownership, sector overlays, and drill-down.
- KTI-MAP-005: Decorative motion that obscures interpretation shall fail acceptance testing.

### 4.12 Visual and interaction design

- KTI-UX-001: The design system shall use restrained color, limited glow, readable typography, deliberate spacing, progressive disclosure, and consistent density.
- KTI-UX-002: Color shall represent defined analytical states and shall not function as decoration.
- KTI-UX-003: The interface shall avoid game-like HUD treatment.
- KTI-UX-004: Primary actions, selected states, severity, confidence, freshness, and review state shall remain visually distinct.
- KTI-UX-005: Supported desktop layouts shall remain usable at 1280, 1440, 1680, and 1920 pixel widths.

### 4.13 Security, observability, performance, and accessibility

- KTI-SEC-001: Every API path and persisted object shall remain tenant-scoped.
- KTI-SEC-002: Secrets and raw credentials shall never appear in client responses, logs, or error messages.
- KTI-SEC-003: Administrative and analytical actions shall produce auditable events.
- KTI-OBS-001: Requests, collections, persistence operations, and analyst workflows shall propagate correlation identifiers.
- KTI-OBS-002: Collection logs shall include source IDs, duration, success count, failure count, run ID, and sanitized error context.
- KTI-PERF-001: Initial workspace interaction shall remain responsive under the approved production data volume.
- KTI-PERF-002: Map rendering and graph exploration shall use progressive loading and bounded visual complexity.
- KTI-A11Y-001: Keyboard access, focus visibility, semantic structure, contrast, and screen-reader labeling shall meet WCAG 2.2 AA.
- KTI-A11Y-002: Motion shall respect reduced-motion preferences.

### 4.14 Traceability and release governance

- KTI-TRACE-001: Every requirement shall map to implementation task, design artifact, test case, owner, status, evidence, release, and validation result.
- KTI-TRACE-002: Pull requests shall identify covered requirement IDs and include acceptance evidence.
- KTI-TRACE-003: A requirement without evidence shall remain incomplete.
- KTI-TRACE-004: Material deviations require an architecture or product decision record.

## 5. Mandatory release gates

1. Requirement traceability review
2. Intelligence integrity review
3. Data coherence and contradiction testing
4. Source-health reconciliation
5. Provenance and confidence validation
6. Design-system compliance
7. Accessibility review
8. Responsive-layout review
9. Performance review
10. Security and tenancy review
11. Workflow acceptance testing
12. Screenshot regression review
13. Executive usability review
14. Analyst usability review
15. Production smoke test and rollback verification

## 6. Stop-the-line conditions

A release stops immediately when any of the following is present:

- contradictory metrics or status indicators
- live-looking placeholder data
- unsupported claims, flows, locations, or relationships
- stale data presented without an explicit stale state
- source health that cannot be reconciled to source-level records
- confidence without an explainable basis
- animation that obscures analysis
- color without documented semantics
- dead-end navigation or incomplete primary workflows
- major responsive defects at supported desktop resolutions
- evidence links that fail or omit source context
- unresolved critical or high-severity security findings
- material departure from the approved specification

## 7. Delivery sequence

### Phase 0: Control and baseline

Freeze decorative iteration, capture the failed baseline, inventory existing capabilities, and establish traceability.

### Phase 1: Intelligence integrity

Integrate Meridian source contracts, resolve source-health contradictions, establish provenance and confidence, and separate observed facts from assessed and inferred relationships.

### Phase 2: Product restructuring

Implement the query-driven entry workspace, Command Brief, Signal Environment, and coherent navigation shell.

### Phase 3: Domain depth

Complete vulnerability, campaign, disruption, infrastructure, victimology, and cascading-impact experiences.

### Phase 4: Analytical workbench

Implement graph exploration, temporal analysis, hypotheses, evidence review, dossier production, monitoring profiles, and collaborative boards.

### Phase 5: Institutional hardening

Complete accessibility, performance, security, audit, release automation, production observability, and controlled beta validation.

## 8. Completion definition

KTI reaches rebuild completion only after every mandatory requirement has implementation evidence, test evidence, owner approval, and production validation. Visual polish alone cannot satisfy completion.
