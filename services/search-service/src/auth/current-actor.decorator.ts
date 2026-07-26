import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedActor } from './session.guard';

export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedActor => {
    return ctx.switchToHttp().getRequest().actor;
  },
);
