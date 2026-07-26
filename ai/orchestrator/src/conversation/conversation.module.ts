import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { ConstitutionModule } from '../constitution/constitution.module';
import { MemoryModule } from '../memory/memory.module';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { PromptComposer } from '../prompt/prompt-composer';

@Module({
  imports: [ConstitutionModule, MemoryModule, AiProviderModule],
  controllers: [ConversationController],
  providers: [ConversationService, PromptComposer],
})
export class ConversationModule {}
