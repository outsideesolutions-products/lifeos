import {
  AIGenerationRequest,
  AIGenerationResult,
  AIModelTier,
  AIProvider,
} from './ai-provider.interface';

export interface OpenAIProviderConfig {
  apiKey?: string;
  /** Per-tier model overrides. Any tier left unset falls back to
   * OPENAI_MODEL_<TIER>, then to the single OPENAI_MODEL default — this is
   * the "routing hook present but trivial" scaffold from the roadmap: every
   * tier can resolve to the same model today without the routing mechanism
   * itself needing to change once tiers get real per-model assignments. */
  models?: Partial<Record<AIModelTier, string>>;
  fetchImpl?: typeof fetch;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  private readonly apiKey: string;
  private readonly models: Record<AIModelTier, string>;
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;

  constructor(config: OpenAIProviderConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.OPENAI_API_KEY ?? '';
    const defaultModel = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    this.models = {
      LIGHTWEIGHT:
        config.models?.LIGHTWEIGHT ??
        process.env.OPENAI_MODEL_LIGHTWEIGHT ??
        defaultModel,
      REASONING:
        config.models?.REASONING ??
        process.env.OPENAI_MODEL_REASONING ??
        defaultModel,
      LARGE_CONTEXT:
        config.models?.LARGE_CONTEXT ??
        process.env.OPENAI_MODEL_LARGE_CONTEXT ??
        defaultModel,
    };
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  modelForTier(tier: AIModelTier): string {
    return this.models[tier];
  }

  async generate(
    request: AIGenerationRequest,
  ): Promise<Omit<AIGenerationResult, 'provider'>> {
    if (!this.apiKey) {
      throw new Error(
        'OpenAIProvider is not configured: OPENAI_API_KEY is empty.',
      );
    }

    const tier = request.tier ?? 'REASONING';
    const model = this.modelForTier(tier);

    const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        ...(request.maxOutputTokens !== undefined
          ? { max_tokens: request.maxOutputTokens }
          : {}),
        ...(request.temperature !== undefined
          ? { temperature: request.temperature }
          : {}),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI request failed with status ${response.status}: ${errorBody}`,
      );
    }

    const body = (await response.json()) as {
      choices?: {
        message?: { content?: string };
        finish_reason?: string;
      }[];
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    const choice = body.choices?.[0];
    if (!choice) {
      throw new Error('OpenAI response contained no choices.');
    }

    return {
      content: choice.message?.content ?? '',
      model,
      tier,
      finishReason: choice.finish_reason ?? 'unknown',
      ...(body.usage
        ? {
            usage: {
              promptTokens: body.usage.prompt_tokens,
              completionTokens: body.usage.completion_tokens,
              totalTokens: body.usage.total_tokens,
            },
          }
        : {}),
    };
  }
}
