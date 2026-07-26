import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConstitutionService } from './constitution.service';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';
import { isValidSubEntityType } from './constitution-sub-entities';

@Controller('constitution')
@UseGuards(SessionGuard)
export class ConstitutionController {
  constructor(private readonly constitutionService: ConstitutionService) {}

  @Get('product')
  getProduct() {
    return this.constitutionService.getProductConstitution();
  }

  @Get('ai')
  getAI() {
    return this.constitutionService.getAIConstitution();
  }

  @Get('personal')
  getPersonal(@CurrentActor() actor: AuthenticatedActor) {
    return this.constitutionService.getPersonalConstitution(actor);
  }

  @Post('personal/:type')
  createItem(
    @Param('type') type: string,
    @Body() body: Record<string, unknown>,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!isValidSubEntityType(type)) {
      throw new BadRequestException(`Unknown constitution item type "${type}"`);
    }
    return this.constitutionService.createSubEntity(type, body, actor);
  }

  @Patch('personal/:type/:id')
  updateItem(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!isValidSubEntityType(type)) {
      throw new BadRequestException(`Unknown constitution item type "${type}"`);
    }
    return this.constitutionService.updateSubEntity(type, id, body, actor);
  }

  @Delete('personal/:type/:id')
  removeItem(
    @Param('type') type: string,
    @Param('id') id: string,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!isValidSubEntityType(type)) {
      throw new BadRequestException(`Unknown constitution item type "${type}"`);
    }
    return this.constitutionService.removeSubEntity(type, id, actor);
  }
}
