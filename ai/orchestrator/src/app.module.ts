import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [HealthModule, ConversationModule],
})
export class AppModule {}
