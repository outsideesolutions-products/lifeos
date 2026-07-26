import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { SessionGuard, AuthenticatedActor } from '../auth/session.guard';
import { CurrentActor } from '../auth/current-actor.decorator';

@Controller('onboarding')
@UseGuards(SessionGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  getStatus(@CurrentActor() actor: AuthenticatedActor) {
    return this.onboardingService.getStatus(actor);
  }

  @Post('complete')
  complete(@CurrentActor() actor: AuthenticatedActor) {
    return this.onboardingService.complete(actor);
  }

  @Post('dismiss')
  dismiss(@CurrentActor() actor: AuthenticatedActor) {
    return this.onboardingService.dismiss(actor);
  }
}
