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
 * Validates the caller's Better Auth session and resolves their single
 * personal workspace (Round 1 Decision 3). Delegates the actual session
 * validation to the Identity Service's own `/api/auth/get-session`
 * endpoint rather than re-implementing Better Auth's session-cookie
 * verification here — Better Auth signs its session cookies, and
 * duplicating that logic in a second service would be exactly the kind of
 * unnecessary complexity/fragility the Engineering Standards ask to avoid.
 *
 * Object Service still resolves the Workspace directly against the shared
 * database (not through another Identity Service call) since Workspace is
 * this service's own domain, not Identity's.
 *
 * Milestone 1 scope: only human user sessions are accepted. AI/automation/
 * integration actors don't call this API directly yet (there is no
 * Automation Engine or Integration Layer until Milestone 3) — see the
 * class doc on ObjectsWriteGuard-adjacent controllers for how AI-initiated
 * reads are handled by the Chief of Staff instead.
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
