import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LabelsService } from './labels.service';
import { CreateLabelDto } from './dto/create-label.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';

@Controller('labels')
@UseGuards(SessionGuard)
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post()
  create(
    @Body() dto: CreateLabelDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.labelsService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentActor() actor: AuthenticatedActor,
    @Query('q') query?: string,
  ) {
    return this.labelsService.findAll(actor, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.labelsService.findOne(id, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLabelDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.labelsService.update(id, dto, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.labelsService.remove(id, actor);
  }
}
