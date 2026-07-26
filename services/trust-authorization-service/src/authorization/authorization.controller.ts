import { Body, Controller, Post } from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { AuthorizeRequestDto } from './dto/authorize-request.dto';

@Controller('authorize')
export class AuthorizationController {
  constructor(private readonly authorizationService: AuthorizationService) {}

  @Post()
  async authorize(@Body() dto: AuthorizeRequestDto) {
    return this.authorizationService.evaluate(dto);
  }
}
