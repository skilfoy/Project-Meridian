# Project Meridian

Project Meridian is a multi-tenant geopolitical, cyber, environmental, and strategic intelligence platform. It collects heterogeneous signals, normalizes observations, preserves provenance, detects meaningful change, supports analyst investigations, and produces decision-ready assessments.

## Current status

Phase 0 is complete and merged into `main`. Meridian now includes a production Supabase database, tenant provisioning, deterministic intelligence analysis, transactional persistence, collection orchestration, historical run comparison, the Signal Center, provenance inspection, and persistent investigation cases.

The active priority is Phase 1 production commissioning and engineering hardening:

1. Complete mandatory production runtime configuration.
2. Separate core readiness from optional capabilities.
3. Remove residual vendor-specific AI dependencies.
4. Validate authenticated production persistence and collection.
5. Establish source reliability, health, and release controls.
6. Begin the entity, assertion, and relationship graph.

See `docs/DEVELOPMENT_PLAN.md` for the implementation roadmap.

## Architecture

| Layer | Technology |
|---|---|
| Web application | Next.js 16, React 19, TypeScript |
| Authentication | Clerk during alpha |
| Database | PostgreSQL through Prisma, hosted on Supabase |
| Cache and queue | Optional Upstash Redis and BullMQ |
| Intelligence core | Deterministic observations, evidence, signals, history, and cases |
| Mapping | Leaflet during alpha; MapLibre/deck.gl modernization planned |
| AI synthesis | Optional provider-neutral OpenAI-compatible interface |
| Deployment | Vercel for the web application; persistent worker runtime required for recurring collection |

## Local development

### Prerequisites

- Node.js 20 or newer
- PostgreSQL or a Supabase project
- Clerk development application
- Redis or Upstash Redis when testing caching or background collection

### Setup

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

The production application requires:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `ENCRYPTION_MASTER_SECRET`

`ENCRYPTION_MASTER_SECRET` must contain exactly 64 hexadecimal characters. Generate one with:

```bash
openssl rand -hex 32
```

Optional capabilities use:

- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for serverless caching
- `REDIS_URL` for BullMQ workers and local Redis access
- `AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` for provider-neutral synthesis
- Sentry, PostHog, and Stripe variables for observability, analytics, and billing

The readiness endpoint at `/api/ready` evaluates mandatory configuration and reports optional capabilities separately. The health endpoint at `/api/health` treats database failure as unhealthy and optional Redis failure as degraded.

## Common commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run verify:intelligence
npm run build
npm run start
npx tsx src/worker/index.ts
```

## Feed support states

Source adapters are classified as:

- `PRODUCTION`: implemented, tested, and monitored
- `EXPERIMENTAL`: implemented with limited validation
- `CREDENTIAL_REQUIRED`: implemented and dependent on a tenant credential
- `PLANNED`: visible in the roadmap and unavailable in production

Adapters that return empty placeholder responses remain outside the production-supported catalog.

## Security expectations

- Production secrets never use fallback values.
- Secrets are configured directly in hosting-platform secret stores.
- Stored provider credentials use AES-256-GCM with organization-derived keys.
- Tenant access is enforced in application queries and database controls.
- Every source carries provenance, licensing, freshness, and reliability metadata.
- Every AI-generated factual statement remains traceable to collected evidence.
- Deterministic intelligence functions remain available when optional AI services are disabled.

## Deployment

The web application deploys from `main` through Vercel. The BullMQ worker is a separate long-running process deployed on a persistent runtime.

Before promoting a deployment, verify:

```text
GET /api/ready -> 200
GET /api/health -> 200
```

Then run authenticated smoke tests for analysis, collection, persistence, and investigation cases.

## License

No license has been declared for this repository. All rights remain reserved until a license is selected.
