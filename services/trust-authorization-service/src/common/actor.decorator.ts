import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface Actor {
  type: string; // "user" | "ai" | "automation" | "integration" | "system"
  id?: string;
}

/** TEMPORARY, see secrets-management-service's identical decorator for the
 * rationale — real authentication lands with the Identity Service in
 * Milestone 1. */
export const CurrentActor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Actor => {
    const req = ctx.switchToHttp().getRequest();
    return {
      type: (req.headers['x-actor-type'] as string) ?? 'system',
      id: req.headers['x-actor-id'] as string | undefined,
    };
  },
);
