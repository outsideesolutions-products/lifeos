import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { SendMessageDto } from './dto/send-message.dto';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';

@Controller('conversation')
@UseGuards(SessionGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  send(
    @Body() dto: SendMessageDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.conversationService.converse(dto, actor);
  }
}
