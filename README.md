# LifeOS

A private, AI-first personal operating system — an AI Chief of Staff that organizes information, tracks commitments, anticipates needs, and helps run a life, not just record it.

## Architecture

LifeOS is built from a frozen Version 1 architecture. Every engineering decision must trace back to these documents:

- [`docs/architecture-decisions.md`](docs/architecture-decisions.md) — the consolidated, authoritative record of all architectural decisions (six rounds), superseding conflicting text in the original specifications. **Read this first.**
- [`docs/architecture-compliance-report.md`](docs/architecture-compliance-report.md) — the pre-implementation consistency audit and open findings.
- [`docs/engineering-roadmap.md`](docs/engineering-roadmap.md) — the milestone sequence, dependency graph, repository structure, and per-milestone Definition of Done.

The Source of Truth Hierarchy (see `architecture-decisions.md`, Round 6, Decision 5) governs how to resolve any apparent conflict between documents. Architecture is frozen: changes require the Architectural Change Process (Engineering Standards & Governance §25) and explicit approval — never silent drift.

## Status

**Milestone 1 — Foundation** (in progress). Milestone 0 (Secrets Management, Trust & Authorization) is complete. See `docs/engineering-roadmap.md` §2 for scope and Definition of Done.

## Technology Stack

Locked per `architecture-decisions.md` Round 6, Decision 4: Next.js/React/TypeScript/Tailwind/shadcn-ui (web), Electron (desktop), React Native + Expo (mobile), NestJS + TypeScript (backend), PostgreSQL + pgvector, Redis, Prisma, Better Auth (Clerk fallback), S3-compatible storage, OpenAI behind an abstract provider interface, Temporal (workflow engine), Docker + GitHub Actions + Vercel + Railway/Fly.io.

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

Per-service run instructions live in each service's own README under `services/`.
