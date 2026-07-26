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
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { SessionGuard } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';
import { AuthenticatedActor } from '../auth/session.guard';

@Controller('folders')
@UseGuards(SessionGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  create(@Body() dto: CreateFolderDto, @CurrentActor() actor: AuthenticatedActor) {
    return this.foldersService.create(dto, actor);
  }

  @Get()
  findAll(
    @CurrentActor() actor: AuthenticatedActor,
    @Query('q') query?: string,
  ) {
    return this.foldersService.findAll(actor, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.foldersService.findOne(id, actor);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFolderDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.foldersService.update(id, dto, actor);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.foldersService.archive(id, actor);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentActor() actor: AuthenticatedActor) {
    return this.foldersService.remove(id, actor);
  }
}
