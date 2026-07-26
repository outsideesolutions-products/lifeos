# LifeOS — Consolidated Architecture Decisions

**Document Type:** Architecture Decision Record (Addendum)
**Status:** Frozen — Version 1
**Authority:** Second in the Source of Truth Hierarchy, immediately below Product Vision (Engineering Standards & Governance §4). Every decision in this document supersedes conflicting text in the 15 original frozen specifications it references, per the Interpretation Rule established in Batch 2: *higher-ranked documents define constraints lower-ranked documents must respect; lower documents may specialize or extend but never contradict.*

**Why this document exists:** The 15 original specifications (Product Vision, Engineering Standards & Governance, System Architecture, Domain Model, Database Schema, AI Cognitive Architecture, AI Reasoning Engine, PRD, UI/UX Specification, Integration Specification, Automation Engine, Life Event Engine, AI Chief of Staff Specification, Content Studio, AI Prompt Library) were authored independently and contained a number of gaps and inconsistencies, identified in a full architecture review and resolved across six rounds of decisions. The source documents themselves have not been rewritten — this addendum is the authoritative record of what has changed, and it is binding wherever it conflicts with the original text of any lower-ranked document.

---

## Round 1 — Foundational Gaps

**1. Canonical Object Inventory.** The Domain Model is the sole owner of object definitions. Database Schema, APIs, Knowledge Graph, AI Memory, Automation Engine, and UI all derive from one registry, grouped by domain rather than a flat list:

- **Core Objects:** User, Workspace, Object, Folder, Tag, Label
- **Planning:** Goal, Project, Task, Milestone, Decision, Review
- **Calendar:** Meeting, Event, Calendar, Reminder
- **Communication:** Email, Contact, Conversation, Message
- **Knowledge:** Document, Note, Journal Entry, Knowledge Item
- **Content:** Content Asset, Script, Campaign, Brand Partnership, Audience Interaction, Media Asset
- **Finance:** Transaction, Budget, Account, Invoice, Subscription
- **Health:** Habit, Workout, Sleep Record, Meal, Medication, Health Metric
- **Intelligence:** Life Event, Playbook, Automation, Recommendation, Insight, Pattern, Memory
- **Integration:** Connector, External Account, Sync Job

No document may define object types independently. See the Architecture Compliance Report for known gaps in this registry (Constitution objects, Legal Document, some Health sub-types) still pending resolution.

**2. API Surface.** REST primary at `/api/v1/`; WebSockets for live updates; background events for internal comms; AI function calling for agent interaction. GraphQL excluded from V1. Internal services communicate through service interfaces, never direct database access.

**3. User Authentication.** Built multi-user-capable even though V1 exposes one workspace: email/password, passkeys, Google OAuth, optional Apple Sign In, MFA, biometric unlock, session management, device management, revocation, account recovery, trusted devices. Device loss must never cause permanent data loss.

**4. Local vs. Cloud Data Classification.** Four tiers, every object must declare one:
- **Tier 1 — Local Only:** never transmitted without explicit approval (raw journal entries, passwords, API keys, encryption keys, auth tokens, notes explicitly marked Local, highly sensitive notes)
- **Tier 2 — Private:** may be encrypted/synced to cloud storage, summarized only when necessary (financial records, health records, legal documents, contracts, identity documents)
- **Tier 3 — AI Available:** may be shared with AI services (tasks, projects, goals, calendar, emails, notes, content, meetings, relationships)
- **Tier 4 — Public:** safe for integrations/publishing (published content, social posts, public profile info)

**5. LLM Strategy.** Model-agnostic via an abstract AI Provider Interface. OpenAI is the V1 default; Anthropic, Google, local models, and any future provider implementing the interface are supported. Intelligent routing by task size (lightweight/reasoning/large-context models). Fallback providers supported. No business logic depends on vendor-specific APIs.

**6. Offline Architecture.** Local application is the primary runtime; cloud sync is asynchronous. Requires local database, local cache, offline object editing, conflict detection/resolution, background sync with automatic retry.

**7. Backup & Disaster Recovery.** Automatic encrypted incremental backups, version history, restore points, recovery testing, device-replacement support, configurable retention. Full workspace restore to a new device with minimal manual effort.

**8. Sensitive Data Handling.** Encrypt at rest and in transit; minimize stored payment info (use provider APIs, not stored credentials); classify and protect health data; audit-log all AI access to sensitive objects; support user-controlled export and deletion.

