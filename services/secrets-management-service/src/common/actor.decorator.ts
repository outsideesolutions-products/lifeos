import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface Actor {
  type: string; // "user" | "ai" | "automation" | "integration" | "system"
  id?: string;
}

/**
 * TEMPORARY: reads the calling actor from headers until the Identity
 * Service and real request-authentication middleware exist (Milestone 1).
 * Every write path in this service must know who/what is acting, per the
 * Secret/Trust audit logging requirements — this decorator exists so that
 * requirement isn't silently skipped while auth is still being built.
 */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor => {
    const req = ctx.switchToHttp().getRequest();
    return {
      type: (req.headers['x-actor-type'] as string) ?? 'system',
      id: req.headers['x-actor-id'] as string | undefined,
    };
  },
);
