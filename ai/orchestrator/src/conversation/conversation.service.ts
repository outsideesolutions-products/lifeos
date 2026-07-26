import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MemoryType } from '@lifeos/db';
import { AIProviderGateway } from '@lifeos/ai-providers';
import { AI_PROVIDER_GATEWAY } from '../ai-provider/ai-provider.module';
import { ConstitutionClientService } from '../constitution/constitution-client.service';
import { MemoryClientService } from '../memory/memory-client.service';
import { PromptComposer } from '../prompt/prompt-composer';
import { AuthenticatedActor } from '../auth/session.guard';
import { SendMessageDto } from './dto/send-message.dto';

/** How many of the most recent Working Memory entries feed the Current
 * Context layer (§8's Context Builder principle: "retrieve only what is
 * relevant" — an unbounded conversation history would grow the prompt
 * indefinitely for no benefit once a conversation runs long). */
const RECENT_CONTEXT_MEMORY_LIMIT = 10;

export interface ConversationTurnResult {
  response: string;
  coldStartPhase: string;
}

/**
 * The single-agent conversational loop (AI Prompt Library §28): Understand
 * -> Gather Context -> Reason -> Recommend -> Act -> Learn. This is the
 * only Milestone 1 entry point into the Chief of Staff — no specialist
 * agents or Prompt Chaining (§23) exist yet, since Milestone 1 has no
 * domain data for a specialist to reason over.
 */
@Injectable()
export class ConversationService {
  constructor(
    private readonly constitutionClient: ConstitutionClientService,
    private readonly memoryClient: MemoryClientService,
    private readonly promptComposer: PromptComposer,
    @Inject(AI_PROVIDER_GATEWAY) private readonly aiProvider: AIProviderGateway,
  ) {}

  async converse(
    dto: SendMessageDto,
    actor: AuthenticatedActor,
  ): Promise<ConversationTurnResult> {
    // Understand: Milestone 1 has no separate Intent Detection component
    // (Prompt Architecture §2) or specialist catalog to route between, so
    // the user's message is handed directly into the composed prompt below
    // and understanding happens as part of the single LLM reasoning pass.

    // Gather Context: Product -> AI -> Personal Constitution (Final
    // Pre-Implementation Decisions' consultation order), plus recent
    // Working Memory for same-day conversational continuity ("Current
    // conversations" is explicitly a Working Memory example in the
    // Cognitive Architecture).
    const [product, ai, personal, recentWorkingMemory] = await Promise.all([
      this.constitutionClient.getProductConstitution(actor),
      this.constitutionClient.getAIConstitution(actor),
      this.constitutionClient.getPersonalConstitution(actor),
      this.memoryClient.findByType(MemoryType.WORKING, actor),
    ]);
    const recentContext = recentWorkingMemory.slice(
      0,
      RECENT_CONTEXT_MEMORY_LIMIT,
    );
    await Promise.all(
      recentContext.map((entry) => this.memoryClient.touch(entry.id, actor)),
    );

    // Reason: compose the full prompt and call the AI Provider Interface.
    // Personal Constitution content is Tier 3 (AI Available) as of Round
    // 10 — no authorizedForExternalAI is needed.
    const systemPrompt = this.promptComposer.compose({
      product,
      ai,
      personal,
      recentWorkingMemory: recentContext,
    });

    const result = await this.aiProvider.generate({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: dto.message },
      ],
      tier: 'REASONING',
      dataClassificationTier: 3,
      requestId: randomUUID(),
    });

    // Recommend: the model's reply is returned to the user as-is — there
    // is no separate recommendation-formatting pass in Milestone 1.

    // Act: not applicable in Milestone 1. The Chief of Staff has no
    // autonomous execution capability yet (Executive Authority, Chief of
    // Staff Specification §5) — there are no domain objects to act on, no
    // Automation Engine, and the Trust & Authorization Service requires
    // approval for every non-human actor until its full matrix exists
    // (Milestone 3). This conversational loop only recommends.

    // Learn: record this turn as Working Memory so the next message in
    // today's conversation has continuity. Full memory-extraction ("what
    // should be forgotten," "what relationships changed") from the Memory
    // Update Prompt (§11) needs domain objects/relationships that don't
    // exist until later milestones — recording the turn itself is the
    // Milestone 1 scope for this step.
    await this.memoryClient.create(
      {
        memoryType: MemoryType.WORKING,
        content: `User: ${dto.message}\nAssistant: ${result.content}`,
        confidence: 1,
        source: 'chief-of-staff-conversation',
        importance: 1,
      },
      actor,
    );

    return { response: result.content, coldStartPhase: personal.status };
  }
}
