import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { SecretsService } from './secrets.service';
import { CreateSecretDto } from './dto/create-secret.dto';
import { RotateSecretDto } from './dto/rotate-secret.dto';
import { CurrentActor, Actor } from '../common/actor.decorator';

@Controller('secrets')
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  @Post()
  create(@Body() dto: CreateSecretDto, @CurrentActor() actor: Actor) {
    return this.secretsService.create(dto, actor);
  }

  @Get()
  list(@Query('scope') scope?: string) {
    return this.secretsService.list(scope);
  }

  // Internal, service-to-service only — see the gating note in
  // SecretsService.getValue(). Deliberately returns 404 rather than 403 for
  // unknown/revoked ids so callers can't distinguish "doesn't exist" from
  // "not authorized," consistent with least-information-disclosure practice.
  @Get(':id/value')
  async getValue(@Param('id') id: string, @CurrentActor() actor: Actor) {
    try {
      const value = await this.secretsService.getValue(id, actor);
      return { value };
    } catch {
      throw new NotFoundException();
    }
  }

  @Post(':id/rotate')
  rotate(
    @Param('id') id: string,
    @Body() dto: RotateSecretDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.secretsService.rotate(id, dto.value, actor);
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.secretsService.revoke(id, actor);
  }
}
