# Identity Service

Authentication and account management, per `docs/architecture-decisions.md` Round 1 Decision 3. Built on [Better Auth](https://better-auth.com) with the Prisma adapter against the shared `@lifeos/db` schema.

## Scope (Milestone 1)

- Email/password authentication
- Google OAuth (Apple Sign In wired but optional — only activates if `APPLE_OAUTH_CLIENT_ID` is set)
- Passkeys (`@better-auth/passkey`)
- MFA / two-factor (TOTP + backup codes, `better-auth/plugins/two-factor`)
- Session and device management, listing, and revocation (native Better Auth capability — no custom code needed)
- Account recovery: not yet wired to a real email provider (see Known Limitations)
- **Workspace + Personal Constitution auto-provisioning**: a database hook (`databaseHooks.user.create.after` in `src/auth/auth.config.ts`) creates the user's single personal Workspace and an empty `PersonalConstitution` (status `INITIALIZATION`, per Round 4 Decision 5's Cold Start Phase 1) the moment their account is created — this is the concrete mechanism the Object Service and Chief of Staff build on top of.

## Routes

- `/api/auth/*` — Better Auth's own routing convention (sign-up, sign-in, OAuth callbacks, session management, 2FA, passkeys). Deliberately outside the `/api/v1` prefix — see the comment in `src/main.ts`.
- `/api/v1/health` — standard health check.

## Known Limitations (not placeholders — real, documented Milestone 1 boundaries)

- **Email verification is disabled** (`requireEmailVerification: false`). Sending verification emails requires the Integration Layer's email capability, which lands in Milestone 3. Password auth is fully functional without it; this is a real scope boundary, not an oversight.
- **Account recovery** (password reset) has the same dependency — Better Auth supports it, but wiring the actual email delivery is Milestone 3 work.
- **Apple Sign In** is configured but untested — no Apple Developer credentials exist in this environment. The Google OAuth path is the one that's been exercised end-to-end.

## Regenerating the Better Auth schema fragment

If `src/auth/auth.config.ts` changes (e.g., a new plugin), regenerate the Prisma models it owns:

```bash
pnpm --filter @lifeos/identity-service run auth:generate-schema
```

Do not hand-edit the `User`, `Session`, `Account`, `Verification`, `TwoFactor`, or `Passkey` models in `packages/db/prisma/schema.prisma` — they're generated. The `workspaces Workspace[]` relation on `User` is the one manually-added exception (documented inline in schema.prisma).

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done — fill in Google OAuth credentials for that flow
docker compose -f ../../docker-compose.yml up -d postgres
pnpm --filter @lifeos/db run migrate:dev
pnpm --filter @lifeos/db run seed   # seeds ProductConstitution and AIConstitution
pnpm --filter @lifeos/identity-service run start:dev
```

Health check: `GET http://localhost:4003/api/v1/health`
