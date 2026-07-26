# LifeOS — Engineering Implementation Roadmap

**Document Type:** Engineering Roadmap (Planning Artifact — No Code)
**Status:** v1.2 — updated to incorporate the Post-Milestone-0 Cleanup decisions (Round 7)
**Authority:** Subordinate to all frozen Version 1 architecture documents per the Source of Truth Hierarchy (Engineering Standards & Governance §4). This document does not introduce new architectural decisions — it sequences and operationalizes decisions already made across the 15 core specifications, 5 batches of architectural decisions, and the Final Pre-Implementation Decisions. See `docs/architecture-decisions.md` for the full consolidated decision record.
**Purpose:** Translate the frozen V1 architecture into a buildable milestone sequence, dependency graph, repository layout, and set of engineering strategies, so that every subsequent coding session has an unambiguous blueprint to follow.

---

## 1. Guiding Constraints Carried Into This Plan

Before sequencing anything, three frozen decisions shape every choice below and are restated here so this document is self-contained:

- **Nothing may touch a data object without going through the Canonical Object Registry / Object Service.** No domain module defines its own object types.
- **Nothing may execute an AI or automated action without passing through the Trust & Authorization Service**, which itself depends on Identity, Data Classification, Integration Trust, Regulatory Classification, and Automation Permission all being in place.
- **The technology stack is now locked** (Final Pre-Implementation Decisions, Decision 4) — no longer guidance. See §4 below for the confirmed stack, which replaces the System Architecture document's non-binding suggestions.
- **Every AI reasoning pass consults the three-constitution hierarchy** — Product Constitution → AI Constitution → Personal Constitution → Current Context → Historical Memory (Final Pre-Implementation Decisions, Decision 3) — superseding the Cognitive Architecture document's earlier claim that the Personal Constitution alone is "the highest authority within LifeOS." Product and AI Constitution now outrank it.
- **Objects live under exactly one Area, and Areas live under exactly one Space** (Final Pre-Implementation Decisions, Decision 1) — Workspace → Spaces (Work / Life / Content) → Areas → Objects.

---

## 2. Development Milestones

Expands Batch 1 Decision 9's five milestones into buildable scope. One structural addition is proposed relative to the original five-milestone list — flagged explicitly, not silently inserted.

### Milestone 0 — Platform Bedrock *(proposed addition, not in the original 5-milestone list)*

The original Milestone 1 groups Authentication, Core Object Engine, Database, Knowledge Graph Foundation, AI Memory Foundation, Dashboard, Search, and Chief of Staff together. Two Batch 3 services — **Trust & Authorization Service** and **Secrets Management Service** — are foundational prerequisites for *all* of those (per Batch 3: "no service may bypass this layer" / "no integration stores secrets independently"), so I'm proposing they land in an explicit Milestone 0 rather than being implicitly assumed inside Milestone 1. This is a sequencing clarification, not an architecture change — flagging per governance rules for your confirmation before treating it as settled.

