import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedActor } from './session.guard';

/** Only valid on routes protected by SessionGuard, which populates
 * `request.actor`. */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedActor => {
    return ctx.switchToHttp().getRequest().actor;
  },
);
