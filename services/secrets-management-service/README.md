# Secrets Management Service

Centralized secret storage per `docs/architecture-decisions.md`, Round 3, Decision 9: no integration or service stores credentials independently; every secret is encrypted before it touches the database; application code never accesses raw secrets directly.

## Scope (Milestone 0)

- Create, list (metadata only), rotate, revoke secrets
- Immutable audit log on every lifecycle event
- Pluggable `EncryptionProvider` abstraction (see `src/encryption/`)

## Open Question

The production encryption backend (KMS/vault provider) has not been decided — see `src/encryption/encryption-provider.interface.ts` for the specifics and `docs/architecture-compliance-report.md` for how this is tracked. The `LocalEncryptionProvider` used today is **local development only**.

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/secrets-management-service run start:dev
```

Health check: `GET http://localhost:4001/api/v1/health`