**Scope:**
- Secrets Management Service (encryption at rest, rotation, audit logging, scoped access, versioning, revocation)
- Trust & Authorization Service skeleton (identity verification hook, classification enforcement hook, risk assessment hook, approval workflow hook, audit logging) — populated incrementally as later milestones add real permission/trust/classification data
- Data Classification enforcement scaffold (the 4-tier model as an enforced field + validation gate, even before there's much data to classify)
- Base observability (structured logging, health checks, error tracking) per Engineering Standards §13/§23

**Depends on:** Nothing (this is the root of the dependency graph).

---

### Milestone 1 — Foundation

**Scope:**
- **Authentication** — email/password, passkeys, Google OAuth, optional Apple Sign In, MFA, biometric unlock (mobile), session management, device management, revocation, account recovery, trusted devices (Batch 1 Decision 3)
- **Core Object Engine** — Object Service implementing the Canonical Object Registry's universal fields (Identity/Lifecycle/Relationships/Experience/System per Batch 2 Decision 3); workspace/owner scoping enforced on every write and read (Batch 3 Decision 1)
- **Database** — initial schema for the Core Objects domain (User, Workspace, Object, Folder, Tag, Label) following the Database Standards Specification conventions once that companion document exists (indexes, enums, cascade behavior, soft-delete per Batch 5 Decisions 6–7)
- **Knowledge Graph Foundation** — the Object Relationships table with the indexing required by Batch 3 Decision 3 (relationship-type indexing, object-type indexing, temporal filtering, priority-based traversal), plus the FK-vs-graph modeling rule from Batch 5 Decision 8 enforced from day one
- **AI Memory Foundation** — schema for the 8-tier memory model (Batch 4 Decision 1); only Working, Operational, and Constitution memory need real behavior at this stage, the rest just need to exist structurally
- **AI Provider Interface** — the abstract, vendor-agnostic interface (Batch 1 Decision 5), OpenAI as the only wired provider initially, with the routing hook (lightweight/reasoning/large-context) present but trivial until more providers exist
- **Three-Constitution model + Cold Start Phase 1 logic** — Product Constitution and AI Constitution are static/seeded at build time (not user-editable); the Personal Constitution object is the only one the user populates, starting empty via onboarding. Reasoning order is Product → AI → Personal → Current Context → Historical Memory (Final Pre-Implementation Decisions, Decision 3). The AI must be functional with zero Personal Constitution data (Batch 4 Decision 5)
- **First-Run / Onboarding Experience** — the guided context-building flow (Batch 5 Decision 5); this is what actually populates the Constitution and initial context, so it belongs in the same milestone as Cold Start logic, not deferred
- **Dashboard** — minimum viable version: AI conversational greeting + a small set of static context cards (full Adaptive Home Screen dynamic assembly is deferred to when there's enough object data to rank)
- **Search** — keyword search only across whatever objects exist at this point; semantic search deferred until the Vector Database has meaningful content
- **Chief of Staff (baseline)** — Core Identity Prompt, single-agent conversational loop (Understand → Gather Context → Reason → Recommend → Act → Learn per Prompt Library §28), no specialist agents yet since there's no domain data for them to reason over

**Depends on:** Milestone 0 (Secrets Management, Trust & Authorization skeleton).

---

### Milestone 2 — Core Planning

**Scope:**
- Tasks, Projects, Goals, Milestones, Calendar, Notes, Reviews — all as objects registered in the Canonical Object Registry, using the direct-FK relationship pattern for structural containment (Task→Project, Task→ParentTask, per Batch 5 Decision 8)
- **Planning Activity View** — the first Domain Activity View (Batch 5 Decision 9), since Planning is the first domain with enough cross-table query pressure to justify one
- Spaces/Areas navigation structure activated for the Work Space (Projects, Goals, Tasks, Calendar, Meetings, Knowledge, Contacts Areas per the Final Pre-Implementation canonical Area structure)
- Executive Briefing screen (morning briefing) and Daily/Weekly Review screens, using real Planning data for the first time
- AI Correction Workflow (Accept/Edit/Reject/Explain Why, Batch 5 Decision 4) — introduced here because this is the first milestone where the AI is making enough recommendations (task priority, scheduling) to need it

**Depends on:** Milestone 1 (Object Engine, Knowledge Graph, Chief of Staff baseline).

---

### Milestone 3 — Automation & Intelligence

**Scope:**
- **Automation Engine** — full Trigger Engine (WHEN/IF/THEN/VERIFY/LOG/LEARN), Rule Engine, Workflow Engine, Automation Builder schema, 4 Permission Levels, AI Approval Engine, Safety Framework, and the safeguards from Batch 3 Decision 12 (rate limiting, circuit breakers, dedup, execution budgets)
- **Life Event Engine** — Event Detection, the 11-stage lifecycle, Playbook Engine, Event Impact Analysis, Event Orchestration
- **Integration Layer (first wave)** — Integration Gateway, Connector interface, the centralized Integration Scheduler (Batch 5 Decision 17), Trust Level + Sensitivity/Regulatory Classification fields per connector, Fallback Strategy requirement enforced from the first connector built. First connectors: Google Calendar, Gmail, Google Drive (PRD's named Primary integrations) — chosen first because Calendar/Email are required inputs for the Executive Briefing built in Milestone 2
- **Notifications** — the 3-layer model (Priority × Type × Delivery Behavior, Batch 2 Decision 2)
- **Specialist Agents (first wave)** — Planning Agent and Executive Assistant Agent, since Planning and Calendar/Email data now exist to reason over; remaining specialist agents arrive with their domains in Milestone 4
- **Confidence scoring, verification levels, and self-evaluation** (Batch 4 Decisions 2, 4, 7) — introduced here because this is the first milestone where the AI is taking autonomous or semi-autonomous actions (automations, event detection) that need confidence gating, not just answering questions

**Depends on:** Milestone 2 (Planning objects to automate around) and Milestone 0/1 (Trust & Authorization Service must be fully real, not skeletal, before any automation executes).

---

### Milestone 4 — Domain Expansion

**Scope:**
- **Content Studio** (full: Idea Vault, Research Workspace, Script Workspace, Production Manager, Asset Library, Editing Tracker, Publishing Manager, Analytics Engine, Repurposing Engine, Brand Partnership Manager, Creative Calendar) + Content Strategist Agent
- **Finance** (Income, Expense, Budget, Subscription, Savings, Investment, Invoice) + Financial Activity View + Financial Analyst Agent — payment/banking integrations (Stripe, PayPal, Wise, and the Nigerian fintech providers) are **explicitly deferred to Milestone 5** given their Regulatory Classification is Critical and requires the heaviest authorization/auditing rigor; Finance in M4 is manual-entry-first
- **Health** (9 sub-tables: Weight, Sleep, Nutrition, Workout, Mood, Measurements, Cycle, Medication, Appointments) + Health Activity View + Health Advisor Agent — health-wearable integrations similarly deferred to M5 for the same regulatory-weight reason
- **Relationships** (Contacts) + Meeting Assistant Agent
- **Travel, Learning** + Travel Coordinator Agent, Research Agent
- **Reports expansion** — Weekly CEO Review, Monthly/Quarterly/Annual Review screens, now meaningful across all domains

**Depends on:** Milestone 3 (Automation Engine and Integration Layer must exist before domain-specific automations/integrations for Content, Finance, Health can be wired).

---

### Milestone 5 — Advanced Intelligence & Remaining Integrations

**Scope:**
- Full Pattern Memory analytics, Behavioral Drift Detection, Burnout/Distraction Detection, Recovery Algorithm
- Integration Intelligence Layer (cross-integration correlation subsystem, Batch 5 Decision 16) — deferred this late because it needs a rich, multi-domain object graph to correlate against
- Remaining/Future integrations: WhatsApp, Apple Health, Google Fit, Spotify, banking/payment providers (Stripe, PayPal, Wise, Moniepoint, Flutterwave, Paystack), Slack, Zoom, Notion import, smart home
- Full Creator Scorecard, Integration Analytics, Automation Health dashboards
- Multi-agent orchestration completed (Decision Analyst Agent, Reflection Agent, Automation Agent — the remaining named agents from System Architecture §10)
- Connector Trust Lifecycle automation (measurable promotion/demotion criteria, Batch 5 Decision 15) — only meaningful once enough connectors have run long enough to have a track record

**Depends on:** Milestone 4 (needs Finance/Health domain objects to exist as correlation/analysis targets).

---

## 3. Dependency Graph

```
M0: Platform Bedrock
 ├─ Secrets Management Service
 └─ Trust & Authorization Service (skeleton)
        │
        ▼
M1: Foundation
 ├─ Authentication ──────────────┐
 ├─ Object Service / Registry ───┼──► Knowledge Graph Foundation
 ├─ Database (Core Objects)      │
 ├─ AI Memory Foundation ◄───────┘
 ├─ AI Provider Interface
 ├─ Personal Constitution + Cold Start
 ├─ Onboarding
 ├─ Dashboard (minimal) / Search (keyword) / Chief of Staff (baseline)
        │
        ▼
M2: Core Planning
 ├─ Tasks / Projects / Goals / Milestones / Calendar / Notes / Reviews
 ├─ Planning Activity View
 ├─ Spaces/Areas navigation (Work Space activated)
 ├─ Executive Briefing / Review screens
 └─ AI Correction Workflow
        │
        ▼
M3: Automation & Intelligence
 ├─ Automation Engine (needs Trust & Authorization Service at full strength)
 ├─ Life Event Engine (needs Automation Engine)
 ├─ Integration Layer + Scheduler (needs Trust/Sensitivity/Regulatory classification)
 ├─ Notifications
 ├─ Specialist Agents: Planning, Executive Assistant
 └─ Confidence / Verification / Self-Evaluation framework
        │
        ▼
M4: Domain Expansion
 ├─ Content Studio ──► Content Strategist Agent
 ├─ Finance (manual-entry) ──► Financial Analyst Agent
 ├─ Health (manual-entry) ──► Health Advisor Agent
 ├─ Relationships ──► Meeting Assistant Agent
 ├─ Travel / Learning ──► Travel Coordinator Agent, Research Agent
 └─ Reports expansion (CEO/Monthly/Quarterly/Annual)
        │
        ▼
M5: Advanced Intelligence & Remaining Integrations
 ├─ Pattern Memory analytics, Drift/Burnout/Distraction Detection, Recovery Algorithm
 ├─ Integration Intelligence Layer (cross-integration correlation)
 ├─ Regulated integrations: Banking/Payments/Health-wearables
 ├─ Remaining specialist agents (Decision Analyst, Reflection, Automation)
 └─ Connector Trust Lifecycle automation
```

**Cross-cutting dependency, applies at every milestone:** any new object type entering the Canonical Object Registry requires synchronized updates to Schema, APIs, Knowledge Graph, AI Memory, Search, and UI in the same change (Batch 5 Decision 11) — this is not a one-time M1 task, it's a standing rule for every milestone that introduces new objects (M2's Tasks/Goals, M4's Content/Finance/Health, etc.).

---

## 4. Repository Structure

Per Engineering Standards §5: organized by business capability, never by technical layer at the top level.

### Confirmed Technology Stack (Final Pre-Implementation Decisions, Decision 4)

| Concern | Choice |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Desktop | Electron |
| Mobile | React Native + Expo |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL |
| Vector Search | pgvector |
| Caching | Redis |
| ORM | Prisma |
| Authentication | Better Auth (Clerk as fallback if Better Auth blocks implementation) |
| File Storage | S3-compatible object storage |
| AI Provider | OpenAI, behind the abstract AI Provider Interface |
| Workflow Engine | Temporal (preferred; propose a simpler event-driven alternative before replacing it if complexity becomes excessive) |
| Infrastructure | Docker, GitHub Actions, Vercel (frontend), Railway or Fly.io (early backend), provider-agnostic where practical |
| Logging | Structured JSON |
| Monitoring | OpenTelemetry-compatible instrumentation |

This replaces the System Architecture document's non-binding stack suggestions (which had listed FastAPI *or* NestJS, and Auth0/Clerk/Supabase as undecided options) with a single confirmed choice per concern.

```
/lifeos
├── /apps
│   ├── /web                    # Next.js — primary experience layer
│   ├── /mobile                 # React Native + Expo — capture/briefings/reviews/quick actions only
│   └── /desktop                # Electron shell around /web
│
├── /services                   # Core Services (System Architecture §5 + Batch 3 additions)
│   ├── /identity-service
│   ├── /object-service
│   ├── /knowledge-graph-service
│   ├── /ai-memory-service
│   ├── /automation-service
│   ├── /search-service
│   ├── /trust-authorization-service
│   ├── /secrets-management-service
│   └── /integration-scheduler
│
├── /domains                    # Business capability modules — each owns its full stack (api/logic/data access)
│   ├── /planning                # Goals, Projects, Tasks, Milestones, Reviews
│   ├── /calendar
│   ├── /content
│   ├── /finance
│   ├── /health
│   ├── /relationships
│   ├── /life-events
│   ├── /automation
│   ├── /journal
│   ├── /learning
│   └── /travel
│
├── /ai
│   ├── /orchestrator            # Chief of Staff — routes to specialist agents, synthesizes responses
│   ├── /agents                  # One folder per specialist agent
│   ├── /prompts                 # Prompt Library — modular, versioned prompt definitions
│   └── /providers               # AI Provider Interface implementations (openai, anthropic, google, local)
│
├── /integrations                # One folder per connector, implementing the common Connector interface
│   ├── /google-calendar
│   ├── /gmail
│   ├── /google-drive
│   └── ...                      # added incrementally per milestone
│
├── /packages                    # Shared libraries used across services/domains
│   ├── /domain-model             # Canonical Object Registry — single shared source of object types/schemas
│   ├── /db                       # Schema definitions + migrations
│   ├── /api-client
│   ├── /ui-components            # Design system (Engineering Standards-compliant, UI/UX §30)
│   └── /config
│
├── /infra                        # Infrastructure as Code
│   ├── /environments/{dev,staging,production}
│   └── /migrations
│
├── /docs                         # Architecture documents (this roadmap + the 15 frozen specs, versioned)
│
└── /tests
    └── /e2e
```

**Note on internal domain structure:** "organize by business capability, not technology" (Engineering Standards §5) applies to the *top level*. Within a single `/domains/<name>` folder, having internal sub-structure (e.g., `api/`, `models/`, `services/`) is expected and fine — the rule is that no domain's logic should be scattered *across* top-level technical folders, not that a domain can't have internal layering.

---

## 5. Backend Architecture

Following the System Architecture's layered model (§4) and the Core Services list (§5), extended with Batch 3's two new services:

| Layer | Responsibility |
|---|---|
| **Experience Layer** | No business logic — UI only |
| **AI Layer** | Chief of Staff orchestrator, specialist agents, Reasoning Engine, Planning Engine, Life Event Engine |
| **Domain Layer** | Task/Goal/Project/Health/Finance/Content/Relationship/Calendar/Document/Automation Managers — one per `/domains` folder |
| **Integration Layer** | Integration Gateway + Scheduler + Connectors |
| **Infrastructure Layer** | Databases, Identity, Storage, Caching, Background Workers, Logging, Monitoring, Search, Encryption, Backups |

**Nine Core Services** (7 from System Architecture §5 + 2 from Batch 3):
1. Identity Service
2. Object Service
3. Knowledge Graph Service
4. AI Memory Service
5. Automation Service
6. Search Service
7. **Trust & Authorization Service** *(Batch 3)* — single enforcement point; every AI/automation/integration action routes through it
8. **Secrets Management Service** *(Batch 3)* — centralized credential/key management; no service accesses raw secrets directly
9. **Integration Scheduler** *(Batch 5 Decision 17)* — owns rate-limit management, sync prioritization, retry/backoff, quota awareness; connectors never self-schedule

Services communicate through defined interfaces only, never direct database access across service boundaries (Architectural Principle: API First).

---

## 6. Frontend Architecture

- **Web (Next.js + React + TypeScript + Tailwind + shadcn/ui)** — full experience: Dashboard, Chat, Calendar, Task Views, Content Studio, Reviews, Notifications, Search, Reports, Widgets. Primary environment for planning, writing, managing, analysis, configuration (Batch 5 Decision 3).
- **Mobile (React Native + Expo)** — scoped to capture, briefings, reviews, notifications, quick actions, AI conversation only (Batch 5 Decision 3) — same information architecture as web, not identical functionality.
- **Desktop (Electron)** — a native shell around the web app for users who want an installed desktop presence beyond the browser.
- **Shared component library** (`/packages/ui-components`) — Buttons, Cards, Lists, Object headers, Timelines, Tables, Forms, AI recommendation cards, Chat bubbles, Search results, Notification banners, Modals, Drawers, Side panels (UI/UX §30), used by both web and mobile where the platform allows.
- **Core interaction surfaces**, built in this order of introduction: conversational Chief of Staff → Home Screen (adaptive) → Object-Centered pages (with AI Context Panel) → Universal Search → AI Command Palette (⌘K) → Focus Mode.
- **Conversation-first, navigation-secondary**, but the PRD's structural navigation constraints (≤2 sidebar levels, ≤3 clicks to any screen) remain binding on the traditional navigation mode per Batch 2 Decision 7.

---

## 7. Database Migrations

- **Prisma** is the confirmed ORM and migration tool (`prisma migrate`) against PostgreSQL.
- Every schema change requires: a migration script, a rollback script, tests, and updated documentation (Engineering Standards §9; Database Standards Specification, once written, governs the specifics — index strategy, enums, cardinality, cascade, soft-delete, naming, migration format).
- **No schema change may occur independently of the Canonical Object Registry** (Batch 5 Decision 11) — a migration that adds a new object type must land alongside the corresponding registry update, API surface, Knowledge Graph wiring, AI Memory consideration, Search indexing, and UI surface in the same change set.
- Soft-delete is the default (`deleted_at`); permanent deletion is a distinct, explicit administrative operation, never a side effect of a normal delete flow (Batch 5 Decision 7).
- Domain Activity Views (read models) are additive and must never become the source of truth — they're rebuilt/refreshed from the normalized schema, never written to directly (Batch 5 Decision 9).

---

## 8. API Strategy

- **REST is primary** for CRUD, versioned at `/api/v1/`; breaking changes require a new version (Batch 1 Decision 2; Engineering Standards §8).
- **WebSockets** for live updates (e.g., dashboard refresh, notification delivery).
- **Background events** for internal service-to-service communication (event bus).
- **AI function calling** as the interface between the orchestrator/agents and domain services.
- GraphQL explicitly excluded from V1.
- All APIs: versioned, documented, input-validated, consistent response shape, structured errors, idempotent where appropriate.
- Internal services never share a database directly — only through service interfaces.

---

## 9. Authentication Strategy

Implemented on **Better Auth** (Clerk as fallback if Better Auth creates implementation blockers — this is an allowed substitution per Final Pre-Implementation Decisions, Decision 4, not a deviation requiring the Architectural Change Process). Per Batch 1 Decision 3, built multi-user-capable even though V1 exposes a single personal workspace:
- Email/password, passkeys where supported, Google OAuth, optional Apple Sign In
- MFA, biometric unlock on supported devices
- Secure session management, device management, session revocation, trusted devices
- Account recovery such that device loss never causes permanent data loss
- All authentication events feed the Identity Security anomaly monitoring required by Batch 3 Decision 13 (new device logins, impossible travel, mass approval requests, sudden integration changes, etc.), enforced through the Trust & Authorization Service

---

## 10. Deployment Strategy

- Three environments: Development, Staging, Production (System Architecture §20).
- Infrastructure as Code, automated backups (encrypted, incremental, versioned, with tested restore per Batch 1 Decision 7), centralized logging, secret management via the dedicated service (not environment variables holding raw secrets).
- **Offline-first runtime**: the local application is the primary runtime; cloud sync is asynchronous (Batch 1 Decision 6) — this has deployment implications beyond the server side, since the client itself needs a local database/cache and background sync worker.
- Every deployment must be reversible (Engineering Standards §20, §24).

---

## 11. Testing Strategy

Per Engineering Standards §17, every feature requires: unit tests, integration tests, end-to-end tests, AI behavior tests, and regression tests.

**AI behavior tests are qualitatively different from the other four** and worth calling out separately: LLM outputs are non-deterministic, so these can't be pure assertion tests. Recommended approach (consistent with Prompt Library §18's evaluation criteria — accuracy, consistency, clarity, actionability, latency, hallucination rate, completion quality):
- Golden-dataset evaluation sets per prompt module, re-run on every prompt version change (Prompt Versioning, Prompt Library §19)
- Confidence-score calibration checks against the thresholds defined in Batch 4 Decision 6, reviewed periodically against observed outcomes, not treated as fixed forever
- Recommendation-acceptance-rate tracking as a live quality signal, not just a pre-release gate

---

## 12. CI/CD Strategy

Per Engineering Standards §24 (Release Governance), every release must pass, in this order:
1. Automated tests (unit/integration/e2e/AI behavior/regression)
2. Security review
3. Performance review
4. AI behavior validation
5. Regression testing
6. Documentation review

Semantic versioning (MAJOR/MINOR/PATCH) with release notes on every release (Engineering Standards §19). Releases must be reversible — CI/CD pipeline should support rollback as a first-class operation, not a manual emergency procedure.

---

## 13. Estimated Complexity

Given relative sizing (S / M / L / XL) rather than calendar time — **no team size or velocity has been established yet, so converting this to weeks/months would be a fabricated precision I'm not going to invent.** Once a team size is known, these relative sizes can be converted to a real timeline.

| Milestone | Relative Size | Primary Complexity Driver |
|---|---|---|
| M0 — Platform Bedrock | M | Security-critical; must be right before anything else builds on it |
| M1 — Foundation | XL | Highest surface area: auth, object engine, DB, graph, memory, AI provider abstraction, onboarding all at once |
| M2 — Core Planning | L | Mostly CRUD + first Activity View + first real AI recommendations (Correction Workflow) |
| M3 — Automation & Intelligence | XL | Automation Engine + Life Event Engine + first integrations + confidence framework is the densest cross-cutting milestone in the plan |
| M4 — Domain Expansion | L (repeats ×5 domains) | Individually moderate per domain, but 5 domains in parallel or series adds up; Finance/Health scoped down (manual-entry-first) to control size |
| M5 — Advanced Intelligence & Remaining Integrations | L | Cross-integration correlation and regulated integrations (banking/health) carry outsized security/compliance weight relative to their feature size |

---

## 14. Definition of Done — Per Milestone

Base checklist for every milestone (derived from Engineering Standards §20 Definition of Done and Batch 5's Architecture Completion Rule — a feature isn't complete until UX, data model, AI behavior, automation behavior, security, integration, scalability, failure behavior, recovery behavior, and testing strategy are all defined):

**Universal criteria (apply to every milestone):**
- [ ] Requirements implemented per the relevant frozen specification(s)
- [ ] New object types (if any) registered in the Canonical Object Registry with synchronized Schema/API/Graph/Memory/Search/UI updates
- [ ] Unit, integration, e2e, AI behavior (if applicable), and regression tests passing
- [ ] Security reviewed, including Trust & Authorization Service enforcement verified for any new action type
- [ ] Data classification assigned to every new object/field
- [ ] Performance validated against System Architecture §17 observability metrics
- [ ] Accessibility reviewed (keyboard nav, screen reader, contrast, focus states)
- [ ] Documentation updated (purpose, architecture, API docs, data model changes, testing notes, known limitations)
- [ ] Code reviewed against the AI Code Review Checklist (Engineering Standards §21)
- [ ] No undocumented technical debt introduced (Engineering Standards §22)

**Milestone-specific additions:**

- **M0**: Secrets never appear in logs or code; Trust & Authorization Service correctly denies an unauthorized test action end-to-end.
- **M1**: A user can complete onboarding, have a Constitution (even sparse), ask the Chief of Staff a question, and get a grounded, explainable answer — cold start Phase 1 behavior verified explicitly.
- **M2**: AI Correction Workflow demonstrably changes future recommendations (Batch 4 Learning Governance verified — behavioral learning occurs, Constitution is untouched without approval).
- **M3**: A test automation runs through the full WHEN/IF/THEN/VERIFY/LOG/LEARN pipeline with a Trust Level + Permission Level combination that correctly requires approval (Batch 3 Decision 11's banking-transfer-style example reproduced with a real trigger).
- **M4**: Each new domain's Activity View returns correct cross-table results without requiring the AI to perform manual cross-table scans.
- **M5**: A cross-integration correlation (e.g., flight email + calendar event + hotel booking) correctly produces one Life Event with an appropriate confidence score and, where ambiguous, correctly requests user confirmation instead of guessing.

---

## 15. Resolved Items (formerly blocking, now closed)

All four items previously listed here were resolved by the Final Pre-Implementation Decisions and are no longer open:

1. **Areas granularity** — resolved. Canonical structure: Work (Projects, Goals, Tasks, Calendar, Meetings, Knowledge, Contacts), Life (Health, Finance, Relationships, Learning, Travel, Home, Personal), Content (Ideas, Content Library, Campaigns, Brand Partnerships, Audience, Analytics).
2. **Regulatory Classification vs. Sensitivity Level** — resolved as two independent fields, both evaluated by the Trust & Authorization Service. Sensitivity Level (Critical/High/Medium/Low) answers "how damaging is disclosure"; Regulatory Classification (None/Standard/Financial/Health/Government/Identity/Legal) answers "what external obligations apply."
3. **Product/AI/Personal Constitution** — resolved as three distinct, permanently-ranked constitutions: Product (permanent, product philosophy), AI (permanent, AI behavioral rules), Personal (evolving, user-owned). Consultation order: Product → AI → Personal → Current Context → Historical Memory.
4. **Technology stack** — resolved and locked; see §4.

## 16. Items Resolved by Post-Milestone-0 Cleanup (formerly blocking Milestone 1/4)

All five items previously listed here are now resolved by `architecture-decisions.md` Round 7 — see `docs/architecture-compliance-report.md` v2 for full detail:

1. **Canonical Object Registry Constitution domain group** — resolved. A new `Constitution` Area (Life Space) holds `ProductConstitution`, `AIConstitution`, `PersonalConstitution`, plus the 8 `PersonalConstitution*` sub-entities.
2. **Priority and Risk value sets** — resolved. `Priority`: LOW/MEDIUM/HIGH/CRITICAL. `Risk`: MINIMAL/LOW/MODERATE/HIGH/CRITICAL.
3. **Journal Area placement** — resolved. Canonical home: `Life → Personal`, freely cross-linked via the Knowledge Graph.
4. **Health domain reconciliation** — resolved. Canonical list: `Habit, HabitLog, Workout, SleepRecord, Meal, Medication, HealthMetric, HealthGoal, HealthCheckIn`. One residual mapping question (HealthMetric/HealthCheckIn/Appointments) is open as a non-blocking Recommended finding (R5) for resolution before Milestone 4.
5. **Legal Document object** — resolved. Added to the registry at `Life → Personal`.

**Milestone 1 is now implementation-ready per the compliance report**, pending your explicit approval to begin.

## 17. Milestone Scope Updates from Round 7

- **Milestone 1** ("Three-Constitution model + Cold Start Phase 1 logic") now explicitly includes registering `ProductConstitution`, `AIConstitution`, and `PersonalConstitution` as real objects in the Constitution Area under the Life Space, with Product/AI Constitution seeded as effectively-immutable data at build time and Personal Constitution starting empty.
- **Milestone 4**'s Health scope is now the canonical 9-object list (`Habit, HabitLog, Workout, SleepRecord, Meal, Medication, HealthMetric, HealthGoal, HealthCheckIn`) rather than the Database Schema's original 9 sub-tables — pending R5's resolution on the Appointments/discriminator mapping.
- **Milestone 4**'s Content Studio / Brand Partnership scope, and **Milestone 3**'s contract-detecting automations, now have a real `LegalDocument` object to attach to rather than an unregistered concept.
- A small, zero-risk item carried forward: two code comments in the Milestone 0 scaffold (`services/trust-authorization-service/src/authorization/authorization-input.interface.ts` and `authorization.service.ts`) still reference "Blocking finding B2" as open. These are now stale (not wrong) and will be updated to reference the new Priority/Risk enums at the start of Milestone 1, or sooner if you'd like that treated as documentation-only housekeeping rather than implementation.
