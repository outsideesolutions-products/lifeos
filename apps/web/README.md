# LifeOS Web

The primary Next.js experience layer (System Architecture's locked stack: Next.js/React/TypeScript/Tailwind/shadcn-ui). Milestone 1 delivers authentication, the First-Run onboarding flow, and the minimum-viable Dashboard.

## Scope (Milestone 1)

- `/sign-up`, `/sign-in` — Better Auth email/password, via `better-auth/react`'s client SDK talking directly to the Identity Service.
- `/onboarding` — the First-Run Experience (`docs/architecture-decisions.md` Round 5 Decision 5). Milestone 1's onboarding scope is the Personal Constitution only — every other item that decision lists (goals, health/financial priorities, connected accounts, calendars, documents) needs domain objects or the Integration Layer that don't exist until later milestones. Every step maps to one of the 7 Personal Constitution sub-entity types (`src/app/onboarding/steps.ts`), is individually skippable, and the whole flow can be dismissed at any point — "gradual context-building; useful within the first session even if incomplete."
- `/` — routes based on session + onboarding state: signed out → `/sign-in`; onboarding neither completed nor dismissed → `/onboarding`; otherwise → `/dashboard`.
- `/dashboard` — the Milestone 1 minimum-viable Dashboard (Engineering Roadmap: "AI conversational greeting + a small set of static context cards — full Adaptive Home Screen dynamic assembly is deferred to when there's enough object data to rank"). Per UI/UX Specification §5, "the first element on the page is always the AI Chief of Staff... the experience begins with conversation," so the live chat panel (talking to `ai/orchestrator`'s conversational loop) comes first, above the cards. The 3 cards shown — Constitution Progress, Recent Activity, Quick Search — are genuinely backed by real Milestone 1 data (Object Service, AI Memory Service, Search Service), not placeholders standing in for §5's full card catalog (Today's Priorities, Calendar, Health Snapshot, etc.), which needs domain objects that don't exist until later milestones.

### On the Dashboard's Chief of Staff panel

Sending a message calls the live `ai/orchestrator` `/conversation` endpoint. In any environment without a configured `OPENAI_API_KEY` (including this development sandbox), the request fails predictably at the AI Provider Interface boundary, and the panel shows a graceful inline error rather than crashing — this is the same known gap already documented in `ai/orchestrator`'s own README (live LLM verification pending a real API key). The chat thread itself is ephemeral per page load; the orchestrator already gives the AI real cross-turn continuity via its own Working Memory read/write, so re-rendering the full transcript client-side after a refresh is a UI nicety, not something continuity depends on.

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

End-to-end via Playwright against the live backend services:

- **Onboarding**: sign-up redirects to onboarding; adding a Vision entry and skipping the remaining steps before finishing on Success correctly creates both Personal Constitution sub-entities and calls `onboarding/complete`, transitioning Cold Start phase from `INITIALIZATION` to `LEARNING`; reloading `/` after onboarding routes straight to `/dashboard`; dismissing onboarding immediately (no entries) also routes to `/dashboard`, and signing back in afterward does not show onboarding again.
- **Dashboard**: the greeting header renders the correct time-of-day + real user name; the Constitution Progress card shows the real Cold Start phase and a correct entry count; the Quick Search card finds a Constitution entry created moments earlier in the same session; the Recent Activity card correctly shows "Nothing yet" before any memory exists and then displays a Working Memory entry created via the API, after a reload; the Chief of Staff chat panel renders the user's own message immediately and shows the documented graceful error when the AI Provider Interface call fails (no `OPENAI_API_KEY` configured in this environment).
