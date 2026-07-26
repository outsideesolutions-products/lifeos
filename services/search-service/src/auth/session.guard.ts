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
 * Same pattern as object-service and knowledge-graph-service — see
 * object-service's README for the full rationale. Search Service resolves
 * the Workspace directly against the shared database, same as every other
 * Milestone 1 service (there is one Postgres database and one Prisma
 * schema behind @lifeos/db; each service scopes its own queries to the
 * tables it's responsible for reading/writing by convention, not by
 * physical database separation).
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
