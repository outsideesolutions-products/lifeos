# Search Service

Keyword search across whatever objects exist at this point in the build, per the Engineering Roadmap: "keyword search only across whatever objects exist at this point; semantic search deferred until the Vector Database has meaningful content."

## Scope (Milestone 1)

`GET /search?q=<query>` — case-insensitive substring match across every workspace-scoped object type that exists as of Milestone 1:

- Core Objects: `Folder`, `Tag`, `Label` (matched on `name`)
- Personal Constitution sub-entities: vision statements, identity statements, values, non-negotiables, decision principles, boundaries, success definitions
- AI Memory (`MemoryEntry`, matched on `content`; expired entries excluded)

Results are tagged with `objectType`/`objectId` (same convention as the Knowledge Graph Service) and sorted by recency — there is no relevance scoring beyond that, which is the correct scope for keyword-only search, not a stand-in for something more sophisticated.

**Deliberately excluded:** `ProductConstitution` and `AIConstitution`, the two system-singleton Constitutions. They're single, always-present reference documents, not content a user searches for among many.

## Architecture: no database of its own

Search Service owns no database connection and has no Prisma dependency. It composes results entirely from the Object Service's and AI Memory Service's own HTTP APIs, forwarding the caller's session credentials (same pattern as the AI orchestrator's client services) — per the Engineering Roadmap: **"internal services never share a database directly — only through service interfaces."**

An earlier version of this service queried the shared Postgres database directly via its own Prisma client. That was a mistake, caught during Milestone 1 implementation, not a deliberate design: it worked because every Milestone 1 service happens to share one physical database behind `@lifeos/db`, but reading tables another service owns bypasses that service's interface entirely and directly violates the roadmap rule above. Fixed by:

- Adding `?q=` keyword filtering to Object Service's `GET /folders`, `GET /tags`, `GET /labels` (optional param, non-breaking).
- Adding a dedicated `GET /memories/search?q=` endpoint to AI Memory Service.
- Personal Constitution search still fetches the existing `GET /constitution/personal` response wholesale and filters in-process here — that collection is inherently small (a handful of entries per category for one user), so no new endpoint was needed for it.

## Authentication

Same `SessionGuard` delegation pattern as every other Milestone 1 service (see object-service's README for the full rationale), simplified like the AI orchestrator's: no Prisma, no workspace resolution — this service has nothing of its own to scope by workspace, since every query it makes goes through another service that resolves workspace itself.

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm build
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/identity-service run start:dev    # must be running — SessionGuard depends on it
pnpm --filter @lifeos/object-service run start:dev      # Folder/Tag/Label/Constitution search
pnpm --filter @lifeos/ai-memory-service run start:dev   # Memory search
pnpm --filter @lifeos/search-service run start:dev
```

Health check: `GET http://localhost:4007/api/v1/health`.

## Verified

End-to-end via curl against the live Identity/Object/AI Memory services: keyword matches found across Folder, Tag, MemoryEntry, and a Personal Constitution vision statement for the same query term, sourced through each owning service's HTTP API (confirmed identical results before and after the architecture fix above); case-insensitive matching; empty array on no matches; workspace isolation (a second user's session returns no results for the first user's data); 400 when `q` is missing; 401 when unauthenticated.
