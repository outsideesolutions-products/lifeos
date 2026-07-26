# LifeOS Web

The primary Next.js experience layer (System Architecture's locked stack: Next.js/React/TypeScript/Tailwind/shadcn-ui). Milestone 1 delivers authentication and the First-Run onboarding flow; the full Adaptive Home Screen dashboard is a separate, in-progress Milestone 1 task.

## Scope (Milestone 1)

- `/sign-up`, `/sign-in` — Better Auth email/password, via `better-auth/react`'s client SDK talking directly to the Identity Service.
- `/onboarding` — the First-Run Experience (`docs/architecture-decisions.md` Round 5 Decision 5). Milestone 1's onboarding scope is the Personal Constitution only — every other item that decision lists (goals, health/financial priorities, connected accounts, calendars, documents) needs domain objects or the Integration Layer that don't exist until later milestones. Every step maps to one of the 7 Personal Constitution sub-entity types (`src/app/onboarding/steps.ts`), is individually skippable, and the whole flow can be dismissed at any point — "gradual context-building; useful within the first session even if incomplete."
- `/` — routes based on session + onboarding state: signed out → `/sign-in`; onboarding neither completed nor dismissed → `/onboarding`; otherwise → `/dashboard`.
- `/dashboard` — placeholder landing point only, so the onboarding flow has somewhere real to land and be tested end-to-end. The actual dashboard is a separate Milestone 1 task, not stubbed out here as a substitute for it.

## Architecture notes

- **No BFF/API gateway in Milestone 1.** The browser calls each backend service directly (`src/lib/api.ts`), with `credentials: 'include'` on every request — every service validates the session itself via its own `SessionGuard`. CORS is enabled on every service, scoped to `TRUSTED_ORIGINS`.
- **shadcn-ui, used as intended**: shadcn is a source-copy pattern, not an installed component library. `src/components/ui/` holds the small set of primitives this milestone needs (Button, Input, Textarea, Label, Card), written in the same style (Tailwind + `class-variance-authority` + `cn()` merge helper) rather than pulled in via the shadcn CLI, which isn't practical to run non-interactively in every environment. Adding a real component from the shadcn registry later is a drop-in replacement, not a rework.

## Run locally

```bash
cp .env.example .env.local   # from this directory
pnpm --filter @lifeos/identity-service run start:dev
pnpm --filter @lifeos/object-service run start:dev
pnpm --filter @lifeos/ai-memory-service run start:dev
pnpm --filter @lifeos/search-service run start:dev
pnpm --filter @lifeos/ai-orchestrator run start:dev
pnpm --filter @lifeos/web run dev
```

Open http://localhost:3000.

## Verified

End-to-end via Playwright against the live backend services: sign-up redirects to onboarding; adding a Vision entry and skipping the remaining steps before finishing on Success correctly creates both Personal Constitution sub-entities and calls `onboarding/complete`, transitioning Cold Start phase from `INITIALIZATION` to `LEARNING`; reloading `/` after onboarding routes straight to `/dashboard`; dismissing onboarding immediately (no entries) also routes to `/dashboard`, and signing back in afterward does not show onboarding again.
