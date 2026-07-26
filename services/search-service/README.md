# Search Service

Keyword search across whatever objects exist at this point in the build, per the Engineering Roadmap: "keyword search only across whatever objects exist at this point; semantic search deferred until the Vector Database has meaningful content."

## Scope (Milestone 1)

`GET /search?q=<query>` — case-insensitive substring match across every workspace-scoped object type that exists as of Milestone 1:

- Core Objects: `Folder`, `Tag`, `Label` (matched on `name`)
- Personal Constitution sub-entities: vision statements, identity statements, values, non-negotiables, decision principles, boundaries, success definitions
- AI Memory (`MemoryEntry`, matched on `content`; expired entries excluded)

Results are tagged with `objectType`/`objectId` (same convention as the Knowledge Graph Service) and sorted by recency — there is no relevance scoring beyond that, which is the correct scope for keyword-only search, not a stand-in for something more sophisticated.

**Deliberately excluded:** `ProductConstitution` and `AIConstitution`, the two system-singleton Constitutions. They're single, always-present reference documents, not content a user searches for among many.

## Authentication

Same `SessionGuard` pattern as every other Milestone 1 service — queries the shared database directly via Prisma, scoped to the caller's own workspace. There is one Postgres database and one Prisma schema behind `@lifeos/db`; each service scopes its own queries to the tables it's responsible for by convention, not by physical database separation (see `src/auth/session.guard.ts`).

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm build
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/identity-service run start:dev   # must be running — SessionGuard depends on it
pnpm --filter @lifeos/search-service run start:dev
```

Health check: `GET http://localhost:4007/api/v1/health`.

## Verified

End-to-end via curl against live Postgres: keyword matches found across Folder, Tag, MemoryEntry, and a Personal Constitution vision statement for the same query term; case-insensitive matching; empty array on no matches; workspace isolation (a second user's session returns no results for the first user's data); 400 when `q` is missing; 401 when unauthenticated.
