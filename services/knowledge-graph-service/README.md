# Knowledge Graph Service

The Object Relationships store — typed, polymorphic edges between any two objects in the Canonical Object Registry, per `docs/architecture-decisions.md` Round 3 Decision 3 and Round 5 Decision 8's FK-vs-graph rule. Direct foreign keys (e.g. `Folder.parentFolderId`) are for stable structural ownership; this service is for everything else — the "everything connects" principle from the Domain Model.

## Scope (Milestone 1)

- `POST /relationships` — create a typed edge (`sourceObjectType`, `sourceObjectId`, `relationshipType`, `targetObjectType`, `targetObjectId`, optional `strength`). `relationshipType` is the closed 11-value taxonomy from the Domain Model's "Universal Relationship Rules" (`BELONGS_TO`, `CONTAINS`, `SUPPORTS`, `CREATED_FROM`, `REFERENCES`, `DEPENDS_ON`, `BLOCKS`, `GENERATED`, `ASSIGNED_TO`, `REVIEWED_IN`, `ARCHIVED_WITH`).
- `GET /relationships?objectType=X&objectId=Y` — every edge touching an object, in either direction.
- `GET /relationships/traverse?objectType=X&objectId=Y&depth=N` — breadth-first traversal outward up to `depth` hops (clamped 1–5), **priority-based** per Round 3 Decision 3: at each depth, edges are explored strongest-first by `strength`, and results are returned ordered by `(depth asc, strength desc)` with each result's discovering `strength` included — a caller that only consumes the top few results at a depth gets the most relevant ones first without its own ranking pass. This is the mechanism behind the AI Reasoning Graph's traversal chains (Goal → Project → Tasks → ... → Insights) — the Chief of Staff calls this rather than following foreign keys across services.
- `DELETE /relationships/:id`

Duplicate edges (same source, type, and target) are rejected with 409, per the table's unique constraint.

## Authentication

Same `SessionGuard` pattern as Object Service — see that service's README for the rationale. Duplicated here rather than shared for the same reason (no `/packages/common` yet).

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm build   # builds @lifeos/domain-model and @lifeos/db first
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/identity-service run start:dev   # must be running — SessionGuard depends on it
pnpm --filter @lifeos/knowledge-graph-service run start:dev
```

Health check: `GET http://localhost:4005/api/v1/health`
