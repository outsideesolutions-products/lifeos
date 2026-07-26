import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';

@Controller('search')
@UseGuards(SessionGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') query: string | undefined,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter "q" is required');
    }
    return this.searchService.search(query.trim(), actor);
  }
}
