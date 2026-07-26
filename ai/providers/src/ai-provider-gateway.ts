import {
  AIGenerationRequest,
  AIGenerationResult,
  AIProvider,
} from './ai-provider.interface';
import { enforceClassification } from './classification-gate';

export class AIProviderExhaustedError extends Error {
  constructor(readonly causes: unknown[]) {
    super(
      `All ${causes.length} configured AI provider(s) failed. Last error: ` +
        `${causes[causes.length - 1] instanceof Error ? (causes[causes.length - 1] as Error).message : String(causes[causes.length - 1])}`,
    );
    this.name = 'AIProviderExhaustedError';
  }
}

export interface AIProviderGatewayConfig {
  /** Ordered primary-first list. On failure the gateway tries the next
   * entry, per Batch 1 Decision 5's "fallback providers supported." */
  providers: AIProvider[];
}

/**
 * The AI Provider Interface itself (Batch 1 Decision 5 / Round 3 Decision 8).
 * This is the single entry point every caller in LifeOS uses to reach an
 * external AI provider — no business logic (the Chief of Staff, specialist
 * agents, or anything else) may import a concrete provider (e.g.
 * OpenAIProvider) directly. That keeps the vendor swappable and guarantees
 * the classification gate below can never be bypassed.
 */
export class AIProviderGateway {
  private readonly providers: AIProvider[];

  constructor(config: AIProviderGatewayConfig) {
    if (config.providers.length === 0) {
      throw new Error('AIProviderGateway requires at least one provider.');
    }
    this.providers = config.providers;
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    enforceClassification(
      request.dataClassificationTier,
      request.authorizedForExternalAI,
    );

    const causes: unknown[] = [];
    for (const provider of this.providers) {
      try {
        const result = await provider.generate(request);
        return { ...result, provider: provider.name };
      } catch (error) {
        causes.push(error);
      }
    }

    throw new AIProviderExhaustedError(causes);
  }
}