**9. MVP and Build Phasing.** Five milestones (see `engineering-roadmap.md` for the buildable expansion of these): Foundation → Core Planning → Automation/Life Events/Integrations → Content/Finance/Health/Relationships/Travel/Learning → Advanced AI/Predictive Intelligence/Analytics. No feature is out of scope for the product vision simply because it lands in a later milestone.

---

## Round 2 — Conflict Resolution & Cross-Document Governance

**1. AI Memory Model.** Hierarchical, not flat. Eight canonical storage-layer types (superseding the Cognitive Architecture's 4-type list, the Database Schema's 5-type list, and the System Architecture's 7-type list): **Working, Operational, Long-Term, Semantic, Behavioral, Decision, Conversation, Constitution.** Pattern Memory is not a separate storage layer — it's an analytical capability built on Behavioral, Semantic, and Long-Term Memory.

**2. Notification Taxonomy.** Three orthogonal layers, not competing lists. Every notification carries one value from each:
- **Priority:** Critical / High / Medium / Low / Silent
- **Type:** Requires Action / Reminder / Recommendation / Celebration / Reflection / Suggestion / FYI / Digest
- **Delivery Behavior:** Immediate / Scheduled / Bundled / Context-Aware / Silent

**3. Universal Object Fields.** Merged model, superseding both the Domain Model's and Database Schema's independent field lists:
- **Identity:** ID, Type, Owner, Workspace
- **Lifecycle:** Created At, Updated At, Deleted At, Archived At, Version
- **Relationships:** Related Objects, Parent, Children
- **Experience:** Priority, Status, Location, Timeline History, Favorite
- **System:** Metadata, Created By, Updated By, Source, Classification

**4. Decision Scoring.** The AI Reasoning Engine's Opportunity Score is canonical, using this specific dimension set (which differs from both the original Cognitive Architecture and the original Reasoning Engine document text — this is a third, final list): **Strategic Value, Urgency, Importance, Effort, Risk, Confidence, Opportunity Cost, Resource Availability, Time Sensitivity, Constitution Alignment.**

**5. Integration Inventory.** The Integration Specification is the single authoritative connector registry. No other document may introduce a new integration.

**6. Initiative vs. Permissions vs. Maturity.** Three distinct, cross-referencing systems, never merged:
- **AI Initiative Level** — how proactive the Chief of Staff is (user preference)
- **Automation Permission Level** — what an automation may execute without approval (per-automation)
- **Automation Maturity** — overall system trust, earned over time

**7. Navigation Philosophy.** Conversation is primary; traditional navigation remains fully supported and still bound by the PRD's structural constraints (≤2 sidebar levels, ≤3 clicks to any screen, consistent hierarchy).

**8. Mobile vs. Desktop.** Conceptually consistent, not functionally identical. Desktop: planning, writing, managing, analysis, configuration. Mobile: capture, briefings, reviews, notifications, quick actions, AI conversation. Objects are identical across platforms; capabilities adapt to the device. (Refined further in Round 6, Decision 3 below.)

**9. Spaces vs. Areas.** Spaces are top-level UI organization; Areas are logical business domains belonging to exactly one Space. (Fully specified in Round 6, Decision 1 below, which supersedes the illustrative example given in this round.)

**10. Life Event Impact Scoring.** User-facing 1–5 star rating; internally maps onto the Opportunity Score's multidimensional model. The user sees a simple rating; the AI reasons with the full model.

**Cross-Document Governance Rule (original, corrected in Round 6):** a 13-document precedence hierarchy was established here and later corrected — see the Source of Truth Hierarchy in Round 6, Decision 5, which is authoritative.

---

## Round 3 — Scalability & Security

**1. Future Scalability.** V1 ships single-user, but every persistent object carries Workspace ID and Owner ID, and every service query is workspace-scoped internally, even with one workspace.

**2. Long-Term Data Growth.** Four-stage data lifecycle: **Active** (frequently accessed) → **Warm** (occasionally accessed) → **Archive** (rarely accessed, preserved) → **Immutable History** (never modified: Decisions, audit logs, Life Events, completed reviews). Archive transparently rather than delete.

**3. Knowledge Graph Performance.** The Object Relationship Store must support indexed relationship traversal, relationship-type indexing, object-type indexing, temporal filtering, and priority-based traversal — no separate graph database required in V1; the storage implementation may evolve later without changing the logical graph model.

**4. Context Retrieval.** Context assembly is a ranking problem, not "retrieve everything relevant." Ranking factors: relevance to the current request, temporal proximity, relationship distance, active Life Events, current projects, user focus, importance score, interaction frequency, recency, Constitution relevance. Build the smallest context capable of a high-quality response.

**5. Vector Database Strategy.** Embeddings are versioned assets (version, model, timestamp, source object, status), not permanent truths. Re-embedding on model change happens asynchronously, never blocking the user.

**6. AI Workload Management.** Four execution tiers, each gated by an orchestration layer that judges whether execution is justified: **Immediate** (direct interactions), **Scheduled** (briefings, reviews, planning), **Event-Driven** (meaningful changes, Life Events), **Background** (pattern analysis, memory consolidation, indexing).

**7. Authorization Enforcement.** A single enforcement point evaluates every AI/Automation/Integration/connector action: user permissions, automation permission level, integration trust level, object classification, action risk level, current user preferences. No service may bypass it. *(Named "Trust & Authorization Service" — see the New Foundational Service below.)*

**8. Data Classification Enforcement.** Mandatory, not informational. The AI Provider Interface validates classification before every external AI request; protected objects never leave the approved execution environment without explicit user authorization.

**9. Secrets Management.** Centralized Secret Management Service. No integration stores secrets independently. Encryption at rest, automatic rotation where supported, audit logging, scoped access, versioning, revocation. Application code never accesses raw secrets directly.

**10. Integration Credential Trust (Sensitivity Level).** Every integration carries a sensitivity classification — **superseded by Round 6, Decision 2**, which finalizes the value set and clarifies its relationship to Regulatory Classification.

**11. Automation Authorization Matrix.** Sequential pipeline: `Integration Trust → Object Classification → Action Risk → Automation Permission → Authorization Service → Execute or Request Approval`. A trusted source never bypasses permission requirements (e.g., a verified banking integration proposing a large transfer still requires explicit approval because the action risk is high).

**12. AI & Automation Safeguards.** Rate limiting, circuit breakers, duplicate-trigger detection, event deduplication, maximum execution depth, cool-down periods, execution budgets, automatic suspension of unhealthy workflows. Automations fail safely, never repeat blindly.

**13. Identity Security.** Continuous anomaly monitoring: new device logins, unusual locations, impossible travel, mass approval requests, unusual automation activity, failed authentication attempts, sudden integration changes, sensitive data export requests. High-risk events require additional verification.

**Security by Default (principle).** Every action is unauthorized until proven safe. Authorization always combines Identity, Integration Trust, Data Classification, Action Risk, Automation Permission, User Preferences, and Current Context — never a single subsystem's decision alone.

**New Foundational Service — Trust & Authorization Service.** The 7th Core Service (joining Identity, Object, Knowledge Graph, AI Memory, Automation, and Search Service from System Architecture §5). Centralizes identity verification, data classification enforcement, automation permissions, integration trust evaluation, risk assessment, approval workflows, and audit logging. Final authority on whether an action is allowed, requires approval, or is denied.

---

## Round 4 — AI Correctness & Trust

**1. Canonical AI Taxonomies.** A single registry governs Memory Types, Notification Taxonomy, Confidence Levels, Decision Scores, Priority Levels, Risk Levels, Automation Permissions, Initiative Levels, Data Classifications, Life Event Categories, and Verification Levels (the last added implicitly by Decision 4 below). No subsystem may redefine these independently. *(Priority Levels and Risk Levels are named here but never given concrete values in any round — see the Architecture Compliance Report.)*

**2. Confidence Scoring.** Evidence-based, not model self-report. Weighted combination of: Evidence Quality, Evidence Consistency, Data Freshness, Relationship Strength, Historical Accuracy, Model Confidence (one input among several), External Verification. Exposed as both a number and a human-readable explanation.

**3. Specialist Reasoning Architecture.** Hybrid, resolving System Architecture's multi-agent model vs. the Prompt Library's prompt-module model: **Prompt Modules define how a specialist thinks** (expertise); **Specialist Agents define who is thinking** (reasoning ownership, each dynamically assembling its own prompt from the library); the **Chief of Staff orchestrates and synthesizes**.

**4. Grounding and Fact Verification.** Facts, Inferences, Predictions, and Suggestions must never be presented interchangeably. Five verification levels tracked per claim: **Verified → Observed → Inferred → Predicted → Speculative.** High-impact recommendations must lean on Verified/Observed data; insufficient evidence must be stated explicitly, never presented as fact.

**5. Cold Start Behavior.** Three AI maturity phases:
- **Phase 1 — Initialization:** no Personal Constitution yet; the AI operates on the Product Constitution, AI Constitution, general best practices, and explicit user instructions. Encourages, never requires, Constitution completion.
- **Phase 2 — Learning:** Personal Constitution exists but is incomplete; recommendations combine existing entries, observed behavior, user corrections, and clearly-flagged temporary assumptions.
- **Phase 3 — Mature:** the Personal Constitution is the primary decision framework; behavioral observations refine it but never silently overwrite it; updates always require user review and approval.

**6. Confidence Threshold Calibration.** Thresholds are configuration values, not constants, reviewed periodically against observed outcomes. V1 defaults (supersedes the Life Event Engine's original 3-band scheme):
- 95–100%: automatic execution, only if authorization requirements are also satisfied
- 85–94%: strong recommendation, low uncertainty
- 70–84%: recommendation with explicit assumptions, confirmation encouraged
- 50–69%: suggestion only, highlight missing information
- Below 50%: ask clarifying questions, no autonomous action

**7. AI Self-Evaluation.** Before returning any significant response, the AI checks: did I answer the question, did I rely on verified information where possible, did I distinguish facts from assumptions, did I explain trade-offs, is my confidence justified, would more information materially help, am I recommending action outside my authorization. Revise or ask rather than return a low-quality answer.

**8. Recommendation Traceability.** Every major recommendation keeps an internal reasoning record (objects considered, data sources, specialist agents consulted, prompt modules invoked, confidence calculation, trade-offs, final recommendation, timestamp) — available on request/diagnostics, not shown by default.

**9. AI Learning Governance.** The AI may autonomously learn preferences, routine patterns, scheduling habits, accepted recommendations, communication style. It may **never** autonomously change the Personal Constitution, decision algorithms, authorization rules, confidence methodology, or core reasoning principles — those require explicit user approval.

**Trust Through Explainability (principle).** Governs the Cognitive Architecture, Reasoning Engine, Chief of Staff Specification, and Prompt Library specifically. Every important recommendation is explainable; every confidence score is justified; every autonomous action is traceable; every inference is distinguishable from verified fact; every learning event is transparent and reviewable.

---

## Round 5 — UX, Database, and Integration Closure

**1. User Experience Philosophy.** AI-first, not AI-only. Every screen must justify its existence against: clarity over completeness, focus over feature density, progressive disclosure over overwhelming menus, conversation before navigation, defaults before configuration, context before dashboards.

**2. Spaces and Areas (hierarchy mechanic; final content in Round 6).** `Workspace → Spaces → Areas → Objects`. Areas never exist outside a Space — one hierarchy, no duplicate organizational models.

**3. Desktop and Mobile.** Same information architecture, not identical functionality. Desktop optimized for management; mobile for execution. Navigation concepts consistent; capabilities adapt to device.

**4. AI Correction Workflow.** Every significant recommendation supports Accept / Edit / Reject / Explain Why, captured as structured feedback (recommendation, correction, reason, learning outcome). Behavioral learning may occur; Constitution updates still require explicit approval.

**5. First-Run Experience.** Dedicated onboarding whose objective is building the AI's understanding, not configuration for its own sake. Collects: Personal Constitution, current goals, active projects, work style, health priorities, financial priorities, connected accounts, existing calendars, existing documents. Gradual context-building; useful within the first session even if incomplete.

**6. Database Standards.** A companion Database Standards Specification (not yet written) will define index strategy, enum definitions, cardinality rules, constraints, cascade behavior, soft-delete policy, naming conventions, migration standards. The Database Schema document defines structure only; this new document defines implementation rules.

**7. Soft Delete Policy.** Objects are never physically removed by default. Child objects remain intact; relationships become inactive rather than deleted; audit history and AI memory stay immutable/retained; restoring an object auto-restores its valid relationships. Permanent deletion is an explicit administrative operation.

**8. Relationship Modeling.** Codified hybrid rule (previously inferred, now explicit): **direct foreign keys** for stable, frequently-queried structural ownership (Task→Project, Task→Parent Task, Transaction→Account, Meeting→Calendar); the **relationship graph** for semantic connections (Project supports Goal, Meeting discusses Project, Journal references Life Event, Content inspired by Conversation).

**9. Domain Activity Views.** Each major domain exposes an optimized read model (Health Activity View, Financial Activity View, Content Activity View, Planning Activity View) to avoid repeated cross-table scans, without altering the normalized storage model.

**10. Metadata Usage.** Metadata is an extension mechanism only — provider-specific values, future-compatibility fields, experimental properties, non-indexed optional attributes. Frequently-queried metadata is promoted into structured columns over time.

**11. Database Evolution.** The schema evolves alongside the Canonical Object Registry. Any new object requires synchronized updates to Schema, APIs, Graph, AI Memory, Search, and UI in the same change. No document introduces objects independently.

**12. Integration Registry.** Every connector record includes: Capability, Authentication, Sync Direction, Sync Frequency, Trust Level, Sensitivity Level, Data Categories, Version, Status. Unregistered integrations are unsupported.

**13. Regulatory Classification (superseded — see Round 6, Decision 2 for the final value set and its relationship to Sensitivity Level).**

**14. Integration Fallback Strategy.** Every integration defines a fallback: manual entry, CSV import/export, read-only sync, partial functionality, graceful degradation. A missing API never makes a feature fully unusable.

**15. Connector Trust Lifecycle.** Trust Level promotion/demotion is governed by measurable criteria (sync success rate, data quality, error frequency, API stability, user confirmations, historical reliability). The AI may recommend a change; the user is the final authority.

**16. Integration Intelligence.** A dedicated cross-integration correlation subsystem, using signals: time proximity, location similarity, shared participants, matching organizations, object relationships, communication references, travel patterns, unique identifiers. Generates candidate correlations; the AI confidence-gates before creating Life Events; ambiguous correlations require user confirmation.

**17. Integration Coordination.** A centralized Integration Scheduler owns rate-limit management, sync prioritization, retry logic, queue management, backoff strategies, dependency coordination, API quota awareness. Connectors never self-schedule.

**Architecture Completion Rule (principle).** No feature is architecturally complete until it defines: user experience, data model, AI behavior, automation behavior, security implications, integration implications, scalability implications, failure behavior, recovery behavior, testing strategy.

---

## Round 6 — Final Pre-Implementation Decisions

**1. Areas Granularity — final and authoritative.**

`Workspace → Spaces → Areas → Objects`. Spaces are the highest-level user-facing organizational groups. **V1 has exactly three Spaces: Work, Life, Content.** Areas belong to exactly one Space:

| Space | Areas |
|---|---|
| **Work** | Projects, Goals, Tasks, Calendar, Meetings, Knowledge, Contacts |
| **Life** | Health, Finance, Relationships, Learning, Travel, Home, Personal |
| **Content** | Ideas, Content Library, Campaigns, Brand Partnerships, Audience, Analytics |

Objects always belong to an Area. Areas never exist outside a Space. Spaces are purely organizational and never duplicate an Area's responsibility.

*Note: this canonical structure does not include "Career," "Business," "Spiritual," or "Administration," all present in the original Domain Model's 12 Areas. See the Architecture Compliance Report for this finding.*

**2. Regulatory Classification vs. Sensitivity Level — final and authoritative.**

Two independent properties, both evaluated separately by the Trust & Authorization Service:

- **Sensitivity Level** answers "how damaging would unauthorized access or disclosure be?" — **Critical / High / Medium / Low**
- **Regulatory Classification** answers "what external legal or regulatory obligations apply?" — **None / Standard / Financial / Health / Government / Identity / Legal**

Every integration and every object may carry both. Examples: Google Calendar (Sensitivity: High, Regulatory: Standard); Bank Account (Sensitivity: Critical, Regulatory: Financial); Medication Record (Sensitivity: Critical, Regulatory: Health).

*This finalizes and replaces the Sensitivity tiers given in Round 3, Decision 10 and the Regulatory tiers given in Round 5, Decision 13, which used different, non-reconciled value sets.*

**3. Constitution Hierarchy — final and authoritative.**

LifeOS has three constitutions:

- **Product Constitution** — purpose, philosophy, principles, long-term vision of LifeOS. Permanent; changed only through explicit architectural revision.
- **AI Constitution** — how the AI behaves (never fabricate facts, explain reasoning, protect privacy, respect authorization, optimize for long-term benefit, remain aligned with the Product Constitution). Permanent.
- **Personal Constitution** — the user's goals, values, preferences, ambitions, boundaries, lifestyle. Evolves over time; updates always require explicit user approval.

**Reasoning consultation order:** Product Constitution → AI Constitution → Personal Constitution → Current Context → Historical Memory.

*This supersedes the Cognitive Architecture document's original claim that "the Personal Constitution is the highest authority within LifeOS" — Product and AI Constitution now outrank it.*

**4. Technology Stack — final and authoritative.**

See `engineering-roadmap.md` §4 for the full table. Summary: Next.js/React/TypeScript/Tailwind/shadcn (web), Electron (desktop), React Native + Expo (mobile), NestJS + TypeScript (backend), PostgreSQL + pgvector (database/vector), Redis (cache), Prisma (ORM), Better Auth with Clerk fallback (auth), S3-compatible storage, OpenAI behind the AI Provider Interface, Temporal (workflow engine, with an approved escape hatch to a simpler event-driven alternative if complexity becomes excessive), Docker + GitHub Actions + Vercel + Railway/Fly.io (infrastructure), structured JSON logging, OpenTelemetry.

**5. Corrected Source of Truth Hierarchy — final and authoritative.**

Supersedes both the original 13-document list from Round 2 and the reordered 15-document list that briefly appeared in the Engineering Standards & Governance Specification (that reordering was confirmed unintentional):

1. Product Vision
2. Engineering Standards & Governance Specification
3. System Architecture
4. Domain Model & Object Relationships
5. Database Schema
6. AI Cognitive Architecture
7. AI Reasoning Engine & Decision Algorithms
8. Product Requirements Document (PRD)
9. UI/UX Specification
10. Integration Specification
11. Automation Engine
12. Life Event Engine
13. AI Chief of Staff Specification
14. Content Studio
15. AI Prompt Library

**Interpretation Rule:** the hierarchy represents architectural authority, not implementation order. Higher-ranked documents define constraints lower-ranked documents must respect. Lower-ranked documents may specialize or extend a higher one but may never contradict it unless the higher document explicitly delegates that authority. Conflicts are escalated, never silently resolved.

**Document Responsibilities:** each document owns exactly one concern (Product Vision → philosophy/mission/principles; Engineering Standards & Governance → process/coding/quality gates; System Architecture → services/boundaries/infrastructure; Domain Model → canonical objects/relationships/lifecycle; Database Schema → physical persistence; AI Cognitive Architecture → memory/cognition/learning; AI Reasoning Engine → decision algorithms/scoring; PRD → functional/non-functional requirements; UI/UX → interaction/navigation/experience; Integration Specification → external connectivity; Automation Engine → workflow execution; Life Event Engine → event detection/lifecycle; AI Chief of Staff → AI identity/responsibilities/initiative; Content Studio → creator workflows; AI Prompt Library → prompt composition/orchestration).

---

## Round 7 — Post-Milestone-0 Cleanup

Resolves all five Blocking findings (B1–B5) raised in the Milestone-0-era `architecture-compliance-report.md`.

**1. Constitution Domain — final and authoritative.**

Constitutions are canonical, first-class objects — not configuration files. A new Area is added to the Life Space (updates the Round 6 table, which had 7 Life Areas; it now has 8):

| Space | Areas |
|---|---|
| **Life** | Health, Finance, Relationships, Learning, Travel, Home, Personal, **Constitution** |

The **Constitution** Area contains three object types, all inheriting the Universal Base Object: `ProductConstitution`, `AIConstitution`, `PersonalConstitution`. Product Constitution and AI Constitution are effectively immutable except through explicit architectural revision (Engineering Standards §25's Architectural Change Process); Personal Constitution is versioned and evolves only through explicit user approval (consistent with Round 4, Decision 5 and Round 4, Decision 9).

Constitutions must exist consistently across the Canonical Object Registry, Domain Model, Database Schema, Knowledge Graph, Search, AI Memory, APIs, and UI — not merely as an AI-internal concept. The Canonical Object Registry (Round 1, Decision 1) gains a new domain group:

- **Constitution:** ProductConstitution, AIConstitution, PersonalConstitution, PersonalConstitutionVisionStatement, PersonalConstitutionIdentityStatement, PersonalConstitutionValue, PersonalConstitutionNonNegotiable, PersonalConstitutionDecisionPrinciple, PersonalConstitutionBoundary, PersonalConstitutionSuccessDefinition, PersonalConstitutionVersion

(The eight `PersonalConstitution*` sub-entities are the Database Schema's original Module 23 normalized tables, now formally registered as objects rather than existing only as unregistered schema.)

**2. Priority Enum — final and authoritative.**

Resolves the value set that Round 4, Decision 1 named but never defined, and that the universal `Priority` object field (Round 2, Decision 3) has needed since Milestone 1's Object Service was scaffolded:

| Value | Definition |
|---|---|
| `LOW` | Nice to do; minimal consequence if delayed |
| `MEDIUM` | Important but not urgent |
| `HIGH` | Important and time-sensitive |
| `CRITICAL` | Immediate attention required; significant consequences if delayed |

Single source of truth for Priority across every system.

**3. Risk Enum — final and authoritative.**

Resolves the other half of the same gap:

| Value | Definition |
|---|---|
| `MINIMAL` | No meaningful downside |
| `LOW` | Small negative impact possible |
| `MODERATE` | Meaningful downside exists; review recommended |
| `HIGH` | Large downside possible; approval normally required |
| `CRITICAL` | Severe consequences possible; explicit approval always required |

Canonical Risk taxonomy for the entire platform, including the Trust & Authorization Service's `actionRiskLevel` input and the Automation Authorization Matrix (Round 3, Decision 11).

**4. Journal Area Placement — final and authoritative.**

Journal's canonical home is `Life → Personal`. It remains freely linkable to any object through the Knowledge Graph (Health, Goals, Relationships, Life Events, Projects, etc.) — the canonical home determines where it lives structurally; its relationships may span the entire system. This is the concrete resolution the "everything has one home" principle (Domain Model, Principle One) requires: one home, unlimited connections.

**5. Health Domain Reconciliation — final and authoritative.**

The Canonical Object Registry's Health domain group (under `Life → Health`) is replaced with this canonical list, superseding both the original Round 1 registry entries and the Database Schema's original 9-table module:

`Habit, HabitLog, Workout, SleepRecord, Meal, Medication, HealthMetric, HealthGoal, HealthCheckIn`

Every health object must appear consistently across the Registry, Domain Model, Database Schema, APIs, Search, Knowledge Graph, AI Memory, UI, Automation Engine, and Life Event Engine — exactly one canonical definition per object, no per-document variation.

**6. Legal Document Object — final and authoritative.**

`LegalDocument` is added to the Canonical Object Registry, placed at `Life → Personal` alongside Journal. Covers Contracts, Agreements, NDAs, Licenses, Legal Records, Government Documents. Must appear consistently across the Registry, Domain Model, Database Schema, APIs, Search, Knowledge Graph, AI Memory, Integrations, and UI — this is the formal object the Integration Specification's `Contract → Legal Document` mapping (§5 there) always assumed but never had a registered home for.

---

## Round 8 — Object Model Clarification (raised during Milestone 1 implementation)

Amends Round 1, Decision 1. While building the Object Service, it became clear that the Canonical Object Registry's "Core Objects" domain group listed a standalone `Object` entry with no stated meaning, and no other document ever modeled a literal shared `Object` table that concrete types (Task, Goal, etc.) inherit from — every concrete type is its own table carrying the universal base fields directly.

**Decision:** There is no canonical `Object` database table. "Object" was always meant as the architectural abstraction — the shared contract every first-class entity follows — not a persistent entity itself. The Universal Base Object (Round 2, Decision 3) defines the required fields every concrete object must carry; the Knowledge Graph, Search, AI Memory, Automation Engine, and APIs treat all concrete object types uniformly through that shared contract, not through table inheritance.

The Canonical Object Registry's Core Objects domain group is corrected:

- **Core Objects:** User, Workspace, **Universal Base Object (architectural abstraction — not a database table)**, Folder, Tag, Label

**Implementation mechanism (engineering decision, not further architecture):** since Prisma has no model inheritance, the Universal Base Object contract is enforced two ways rather than via a shared table: (1) every concrete Prisma model repeats the universal fields directly as columns, consistent with how the Database Schema document always modeled per-type tables; (2) a shared TypeScript interface (`UniversalBaseObject`, in `@lifeos/domain-model`) declares the contract, and each concrete type's generated Prisma type is asserted against it in tests — so drift between a model and the contract is caught at build/test time rather than relying on manual discipline alone. No architectural revision is needed for this — it is a standard implementation pattern for a documented contract, not a new object-modeling decision.

Do not create an `Object` database table unless a future architectural revision explicitly introduces one for a demonstrated technical need.

---

## Round 9 — AI Provider Interface Classification Gate (raised during Milestone 1 implementation)

Flags an inference, not a contradiction — same convention as the Architecture Compliance Report's R5 finding (non-blocking, confirm when convenient).

While implementing the AI Provider Interface (`ai/providers`), Round 3 Decision 8 ("Data Classification Enforcement... the AI Provider Interface validates classification before every external AI request; protected objects never leave the approved execution environment without explicit user authorization") required a concrete rule: which of the four Data Classification tiers (Round 1, Decision 4) count as "protected" and therefore need that explicit authorization, versus which are already cleared for AI use.

**Reading applied:** Decision 4 names Tier 3 "AI Available" and states only Tier 3 "may be shared with AI services," with Tier 4 "safe for integrations/publishing." Tier 2 ("Private") is described only in terms of cloud storage sync and on-demand summarization — never AI sharing — and Tier 1 ("Local Only") explicitly requires approval for any transmission. On that basis, the AI Provider Interface's classification gate (`ai/providers/src/classification-gate.ts`) treats Tiers 1 and 2 as requiring an explicit per-request `authorizedForExternalAI` flag before any external provider call, and Tiers 3 and 4 as needing none.

**Impact:** Low for Milestone 1 (no domain data yet generates Tier 2 content routinely). Becomes materially important from Milestone 2 onward, since Health, Finance, and Legal objects — all Tier 2 by Decision 4 — are exactly the kind of data the AI is expected to reason over routinely in later milestones. If the intent was instead that Tier 2 content may flow to AI by default (e.g., "summarized only when necessary" was meant to describe the AI-facing behavior, not just cloud sync), this gate will need a one-line correction before that domain work begins.

**Recommended resolution path:** A one-line confirmation of this reading (or a correction) before Milestone 2's domain modules start generating Tier 2 content the AI needs routine access to.

---

## Round 10 — Personal Constitution Data Classification (raised during Milestone 1 implementation, user-decided)

While wiring the Chief of Staff orchestrator to consult the Personal Constitution (required on every reasoning pass per the Three-Constitution model), Round 9's classification gate surfaced a genuine contradiction rather than a mere inference: `PersonalConstitution` and its 7 sub-entities (vision statements, identity statements, values, non-negotiables, decision principles, boundaries, success definitions) had been defaulted to **Data Classification Tier 1 (Local Only)** when the Constitution schema was built — a choice made in isolation, never checked against Round 1 Decision 4's tiers, and never discussed. Under Round 9's gate, Tier 1 content cannot reach the external AI Provider Interface without per-request explicit authorization — which would have made the Chief of Staff unable to consult the Personal Constitution without the user re-authorizing on every single message, directly contradicting "the AI must be functional with zero Personal Constitution data" (Round 4 Decision 5) and the product's core premise.

This was presented to the user as a genuine architectural contradiction (not resolved unilaterally), with three options: reclassify to Tier 3, keep Tier 1 with one-time onboarding consent, or keep Tier 1 with per-message authorization.

**Decision:** Reclassify `PersonalConstitution` and all 7 sub-entities' default `classification` from Tier 1 to **Tier 3 (AI Available)**. Rationale: the Personal Constitution's entire purpose is to be consulted by the AI — unlike Tier 1's actual stated examples (raw journal entries, passwords, API keys, encryption keys, auth tokens), it is content the user deliberately writes for the AI's use. This is consistent with `ProductConstitution` and `AIConstitution`, both already Tier 3 by the same reasoning. No per-message or onboarding-consent gate is needed for Constitution content specifically.

**Implementation:** `packages/db/prisma/schema.prisma` — all 8 models' `classification` default changed from 1 to 3 (migration `20260726093417_personal_constitution_tier3`, which also backfills any pre-existing rows created under the old default). This does not change Round 1 Decision 4's tier definitions or Round 9's gate logic — only corrects which tier the Personal Constitution's own objects were assigned to.

---

## Round 11 — Search Service Corrected to Use Service Interfaces, Not Direct Database Access (implementation defect, self-corrected)

While building the Search Service, it was initially implemented with its own Prisma connection querying the `folder`, `tag`, `label`, Personal Constitution sub-entity, and `memoryEntry` tables directly — reasoning (incorrectly) that since every Milestone 1 service already shares one physical Postgres database behind `@lifeos/db`, direct cross-table access was consistent with existing practice. It is not: `engineering-roadmap.md` §8 (API Strategy) states plainly, "internal services never share a database directly — only through service interfaces." No other Milestone 1 service reads a table it doesn't own; Search Service was the first and only violation, introduced and caught within the same implementation session, before being presented as complete.

**Correction:** Search Service now composes every result from the Object Service's and AI Memory Service's own HTTP APIs, forwarding the caller's session credentials (the same pattern already used by the AI orchestrator's client services), and holds no Prisma dependency at all. This required two small, non-breaking additions to the owning services: an optional `?q=` keyword filter on Object Service's `GET /folders`, `GET /tags`, `GET /labels`, and a new `GET /memories/search?q=` endpoint on AI Memory Service. Personal Constitution search still fetches the existing `GET /constitution/personal` response wholesale and filters in-process within Search Service, since that collection is inherently small per user — no new endpoint was needed there.

No user decision was required here: this was an unambiguous violation of an already-stated rule with a clear, mechanical fix, not a case of competing valid interpretations. Recorded per the same self-correction precedent as catching the null-byte bug in the Knowledge Graph Service's traversal endpoint during Milestone 1 — flagged so it's visible in the decision record, not silently fixed and forgotten.

---

## Status

Version 1 of the LifeOS architecture is **frozen** as of this document. Every decision above is a technical contract. Architecture changes require the Architectural Change Process (Engineering Standards §25: description, motivation, alternatives considered, impact analysis, migration strategy, risks, rollback plan) and explicit user approval — no exceptions, no silent drift.

See `docs/architecture-compliance-report.md` for the pre-implementation consistency audit against this consolidated decision set.
