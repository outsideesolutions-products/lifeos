# AI Memory Service

The foundation of the 8-tier hierarchical AI memory model from the AI Cognitive Architecture, per `docs/architecture-decisions.md` Round 2 Decision 1. Milestone 1 delivers storage, retrieval, and lifecycle for `MemoryEntry` rows across all 8 tiers (`WORKING`, `OPERATIONAL`, `LONG_TERM`, `SEMANTIC`, `BEHAVIORAL`, `DECISION`, `CONVERSATION`, `CONSTITUTION`). Tier-specific reasoning — what the Chief of Staff writes to each tier and when, pattern detection over Behavioral/Semantic/Long-Term memory, and context-assembly ranking — is Chief of Staff orchestrator scope (Milestone 1 task in progress), not this service's.

## Scope (Milestone 1)

- `POST /memories` — create a memory entry (`memoryType`, `content`, optional `confidence` 0–1, `source`, `relatedObjects`, `importance`, `expiresAt`). `memoryType` is validated against the 8-value `MemoryType` enum.
- `GET /memories?type=X` — all non-expired entries of a tier, ordered by `importance` desc then `lastReferencedAt` desc (the "frequency of interaction" / "recency" ranking factors from the Context Retrieval decision).
- `GET /memories/search?q=<query>` — case-insensitive substring match on `content` across every tier (non-expired only). Added specifically so the Search Service can compose results through this API instead of querying the `memoryEntry` table directly (Engineering Roadmap: "internal services never share a database directly — only through service interfaces").
- `POST /memories/:id/touch` — updates `lastReferencedAt`; callers (the Chief of Staff) invoke this whenever a memory is actually drawn on while assembling context.
- `DELETE /memories/:id`

**Working Memory default TTL**: per the Cognitive Architecture, Working Memory is "cleared automatically within minutes to hours." If a `WORKING` memory is created without an explicit `expiresAt`, this service applies a 4-hour default. All other tiers are permanent unless an explicit `expiresAt` is given. Expired entries are excluded from `GET /memories` automatically — callers never filter Working Memory themselves.

## Authentication

Same `SessionGuard` pattern as Object Service and Knowledge Graph Service — see Object Service's README for the rationale. The Chief of Staff orchestrator calls this service by forwarding the requesting user's own session credentials, not with independent AI credentials; Milestone 1 has no separate AI-to-service authentication scheme.

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm build   # builds @lifeos/domain-model and @lifeos/db first
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/identity-service run start:dev   # must be running — SessionGuard depends on it
pnpm --filter @lifeos/ai-memory-service run start:dev
```

Health check: `GET http://localhost:4006/api/v1/health`

## Verified

End-to-end via curl against live Postgres: `WORKING` memory creation without `expiresAt` receives the 4-hour default; `SEMANTIC` memory created without `expiresAt` is permanent; an explicitly-expired entry is excluded from `GET /memories?type=WORKING`; `POST /memories/:id/touch` updates `lastReferencedAt`; `DELETE` on a missing id returns 404; unauthenticated requests return 401.
