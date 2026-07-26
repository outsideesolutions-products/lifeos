import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';

@Controller('tags')
@UseGuards(SessionGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(@Body() dto: CreateTagDto, @CurrentActor() actor: AuthenticatedActor) {
    return this.tagsService.create(dto, actor);
  }

  @Get()
  findAll(@CurrentActor() actor: AuthenticatedActor) {
    return this.tagsService.findAll(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.tagsService.findOne(id, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.tagsService.update(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.tagsService.remove(id, actor);
  }
}
