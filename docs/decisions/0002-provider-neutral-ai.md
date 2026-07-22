# ADR 0002: Maintain provider-neutral AI integration

- Status: Accepted
- Date: 2026-07-22
- Owners: Project Meridian
- Related issues: #3, #5
- Related pull requests: #1, #2

## Context

Meridian requires optional AI synthesis without tying the product architecture to one model vendor. The AI market changes quickly across commercial APIs, hosted open-weight models, enterprise providers, and local runtimes. Vendor-specific SDKs, environment variables, and application logic increase switching cost and create unnecessary operational dependencies.

## Decision

Meridian will expose one internal provider-neutral AI contract using OpenAI-compatible request semantics where practical.

Configuration uses generic provider, base URL, API key, and model settings. Provider adapters may support OpenAI, Azure OpenAI, OpenRouter, Gemini, Groq, Kimi, Ollama, or future services without changing the intelligence data plane.

AI remains optional. Deterministic analysis and evidence access continue operating when no provider is configured.

## Consequences

### Positive

- provider changes require configuration or a narrow adapter
- Meridian avoids strategic dependence on one model vendor
- local and enterprise-hosted options remain possible
- cost, latency, privacy, and capability can be optimized by workload

### Negative

- lowest-common-denominator compatibility can hide provider-specific features
- adapter testing expands as providers are added
- structured-output behavior varies across implementations

### Operational implications

- vendor names do not appear in mandatory environment configuration
- provider-specific SDKs require a documented capability justification
- evaluation suites gate provider and model changes
- model, prompt, latency, and cost metadata remain auditable

## Alternatives considered

### Single preferred provider

Rejected because it creates unnecessary commercial, operational, and technical coupling.

### Direct provider calls throughout the application

Rejected because it spreads model-specific behavior across product code and complicates evaluation and replacement.

## Validation

- deterministic mode works with AI disabled
- provider changes do not alter evidence or signal contracts
- adapter contract supports timeouts, structured output, usage telemetry, and safe fallback
- repository contains no mandatory Anthropic-specific runtime dependency or environment variable

## Reconsideration triggers

A specialized provider SDK may be introduced behind the internal adapter when a measured capability cannot be supported through the generic contract. The product-facing contract remains provider-neutral.
