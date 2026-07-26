# AI Chief of Staff Orchestrator

The Milestone 1 baseline Chief of Staff: a single-agent conversational loop following the AI Prompt Library's Conversation Framework (§28) — **Understand → Gather Context → Reason → Recommend → Act → Learn**. No specialist agents exist yet; the Engineering Roadmap defers those to Milestone 2+, once there is domain data (Tasks, Projects, Calendar, etc.) for a specialist to reason over.

## What this service is not

It owns no database. Every piece of data it touches — Constitution content, memory — is read from and written to the Object Service and AI Memory Service over HTTP, forwarding the caller's own session credentials rather than holding independent AI credentials (same pattern documented in every other Milestone 1 service's README). It reasons via the AI Provider Interface (`ai/providers`), never a vendor SDK directly.

## The conversational loop

`POST /conversation` — `{ message: string }`, behind `SessionGuard`. Response: `{ response: string, coldStartPhase: string }`.

1. **Understand** — no separate Intent Detection or specialist-routing step exists in Milestone 1 (Prompt Architecture §2's "Specialized Prompts" layer is empty); the user's message goes straight into the composed prompt and the LLM does the understanding as part of its single reasoning pass.
2. **Gather Context** — fetches Product, AI, and Personal Constitution (consultation order: Product → AI → Personal, per the Final Pre-Implementation Decisions) and the 10 most recent Working Memory entries for same-day conversational continuity. Each retrieved memory is `touch()`-ed, per that endpoint's documented purpose ("the Chief of Staff calls this whenever it actually draws on a memory").
3. **Reason** — `PromptComposer` assembles Layer 1 (Core Identity, static), Layer 2 (Constitution, phase-aware per Cold Start Behavior — Round 4 Decision 5), and Layer 3 (Current Context), then calls the AI Provider Interface. Personal Constitution content is Data Classification Tier 3 (AI Available) as of Round 10, so no `authorizedForExternalAI` flag is needed.
4. **Recommend** — the model's reply is returned as-is; there is no separate recommendation-formatting pass yet.
5. **Act** — not applicable in Milestone 1. There is no autonomous execution capability: no domain objects to act on, no Automation Engine, and the Trust & Authorization Service requires approval for every non-human actor until its full matrix exists (Milestone 3). This loop only recommends.
6. **Learn** — records the turn as a new Working Memory entry (`source: "chief-of-staff-conversation"`). Full memory-extraction from the Memory Update Prompt (§11) — "what should be forgotten," "what relationships changed" — needs domain objects/relationships that don't exist until later milestones; recording the turn itself is the Milestone 1 scope for this step.

## Cold Start Behavior

`PromptComposer` reads whatever `PersonalConstitution.status` currently holds (`INITIALIZATION` / `LEARNING` / `MATURE`) and gives the LLM materially different instructions per Round 4 Decision 5's three phases. It does not decide *when* a workspace transitions between phases — no transition algorithm is specified anywhere in the frozen architecture; that's a product decision for a later milestone.

## Scope boundaries deliberately not built in Milestone 1

- **Confidence Scoring** (Round 4 Decision 2) and **Confidence Threshold Calibration** (Round 4 Decision 6) — the Engineering Roadmap introduces these in Milestone 3, "the first milestone where the AI is taking autonomous or semi-autonomous actions... not just answering questions." Grounding (verification levels) and Self-Evaluation (Round 4 Decisions 4, 7) are instead encoded as prompt-level behavioral instructions in `core-identity.ts`, consistent with how the Prompt Library says AI behavior is controlled.
- **Specialist agents / Prompt Chaining** (§4, §23) — no domain data exists yet for a specialist to reason over.

## Run locally

```bash
cp ../../.env.example ../../.env   # from repo root, if not already done
docker compose -f ../../docker-compose.yml up -d postgres
pnpm build
pnpm --filter @lifeos/identity-service run start:dev       # SessionGuard depends on it
pnpm --filter @lifeos/object-service run start:dev          # Constitution data
pnpm --filter @lifeos/ai-memory-service run start:dev       # Memory data
pnpm --filter @lifeos/ai-orchestrator run start:dev
```

Health check: `GET http://localhost:4008/api/v1/health`.

## Verified

End-to-end against the live Identity/Object/AI Memory services: unauthenticated requests return 401; an authenticated request correctly gathers Product/AI/Personal Constitution and recent Working Memory, composes the prompt, and reaches the AI Provider Interface — confirmed via the exact failure point observed (`OpenAIProvider is not configured: OPENAI_API_KEY is empty`), since no OpenAI API key is available in this environment. **Live verification against a real OpenAI response, and the resulting Working Memory write in the Learn step, are still pending a configured `OPENAI_API_KEY`.** Formal automated tests (with a mocked `AIProviderGateway`, covering the Reason/Recommend/Learn steps that can't be exercised live here) are deferred to the Milestone 1 test-suite task, consistent with every other Milestone 1 service.
