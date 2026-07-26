import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MemoryType } from '@lifeos/db';
import { MemoriesService } from './memories.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';

const MEMORY_TYPE_VALUES = Object.values(MemoryType);

@Controller('memories')
@UseGuards(SessionGuard)
export class MemoriesController {
  constructor(private readonly memoriesService: MemoriesService) {}

  @Post()
  create(
    @Body() dto: CreateMemoryDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.memoriesService.create(dto, actor);
  }

  @Get()
  findByType(
    @Query('type') type: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!type || !MEMORY_TYPE_VALUES.includes(type as MemoryType)) {
      throw new BadRequestException(
        `type must be one of: ${MEMORY_TYPE_VALUES.join(', ')}`,
      );
    }
    return this.memoriesService.findByType(type as MemoryType, actor);
  }

  @Get('search')
  search(
    @Query('q') query: string | undefined,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.memoriesService.search(query.trim(), actor);
  }

  @Post(':id/touch')
  touch(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.memoriesService.touch(id, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.memoriesService.remove(id, actor);
  }
}
