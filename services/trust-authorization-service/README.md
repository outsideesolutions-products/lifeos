# Trust & Authorization Service

Single enforcement point for every AI, automation, integration, and connector action, per `docs/architecture-decisions.md`, Round 3, Decision 7 and the "New Foundational Service" section: no service may bypass this layer.

## Scope (Milestone 0 — skeleton)

- `POST /api/v1/authorize` — evaluates an action request and returns `ALLOW` / `DENY` / `REQUIRE_APPROVAL`, always recording the decision to the immutable `AuthorizationDecision` audit log.
- The **full** Automation Authorization Matrix (Integration Trust → Object Classification → Action Risk → Automation Permission → Execute or Approval, per Round 3 Decision 11) is **not implemented yet** — see the extensive comment in `src/authorization/authorization.service.ts` for exactly what's missing and why, and `docs/architecture-compliance-report.md` findings B1/B2 for the two decisions that block completing it.
- Current behavior: a human user acting directly is always allowed (Human Override principle); every other actor type currently lands on `REQUIRE_APPROVAL` until the missing inputs (Integration Trust, Data Classification, Action Risk, Automation Permission) can all be supplied by later milestones. This is intentionally conservative — do not loosen it as a shortcut.

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/trust-authorization-service run start:dev
```

Health check: `GET http://localhost:4002/api/v1/health`
