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
import { RelationshipsService } from './relationships.service';
import { CreateRelationshipDto } from './dto/create-relationship.dto';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';

@Controller('relationships')
@UseGuards(SessionGuard)
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Post()
  create(
    @Body() dto: CreateRelationshipDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.relationshipsService.create(dto, actor);
  }

  @Get()
  findForObject(
    @Query('objectType') objectType: string,
    @Query('objectId') objectId: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!objectType || !objectId) {
      throw new BadRequestException('objectType and objectId are required');
    }
    return this.relationshipsService.findForObject(
      { objectType, objectId },
      actor,
    );
  }

  @Get('traverse')
  traverse(
    @Query('objectType') objectType: string,
    @Query('objectId') objectId: string,
    @Query('depth') depth: string | undefined,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!objectType || !objectId) {
      throw new BadRequestException('objectType and objectId are required');
    }
    const maxDepth = Math.min(Math.max(parseInt(depth ?? '2', 10) || 2, 1), 5);
    return this.relationshipsService.traverse(
      { objectType, objectId },
      maxDepth,
      actor,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.relationshipsService.remove(id, actor);
  }
}
