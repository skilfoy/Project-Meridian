# Project Meridian

Project Meridian is a multi-tenant geopolitical, cyber, environmental, and strategic intelligence platform. It aggregates external data, normalizes incidents, maps activity by theater, maintains organizational watchlists, and generates evidence-informed AI assessments.

## Current status

Meridian is an alpha under active recovery and hardening. The application includes a Next.js interface, Prisma data model, Clerk authentication, Redis caching, a BullMQ feed worker, live and planned source adapters, threat-actor data, watchlists, saved incidents, custom sources, and AI-generated theater assessments.

The immediate development priority is production commissioning:

1. Restore and migrate the Supabase database.
2. Configure Clerk, Redis, Anthropic, and encryption secrets in Vercel.
3. Deploy the persistent feed worker.
4. Validate production-supported feeds.
5. Establish CI, smoke tests, observability, and source-health reporting.

See `docs/DEVELOPMENT_PLAN.md` for the implementation roadmap.

## Architecture

| Layer | Technology |
|---|---|
| Web application | Next.js 16, React 19, TypeScript |
| Authentication | Clerk |
| Database | PostgreSQL through Prisma, hosted on Supabase |
| Cache and queue | Upstash Redis, BullMQ |
| Mapping | Leaflet during alpha; MapLibre/deck.gl modernization planned |
| AI analysis | Anthropic through a server-side provider module |
| Deployment | Vercel for the web application; persistent worker host required |

## Local development

### Prerequisites

- Node.js 20 or newer
- PostgreSQL or a Supabase project
- Redis or Upstash Redis
- Clerk development application

### Setup

```bash
npm install
cp .env.example .env.local
npx prisma generate
npx prisma migrate dev
npm run dev
```

Open `http://localhost:3000`.

## Required environment variables

The production deployment requires:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ENCRYPTION_MASTER_SECRET`

`ENCRYPTION_MASTER_SECRET` must contain exactly 64 hexadecimal characters. Generate one with:

```bash
openssl rand -hex 32
```

The readiness endpoint at `/api/ready` reports missing configuration without exposing secret values. The health endpoint at `/api/health` verifies database and Redis connectivity.

## Common commands

```bash
npm run dev
npm run lint
npm run build
npm run start
npx tsx src/worker/index.ts
```

## Feed support states

Source adapters should be classified as:

- `PRODUCTION`: implemented, tested, and monitored
- `EXPERIMENTAL`: implemented with limited validation
- `CREDENTIAL_REQUIRED`: implemented and dependent on a tenant credential
- `PLANNED`: visible in the roadmap and unavailable in production

Adapters that return empty placeholder responses must remain outside the production-supported catalog.

## Security expectations

- Production secrets must never use fallback values.
- Stored provider credentials use AES-256-GCM with organization-derived keys.
- Tenant data access must be enforced in application queries and database policies.
- Every source requires provenance, licensing, freshness, and reliability metadata.
- AI-generated factual claims must remain traceable to collected evidence.

## Deployment

The web application deploys from `main` through Vercel. The BullMQ worker is a separate long-running process and should be deployed on a persistent runtime such as a small DigitalOcean droplet or Railway service.

Before promoting a deployment, verify:

```text
GET /api/ready -> 200
GET /api/health -> 200
```

## License

No license has been declared for this repository. All rights remain reserved until a license is selected.
