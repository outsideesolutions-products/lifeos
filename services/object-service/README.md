# Object Service

CRUD for the Core Objects and Constitution domain groups (Canonical Object Registry, Round 1 Decision 1 + Round 7 Decision 1), enforcing the Universal Base Object contract and workspace/owner scoping on every read and write.

## Scope (Milestone 1)

- **Folders, Tags, Labels** — full CRUD, workspace-scoped, soft-delete (Round 5 Decision 7), unique tag/label names per workspace. `GET /folders`, `GET /tags`, `GET /labels` accept an optional `?q=` keyword filter (case-insensitive substring on `name`) — added specifically so the Search Service can compose results through this API instead of querying the `folder`/`tag`/`label` tables directly (Engineering Roadmap: "internal services never share a database directly — only through service interfaces").
- **Constitution** — read-only `GET /constitution/product` and `GET /constitution/ai` (system singletons, seeded via `packages/db/prisma/seed.ts`, never written through this API); full CRUD for the 8 `PersonalConstitution` sub-entities via one generic, type-dispatched endpoint (`/constitution/personal/:type`, where `:type` is one of `vision-statements`, `identity-statements`, `values`, `non-negotiables`, `decision-principles`, `boundaries`, `success-definitions`).
- **Versioning** — every Personal Constitution mutation writes a new `PersonalConstitutionVersion` snapshot (Cognitive Architecture: "never overwrite history"), never overwrites in place.

## Authentication

All routes require a valid Better Auth session (`SessionGuard`), validated by delegating to the Identity Service's `/api/auth/get-session` endpoint (not re-implemented here — see the comment in `src/auth/session.guard.ts` for why). The caller's single personal workspace (Round 1 Decision 3) is resolved directly against the shared database.

**Milestone 1 scope note:** only human user sessions are accepted. There is no Automation Engine or Integration Layer yet (Milestone 3), so AI/automation/integration actors don't call this API independently — the Chief of Staff (Milestone 1's baseline orchestrator) reads through this service on the user's behalf within an authenticated request, and does not yet have write access. Actual state changes remain user-initiated in Milestone 1, consistent with the AI Correction Workflow's Accept/Edit/Reject model (Round 5 Decision 4) where the user, not the AI, performs the write.

## Known Simplification (documented, not hidden)

The 8 Personal Constitution sub-entities share one generic controller/service (`src/constitution/`) rather than 7 near-identical dedicated ones, since Prisma's typed client can't be indexed by a dynamic model name without a cast — see the comment on `ConstitutionService.delegateFor()` for exactly where that cast is contained. Each type still enforces its one semantically-required field before writing (see `constitution-sub-entities.ts`).

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm --filter @lifeos/db run build && pnpm --filter @lifeos/domain-model run build
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/db run seed
pnpm --filter @lifeos/identity-service run start:dev   # must be running — SessionGuard depends on it
pnpm --filter @lifeos/object-service run start:dev
```

Health check: `GET http://localhost:4004/api/v1/health`
