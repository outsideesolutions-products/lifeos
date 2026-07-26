import { DataClassificationTier } from '@lifeos/domain-model';

/**
 * Task-size routing tiers (Batch 1 Decision 5: "Intelligent routing by task
 * size — lightweight/reasoning/large-context models"). Milestone 1 wires
 * only OpenAI, and the AIProviderGateway maps every tier to a configurable
 * model on that one provider (trivial routing, per the Engineering Roadmap's
 * "routing hook present but trivial until more providers exist"). The tiers
 * themselves are real from day one so callers (the Chief of Staff and its
 * specialist agents) never need to change call sites when a second provider
 * or genuinely differentiated per-tier models arrive.
 */
export const AI_MODEL_TIERS = ['LIGHTWEIGHT', 'REASONING', 'LARGE_CONTEXT'] as const;
export type AIModelTier = (typeof AI_MODEL_TIERS)[number];

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIGenerationRequest {
  messages: AIMessage[];

  /** Defaults to REASONING if omitted — see AIProviderGateway. */
  tier?: AIModelTier;

  maxOutputTokens?: number;
  temperature?: number;

  /**
   * The Data Classification tier (Round 1 Decision 4) of the most
   * restrictive object contributing content to `messages`. Required on
   * every request — there is no default, per Security by Default ("every
   * action is unauthorized until explicitly proven safe"). The gateway
   * rejects Tier 1/2 requests unless `authorizedForExternalAI` is also set.
   */
  dataClassificationTier: DataClassificationTier;

  /**
   * Explicit user authorization to transmit Tier 1 (Local Only) or Tier 2
   * (Private) content to an external AI provider, per Round 3 Decision 8
   * ("protected objects never leave the approved execution environment
   * without explicit user authorization"). Ignored for Tier 3/4 requests,
   * which are AI-available by definition. Never default this to true.
   */
  authorizedForExternalAI?: boolean;

  /** Correlates this call with logs/audit trails, same convention as the
   * Trust & Authorization Service's `requestId`. */
  requestId: string;
}

export interface AIGenerationUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIGenerationResult {
  content: string;
  provider: string;
  model: string;
  tier: AIModelTier;
  finishReason: string;
  usage?: AIGenerationUsage;
}

/**
 * The contract every vendor implementation (OpenAI, and in future
 * Anthropic/Google/local models) must satisfy. No business logic anywhere
 * in LifeOS may depend on a vendor-specific API — everything calls through
 * an AIProvider, normally via the AIProviderGateway rather than a concrete
 * provider directly.
 */
export interface AIProvider {
  readonly name: string;

  /** Resolves the concrete model name this provider will use for a tier,
   * for logging/audit purposes — does not perform the request. */
  modelForTier(tier: AIModelTier): string;

  generate(
    request: AIGenerationRequest,
  ): Promise<Omit<AIGenerationResult, 'provider'>>;
}
