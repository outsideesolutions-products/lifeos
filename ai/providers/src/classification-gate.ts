import { DataClassificationTier } from '@lifeos/domain-model';

/**
 * Which tiers may leave the local execution environment for an external AI
 * provider without explicit per-request authorization.
 *
 * Basis for this reading (flagging the inference, per the same convention
 * as the Architecture Compliance Report's R5 finding): Round 1 Decision 4
 * names Tier 3 "AI Available" and states only Tier 3 "may be shared with AI
 * services" and Tier 4 is "safe for integrations/publishing." Tier 2
 * ("Private") is described only in terms of cloud storage sync, never AI
 * sharing, and Tier 1 ("Local Only") explicitly requires explicit approval
 * for any transmission. Round 3 Decision 8 then requires that "protected
 * objects never leave the approved execution environment without explicit
 * user authorization" — read here as covering Tiers 1 and 2 (neither is
 * granted blanket AI availability by Decision 4), while Tiers 3 and 4 need
 * no per-request authorization since Decision 4 already clears them for
 * exactly this purpose. This is an implementation inference, not a stated
 * decision — non-blocking for Milestone 1, but worth a one-line confirmation
 * before Milestone 2+ builds features (e.g. Health, Finance) that generate
 * mostly Tier 2 content the AI needs to reason over routinely.
 */
const TIERS_REQUIRING_EXPLICIT_AUTHORIZATION: ReadonlySet<DataClassificationTier> =
  new Set([1, 2]);

export class AIClassificationViolationError extends Error {
  constructor(readonly dataClassificationTier: DataClassificationTier) {
    super(
      `Data Classification Tier ${dataClassificationTier} content requires ` +
        'explicit user authorization (authorizedForExternalAI) before it ' +
        'may be sent to an external AI provider.',
    );
    this.name = 'AIClassificationViolationError';
  }
}

/** Throws AIClassificationViolationError if the request isn't cleared to
 * leave the local execution environment. Called by AIProviderGateway before
 * every provider invocation — never bypassed by callers. */
export function enforceClassification(
  dataClassificationTier: DataClassificationTier,
  authorizedForExternalAI: boolean | undefined,
): void {
  if (
    TIERS_REQUIRING_EXPLICIT_AUTHORIZATION.has(dataClassificationTier) &&
    authorizedForExternalAI !== true
  ) {
    throw new AIClassificationViolationError(dataClassificationTier);
  }
}
