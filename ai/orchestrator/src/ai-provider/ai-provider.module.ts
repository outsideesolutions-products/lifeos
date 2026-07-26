import { Module } from '@nestjs/common';
import { AIProviderGateway, OpenAIProvider } from '@lifeos/ai-providers';

export const AI_PROVIDER_GATEWAY = Symbol('AI_PROVIDER_GATEWAY');

/**
 * Wires the AI Provider Interface (ai/providers) as a NestJS singleton.
 * OpenAI is the only configured provider in Milestone 1 (Batch 1 Decision
 * 5) — adding a fallback provider later means adding it to this one array,
 * with no change anywhere else in the orchestrator.
 */
@Module({
  providers: [
    {
      provide: AI_PROVIDER_GATEWAY,
      useFactory: () =>
        new AIProviderGateway({ providers: [new OpenAIProvider()] }),
    },
  ],
  exports: [AI_PROVIDER_GATEWAY],
})
export class AiProviderModule {}
