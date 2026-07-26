/**
 * The seven inputs the Security by Default principle (Round 3) requires
 * every authorization decision to combine. In this Milestone 0 skeleton,
 * most of these are optional/unknown because the systems that would supply
 * real values (Identity Service, Automation Service, Integration Layer)
 * don't exist until later milestones. Per Security by Default — "every
 * action is unauthorized until explicitly proven safe" — any input left
 * unknown pushes the decision toward REQUIRE_APPROVAL rather than ALLOW.
 * See AuthorizationService.evaluate() and this service's README for how
 * that fail-safe default is applied, and for what real policy logic
 * Milestones 1-3 need to add here as each input becomes available.
 */
export interface AuthorizationInputs {
  /** Identity — who/what is making the request. Always required. */
  actorType: 'user' | 'ai' | 'automation' | 'integration' | 'system';
  actorId?: string;

  /** What is being attempted. Always required. */
  actionType: string;
  objectType?: string;
  objectId?: string;

  /** Integration Trust Level (Verified/Trusted/Limited/Experimental) —
   * unknown until the Integration Layer (Milestone 3) supplies it. */
  integrationTrustLevel?: 'VERIFIED' | 'TRUSTED' | 'LIMITED' | 'EXPERIMENTAL';

  /** Object Data Classification tier (Round 1, Decision 4) — unknown until
   * the object being acted on is registered (Milestone 1+). */
  dataClassificationTier?: 1 | 2 | 3 | 4;

  /** Action Risk Level — value set is now canonical (Round 7, Decision 3:
   * MINIMAL/LOW/MODERATE/HIGH/CRITICAL; see architecture-decisions.md).
   * Still typed as a plain string here rather than that literal union: the
   * policy that actually uses these values (the full Automation
   * Authorization Matrix, Round 3 Decision 11) isn't implemented until
   * Milestone 3, alongside the Automation Engine and Integration Layer
   * that supply the other three matrix inputs below. Tightening this type
   * is deferred to that implementation work, not blocked on anything
   * further. */
  actionRiskLevel?: string;

  /** Automation Permission Level (Observe/Recommend/Execute/Autonomous) —
   * unknown until the Automation Engine (Milestone 3) supplies it. */
  automationPermissionLevel?:
    | 'OBSERVE'
    | 'RECOMMEND'
    | 'EXECUTE'
    | 'AUTONOMOUS';

  /** User Preferences relevant to this action — unknown until user
   * preference storage exists (Milestone 1+). */
  userPreferences?: Record<string, unknown>;

  /** Current Context (calendar load, active Life Events, focus mode, etc.)
   * — unknown until the Context Builder exists (Milestone 3). */
  currentContext?: Record<string, unknown>;

  requestId: string;
  workspaceId?: string;
}
