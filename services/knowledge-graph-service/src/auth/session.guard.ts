import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthenticatedActor {
  type: 'user';
  id: string;
  workspaceId: string;
}

/**
 * Identical pattern to object-service's SessionGuard — see that service's
 * copy for the full rationale (delegates session validation to the
 * Identity Service rather than re-implementing Better Auth's cookie
 * verification). Duplicated rather than shared because there is no
 * `/packages/common` yet and three services independently needing ~40
 * lines each doesn't yet justify extracting one (see
 * trust-authorization-service's json-logger.service.ts for the same
 * judgment call made in Milestone 0).
 */
@Injectable()
export class SessionGuard implements CanActivate {
  private readonly identityServiceUrl =
    process.env.IDENTITY_SERVICE_URL ?? 'http://localhost:4003';

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookieHeader = request.headers['cookie'];
    const authHeader = request.headers['authorization'];

    if (!cookieHeader && !authHeader) {
      throw new UnauthorizedException('No session credentials provided');
    }

    const response = await fetch(
      `${this.identityServiceUrl}/api/auth/get-session`,
      {
        headers: {
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
          ...(authHeader ? { authorization: authHeader } : {}),
        },
      },
    );

    if (!response.ok) {
      throw new UnauthorizedException('Session validation failed');
    }

    const body = (await response.json()) as {
      user?: { id: string };
    } | null;

    if (!body?.user?.id) {
      throw new UnauthorizedException('No active session');
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { ownerId: body.user.id, deletedAt: null },
    });

    if (!workspace) {
      throw new UnauthorizedException(
        'No workspace provisioned for this user',
      );
    }

    const actor: AuthenticatedActor = {
      type: 'user',
      id: body.user.id,
      workspaceId: workspace.id,
    };
    request.actor = actor;
    return true;
  }
}
