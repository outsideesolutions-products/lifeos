# LifeOS

A private, AI-first personal operating system — an AI Chief of Staff that organizes information, tracks commitments, anticipates needs, and helps run a life, not just record it.

## Architecture

LifeOS is built from a frozen Version 1 architecture. Every engineering decision must trace back to these documents:

- [`docs/architecture-decisions.md`](docs/architecture-decisions.md) — the consolidated, authoritative record of all architectural decisions (twelve rounds — the first seven from the pre-implementation review, the rest recorded as they surfaced during Milestone 1 implementation), superseding conflicting text in the original specifications. **Read this first.**
- [`docs/architecture-compliance-report.md`](docs/architecture-compliance-report.md) — the pre-implementation consistency audit and open findings, plus a v3 section re-verifying compliance against the actual Milestone 1 codebase.
- [`docs/engineering-roadmap.md`](docs/engineering-roadmap.md) — the milestone sequence, dependency graph, repository structure, and per-milestone Definition of Done.
- [`docs/milestone-1-review-report.md`](docs/milestone-1-review-report.md) — what was implemented, architecture decisions made during the build, test results, technical debt, and recommendations.

The Source of Truth Hierarchy (see `architecture-decisions.md`, Round 6, Decision 5) governs how to resolve any apparent conflict between documents. Architecture is frozen: changes require the Architectural Change Process (Engineering Standards & Governance §25) and explicit approval — never silent drift.

## Status

**Milestone 1 — Foundation**: implementation complete, pending the Milestone 1 Review Report and approval to begin Milestone 2. Milestone 0 (Secrets Management, Trust & Authorization) is complete. See `docs/engineering-roadmap.md` §2 for scope and Definition of Done.

Services built so far: Identity, Object, Knowledge Graph, AI Memory, and Search (`services/`); the AI Provider Interface and Chief of Staff orchestrator (`ai/`); the web app with sign-up/sign-in, onboarding, and the minimum-viable Dashboard (`apps/web`).

## Technology Stack

Locked per `architecture-decisions.md` Round 6, Decision 4: Next.js/React/TypeScript/Tailwind/shadcn-ui (web), Electron (desktop), React Native + Expo (mobile), NestJS + TypeScript (backend), PostgreSQL + pgvector, Redis, Prisma, Better Auth (Clerk fallback), S3-compatible storage, OpenAI behind an abstract provider interface, Temporal (workflow engine), Docker + GitHub Actions. Infrastructure/deployment target updated by Round 13 — see Deployment below.

## Deployment

**All services (web app + every backend) deploy to Vercel** via the root `vercel.json`, using Vercel Services (multiple backends and a frontend in one project, one public routing table). This supersedes the original "Vercel frontend / Railway or Fly.io backend" split — see `architecture-decisions.md` Round 13 for the full record, including two things flagged there as **not yet verified against Vercel's primary documentation** (unreachable when this was set up):

- Each backend service is deployed via Vercel's zero-configuration NestJS support (no `buildCommand`/`outputDirectory` needed) as a Vercel Function; every `main.ts` binds to `process.env.PORT` first, falling back to its existing `<SERVICE>_PORT` env var for local dev.
- Public routes are `/api/<service-name>/...`, each rewritten to the matching service; confirm this against Vercel's current docs before relying on it, since the docs pages 403'd during setup and this was cross-checked via search-result summaries only.
- **Before deploying**, set every `*_SERVICE_URL` and `NEXT_PUBLIC_*_SERVICE_URL` environment variable in the Vercel project to the correct value for cross-service calls in production (e.g., `IDENTITY_SERVICE_URL` used by every other service's `SessionGuard`) — whether that should be the public rewrite path or a private inter-service address Vercel Services may offer was not confirmed.

## Local Development

```bash
cp .env.example .env   # fill in real values
docker compose up -d   # Postgres + Redis
pnpm install
pnpm build              # builds @lifeos/domain-model and @lifeos/db first — services import their compiled dist/, not raw TypeScript, so this must run (or re-run) whenever either package changes
pnpm db:generate
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/db run seed   # seeds the Product and AI Constitution singletons
```

`pnpm -r` commands (including the root `build` script) respect the workspace dependency graph automatically, so `pnpm build` always builds `@lifeos/domain-model` and `@lifeos/db` before any service that depends on them — no manual ordering needed.

Per-service run instructions live in each service's own README under `services/`, `ai/`, and `apps/web`. Milestone 1's full stack needs, at minimum: `identity-service` (auth, everything else's `SessionGuard` depends on it) → `object-service` (Core Objects + Constitution) → `ai-memory-service` and `search-service` → `ai/orchestrator` (Chief of Staff) → `apps/web`. `knowledge-graph-service` has no cross-service dependents yet but is independent to start.
